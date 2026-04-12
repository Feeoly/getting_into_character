import { NextResponse } from "next/server";
import { z } from "zod";

import { callBailianChatCompletion } from "../../_lib/bailianChat";
import { roleSectionTitles } from "../../../session/[id]/_lib/roleCopy";

const bodySchema = z.object({
  draftText: z.string().max(8000),
  moodPreset: z.string().max(32).optional(),
  moodCustom: z.string().max(2000).optional(),
  trigger: z.string().max(120).optional(),
});

const MAX_BODY_CHARS = 32_000;

function countChars(b: z.infer<typeof bodySchema>): number {
  let n = b.draftText.length;
  n += b.moodPreset?.length ?? 0;
  n += b.moodCustom?.length ?? 0;
  n += b.trigger?.length ?? 0;
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
  if (countChars(body) > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "上下文过长" }, { status: 400 });
  }

  const t1 = roleSectionTitles.state;
  const t2 = roleSectionTitles.actions;
  const t3 = roleSectionTitles.taboos;

  const system = [
    "你是公务员结构化面试前的「入戏」角色卡写作助手。用户要在面试前快速进入可扮演的表达角色。",
    "请用中文输出，且全文必须且只能使用以下三节标题（须带【】且与下列字面一致，勿改字）：",
    `【${t1}】`,
    `【${t2}】`,
    `【${t3}】`,
    "每节正文用换行分段；可执行指令用条列（以「- 」开头）。",
    "强化可感知的「角色感」（身体感、视角、与考官/场景的关系、说话节奏），避免写成空洞鸡汤或泛化的答题技巧清单。",
    `${t3}中须包含：避免自我否定、避免灾难化归因；不得输出侮辱、医疗诊断、或「必过」类绝对承诺。`,
    "不得编造用户未提供的具体人名与经历；信息不足时可给可替换占位提示。",
    "总长度建议不超过 8000 字（含标题与标点）。",
  ].join("\n");

  const userParts: string[] = [`【当前角色卡草稿】\n${body.draftText}`];
  if (body.trigger?.trim()) userParts.push(`【触发物】\n${body.trigger.trim()}`);
  if (body.moodPreset?.trim()) userParts.push(`【气质预设 id】\n${body.moodPreset.trim()}`);
  if (body.moodCustom?.trim()) userParts.push(`【气质补充】\n${body.moodCustom.trim()}`);
  const userContent = userParts.join("\n\n");

  const result = await callBailianChatCompletion({
    system,
    messages: [{ role: "user", content: userContent }],
    stream: false,
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
    return NextResponse.json({ error: "内部错误：非流式调用返回了流" }, { status: 500 });
  }

  return NextResponse.json({ content: result.content });
}
