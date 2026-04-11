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
 * 将 HF Hub 请求走同源代理。
 *
 * 浏览器/Worker 只访问同源 /api/hf（DevTools 里看到 localhost 是预期行为）；
 * 外网由本机 Next 进程请求 hubOrigin()（502 JSON 里的 target）。
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
    const hints: string[] = [
      "浏览器只会请求同源 http://localhost:.../api/hf/...；502 里的 target 才是 Next 服务端实际访问的外网地址。",
    ];
    if (
      /timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|fetch failed/i.test(msg)
    ) {
      hints.push(
        "当前表示运行 next dev 的这台机器连不上 target 的主机（如 Connect Timeout）。与浏览器地址栏是 localhost 无关；请检查网络/VPN/防火墙。Node 通常不自动使用系统代理。",
      );
      if (!process.env.HF_HUB_UPSTREAM && !process.env.HUGGINGFACE_HUB_ENDPOINT) {
        hints.push(
          "若 huggingface.co 不可达，可在 .env.local 设置 HF_HUB_UPSTREAM=https://hf-mirror.com 后重启 dev。",
        );
      }
    }
    return new Response(
      JSON.stringify({
        error: "hf_proxy_fetch_failed",
        message: msg,
        target,
        hints,
      }),
      { status: 502, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }
}
