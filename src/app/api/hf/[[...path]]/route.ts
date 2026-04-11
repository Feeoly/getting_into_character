import type { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Hub 根地址。国内等网络无法直连 huggingface.co 时，在 .env.local 设置例如：
 * HF_HUB_UPSTREAM=https://hf-mirror.com
 * （与 hf.co 相同路径规则，无需改 Worker）
 */
function hubOrigin(): string {
  const raw =
    process.env.HF_HUB_UPSTREAM ??
    process.env.HUGGINGFACE_HUB_ENDPOINT ??
    "https://huggingface.co";
  return raw.replace(/\/+$/, "");
}

function serializeFetchError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const parts = [e.message];
  const c = e.cause;
  if (c instanceof Error) {
    parts.push(c.message);
    const cc = c.cause;
    if (cc) parts.push(String(cc));
  } else if (c != null) {
    parts.push(String(c));
  }
  return parts.filter(Boolean).join(" | ");
}

function normalizePath(
  raw: { path?: string[] | string } | undefined,
): string[] {
  const p = raw?.path;
  if (Array.isArray(p)) return p;
  if (typeof p === "string" && p.length > 0) return [p];
  return [];
}

/**
 * 将 HF Hub 请求走同源代理，减轻 Worker 内 fetch huggingface.co 失败（Failed to fetch）的情况。
 */
export async function GET(
  req: NextRequest,
  context: { params?: Promise<{ path?: string[] | string }> | { path?: string[] | string } },
): Promise<Response> {
  const resolved = await Promise.resolve(context.params);
  const path = normalizePath(resolved);
  if (path.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const origin = hubOrigin();
  const targetPath = path.map((seg) => encodeURIComponent(seg)).join("/");
  const target = `${origin}/${targetPath}${req.nextUrl.search}`;

  const forward = new Headers();
  const ua = req.headers.get("user-agent");
  if (ua) forward.set("user-agent", ua);
  const range = req.headers.get("range");
  if (range) forward.set("range", range);
  const accept = req.headers.get("accept");
  if (accept) forward.set("accept", accept);

  try {
    const upstream = await fetch(target, {
      redirect: "follow",
      headers: forward,
      cache: "no-store",
    });

    const out = new Headers();
    const copy = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ] as const;
    for (const k of copy) {
      const v = upstream.headers.get(k);
      if (v) out.set(k, v);
    }
    out.set("cache-control", "public, max-age=86400");

    // 整包缓冲：避免部分环境下 ReadableStream 再包装导致 500 / Internal Server Error
    const body = await upstream.arrayBuffer();
    return new Response(body, { status: upstream.status, headers: out });
  } catch (e) {
    const msg = serializeFetchError(e);
    console.error("[api/hf] upstream fetch failed:", { origin, target, message: msg });
    return new Response(
      JSON.stringify({
        error: "hf_proxy_fetch_failed",
        message: msg,
        target,
        hint:
          msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")
            ? "若本机无法访问 huggingface.co，可在 .env.local 设置 HF_HUB_UPSTREAM=https://hf-mirror.com 后重启 dev"
            : undefined,
      }),
      { status: 502, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }
}
