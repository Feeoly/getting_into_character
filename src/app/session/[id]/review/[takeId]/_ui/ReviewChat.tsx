"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ai } from "../../../rehearsal/_lib/transcription/sttCopy";
import { deltaFromSseDataLine } from "../_lib/parseOpenAiSse";

const CONSENT_KEY = "gic-ai-review-consent-v1";

type ChatMessage = { role: "user" | "assistant"; content: string };

type Props = {
  transcriptExcerpt: string;
  pausesExcerpt: string;
};

export function ReviewChat({ transcriptExcerpt, pausesExcerpt }: Props) {
  const [consent, setConsent] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      setConsent(localStorage.getItem(CONSENT_KEY) === "1");
    } catch {
      setConsent(false);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const persistConsent = useCallback((v: boolean) => {
    setConsent(v);
    try {
      if (v) localStorage.setItem(CONSENT_KEY, "1");
      else localStorage.removeItem(CONSENT_KEY);
    } catch {
      // ignore
    }
  }, []);

  async function onSend() {
    const text = input.trim();
    if (!text || loading) return;
    if (!consent) {
      setError(ai.consentRequired);
      return;
    }
    setError(null);
    const nextUser: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, nextUser]);
    setInput("");
    setLoading(true);

    const historyForApi = [...messages, nextUser].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/review/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          stream: true,
          context: {
            transcriptExcerpt,
            pausesExcerpt,
          },
        }),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : ai.error;
        setError(msg);
        return;
      }

      const ct = res.headers.get("content-type") ?? "";

      if (ct.includes("text/event-stream") && res.body) {
        setMessages((m) => [...m, { role: "assistant", content: "" }]);
        setLoading(false);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let carry = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            carry += decoder.decode(value, { stream: true });
            const lines = carry.split("\n");
            carry = lines.pop() ?? "";
            for (const line of lines) {
              const d = deltaFromSseDataLine(line);
              if (d === "__done__" || d === null) continue;
              if (d.length === 0) continue;
              setMessages((m) => {
                const next = [...m];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = { role: "assistant", content: last.content + d };
                }
                return next;
              });
            }
          }
          if (carry.trim()) {
            const d = deltaFromSseDataLine(carry);
            if (typeof d === "string" && d.length > 0) {
              setMessages((m) => {
                const next = [...m];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = { role: "assistant", content: last.content + d };
                }
                return next;
              });
            }
          }
        } catch {
          setError(ai.error);
          setMessages((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            if (last?.role === "assistant" && last.content === "") next.pop();
            return next;
          });
        }
        return;
      }

      const data: unknown = await res.json().catch(() => ({}));
      const content =
        typeof data === "object" &&
        data !== null &&
        "content" in data &&
        typeof (data as { content: unknown }).content === "string"
          ? (data as { content: string }).content
          : null;
      if (!content) {
        setError(ai.error);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content }]);
    } catch {
      setError(ai.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <h2 className="text-sm font-semibold text-slate-900">{ai.sectionTitle}</h2>
      <p className="mt-1 text-xs text-slate-500">{ai.disclosure}</p>

      <label className="mt-3 flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => persistConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
        />
        <span className="text-sm text-slate-700">{ai.consentLabel}</span>
      </label>
      {!consent ? (
        <p className="mt-2 text-xs text-amber-800">{ai.consentRequired}</p>
      ) : null}

      <div className="mt-4 max-h-[50vh] min-h-[200px] space-y-3 overflow-y-auto rounded-md border border-slate-100 bg-slate-50/80 p-3">
        {messages.length === 0 && !loading ? (
          <p className="text-sm text-slate-500">{ai.chatEmpty}</p>
        ) : null}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-lg bg-slate-200 px-3 py-2 text-sm text-slate-900">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800">
                {m.content || (i === messages.length - 1 ? ai.loading : "")}
              </div>
            </div>
          ),
        )}
        {loading ? (
          <div className="text-sm text-slate-500">{ai.loading}</div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{ai.inputPlaceholder}</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ai.inputPlaceholder}
            rows={2}
            disabled={loading || !consent}
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100"
          />
        </label>
        <button
          type="button"
          onClick={() => void onSend()}
          disabled={loading || !consent || !input.trim()}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
        >
          {ai.send}
        </button>
      </div>
    </section>
  );
}
