import type { NextRequest } from "next/server";

const HF_ORIGIN = "https://huggingface.co";

export const runtime = "nodejs";

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

  const targetPath = path.map((seg) => encodeURIComponent(seg)).join("/");
  const target = `${HF_ORIGIN}/${targetPath}${req.nextUrl.search}`;

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
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/hf] upstream fetch failed:", target, msg);
    return new Response(
      JSON.stringify({ error: "hf_proxy_fetch_failed", message: msg, target }),
      { status: 502, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }
}
