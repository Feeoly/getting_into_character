/** 百炼 OpenAI 兼容 Chat；与复盘/角色增强共用 */

export const DEFAULT_BAILIAN_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1";

/** 可用 BAILIAN_CHAT_MODEL 覆盖 */
export const DEFAULT_CHAT_MODEL = "MiniMax-M2.5";

function getBaseUrl(): string {
  const baseRaw = process.env.BAILIAN_BASE_URL?.trim() || DEFAULT_BAILIAN_BASE_URL;
  return baseRaw.replace(/\/+$/, "");
}

function getModel(): string {
  return process.env.BAILIAN_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL;
}

function extractMessageContent(data: unknown): string | undefined {
  if (
    typeof data === "object" &&
    data !== null &&
    "choices" in data &&
    Array.isArray((data as { choices: unknown }).choices)
  ) {
    const c = (data as { choices: Array<{ message?: { content?: unknown } }> }).choices[0]
      ?.message?.content;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}

export type BailianChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/** 非流式返回 `content`；流式返回 `upstream` 供转发 SSE */
export async function callBailianChatCompletion(params: {
  system: string;
  messages: BailianChatMessage[];
  stream: boolean;
}): Promise<
  | { ok: true; content: string; stream: false }
  | { ok: true; upstream: Response; stream: true }
  | { ok: false; error: string; status: number; detail?: string }
> {
  const key = process.env.BAILIAN_API_KEY;
  if (!key?.trim()) {
    return {
      ok: false,
      error:
        "未配置 BAILIAN_API_KEY。请在部署环境变量（或本机 export）中设置百炼 API Key。",
      status: 503,
    };
  }

  const systemMessage: BailianChatMessage = { role: "system", content: params.system };
  const outboundMessages = [systemMessage, ...params.messages.filter((m) => m.role !== "system")];

  const url = `${getBaseUrl()}/chat/completions`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: getModel(),
        messages: outboundMessages,
        stream: params.stream,
      }),
    });
  } catch {
    return { ok: false, error: "无法连接模型服务", status: 502 };
  }

  if (!res.ok) {
    const t = await res.text();
    return {
      ok: false,
      error: "模型服务返回错误",
      status: 502,
      detail: t.slice(0, 500),
    };
  }

  if (params.stream) {
    if (!res.body) {
      return { ok: false, error: "模型未返回流", status: 502 };
    }
    return { ok: true, upstream: res, stream: true };
  }

  const data: unknown = await res.json();
  const content = extractMessageContent(data);
  if (typeof content !== "string") {
    return { ok: false, error: "模型响应格式异常", status: 502 };
  }

  return { ok: true, content, stream: false };
}
