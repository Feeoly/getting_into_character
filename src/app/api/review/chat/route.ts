import { NextResponse } from "next/server";
import { z } from "zod";

import { callBailianChatCompletion } from "../../_lib/bailianChat";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(16_000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).max(40),
  /** 默认 true：流式 SSE；false 时返回整段 JSON `{ content }` */
  stream: z.boolean().optional(),
  context: z
    .object({
      question: z.string().max(8000).optional(),
      answer: z.string().max(16_000).optional(),
      transcriptExcerpt: z.string().max(24_000),
      pausesExcerpt: z.string().max(8000).optional(),
    })
    .optional(),
});

const MAX_BODY_CHARS = 32_000;

function countBodyChars(b: z.infer<typeof bodySchema>): number {
  let n = 0;
  for (const m of b.messages) n += m.content.length;
  if (b.context) {
    n += b.context.transcriptExcerpt.length;
    n += b.context.pausesExcerpt?.length ?? 0;
    n += b.context.question?.length ?? 0;
    n += b.context.answer?.length ?? 0;
  }
  return n;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "无效 JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "请求体无效", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;
  if (countBodyChars(body) > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "上下文过长" }, { status: 400 });
  }

  const useStream = body.stream !== false;

  const systemParts: string[] = [
    "你是公务员结构化面试的表达教练。用户正在复盘自己的答题录音与转写。",
    "必须基于用户提供的转写摘录与停顿信息作答；不得编造摘录中不存在的「原话」。",
    "回答请用中文，并包含：1) 可执行的改进要点（条列）；2) 示例句式或表达范例；3) 引用所给转写或停顿作为依据（简短摘录即可）。",
  ];
  if (body.context) {
    if (body.context.question) systemParts.push(`【题目/情景】\n${body.context.question}`);
    if (body.context.answer) systemParts.push(`【用户自述要点】\n${body.context.answer}`);
    systemParts.push(`【转写摘录】\n${body.context.transcriptExcerpt}`);
    if (body.context.pausesExcerpt) {
      systemParts.push(`【停顿记录】\n${body.context.pausesExcerpt}`);
    }
  }

  const system = systemParts.join("\n\n");
  const messages = body.messages.filter((m) => m.role !== "system");

  const result = await callBailianChatCompletion({
    system,
    messages,
    stream: useStream,
  });

  if (!result.ok) {
    if (result.detail) {
      return NextResponse.json(
        { error: result.error, detail: result.detail },
        { status: result.status },
      );
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (result.stream) {
    const res = result.upstream;
    if (!res.body) {
      return NextResponse.json({ error: "模型未返回流" }, { status: 502 });
    }
    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  return NextResponse.json({ content: result.content });
}
