import type { NextRequest } from "next/server";

const HF_ORIGIN = "https://huggingface.co";

/**
 * 将 HF Hub 请求走同源代理，减轻 Worker 内 fetch huggingface.co 失败（Failed to fetch）的情况。
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path = [] } = await ctx.params;
  if (path.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const targetPath = path.map((p) => encodeURIComponent(p)).join("/");
  const target = `${HF_ORIGIN}/${targetPath}${req.nextUrl.search}`;

  const forward = new Headers();
  const ua = req.headers.get("user-agent");
  if (ua) forward.set("user-agent", ua);
  const range = req.headers.get("range");
  if (range) forward.set("range", range);
  const accept = req.headers.get("accept");
  if (accept) forward.set("accept", accept);

  const upstream = await fetch(target, {
    redirect: "follow",
    headers: forward,
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

  return new Response(upstream.body, { status: upstream.status, headers: out });
}
