import { NextResponse } from "next/server";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(16_000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).max(40),
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
  const key = process.env.BAILIAN_API_KEY;
  const baseRaw = process.env.BAILIAN_BASE_URL;
  if (!key?.trim() || !baseRaw?.trim()) {
    return NextResponse.json(
      {
        error:
          "未配置 BAILIAN_API_KEY / BAILIAN_BASE_URL。请在部署环境或 .env.local 中设置（OpenAI 兼容 Chat 根 URL）。",
      },
      { status: 503 },
    );
  }

  const base = baseRaw.replace(/\/+$/, "");
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

  const model = process.env.BAILIAN_CHAT_MODEL?.trim() || "qwen-turbo";

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

  const systemMessage = { role: "system" as const, content: systemParts.join("\n\n") };
  const outboundMessages = [
    systemMessage,
    ...body.messages.filter((m) => m.role !== "system"),
  ];

  const url = `${base}/chat/completions`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: outboundMessages,
        stream: false,
      }),
    });
  } catch {
    return NextResponse.json({ error: "无法连接模型服务" }, { status: 502 });
  }

  if (!res.ok) {
    const t = await res.text();
    return NextResponse.json(
      { error: "模型服务返回错误", detail: t.slice(0, 500) },
      { status: 502 },
    );
  }

  const data: unknown = await res.json();
  const content =
    typeof data === "object" &&
    data !== null &&
    "choices" in data &&
    Array.isArray((data as { choices: unknown }).choices)
      ? (data as { choices: Array<{ message?: { content?: unknown } }> }).choices[0]?.message
          ?.content
      : undefined;

  if (typeof content !== "string") {
    return NextResponse.json({ error: "模型响应格式异常" }, { status: 502 });
  }

  return NextResponse.json({ content });
}
