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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      setConsent(localStorage.getItem(CONSENT_KEY) === "1");
    } catch {
      setConsent(false);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
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
    <section className="rounded-[var(--radius-card)] bg-surface p-4 md:p-5">
      <h2 className="text-sm font-semibold text-ink">{ai.sectionTitle}</h2>

      <label className="mt-3 flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => persistConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded accent-ink"
        />
        <span className="text-sm text-ink-muted">{ai.consentLabel}</span>
      </label>
      {!consent ? (
        <p className="mt-2 text-xs text-amber-800">{ai.consentRequired}</p>
      ) : null}

      <div
        ref={scrollRef}
        className="mt-4 h-[min(42vh,22rem)] space-y-3 overflow-y-auto overflow-x-hidden rounded-2xl bg-page p-3"
      >
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-lg bg-stone-300/45 px-3 py-2 text-sm text-ink">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-surface px-3 py-2 text-sm leading-relaxed text-ink">
                {m.content || (i === messages.length - 1 ? ai.loading : "")}
              </div>
            </div>
          ),
        )}
        {loading ? (
          <div className="text-sm text-ink-subtle">{ai.loading}</div>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{ai.inputPlaceholder}</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ai.inputPlaceholder}
            rows={4}
            disabled={loading || !consent}
            className="w-full resize-y rounded-2xl bg-page px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:bg-ink/5"
          />
        </label>
        <button
          type="button"
          onClick={() => void onSend()}
          disabled={loading || !consent || !input.trim()}
          className="ui-btn shrink-0 px-5"
        >
          {ai.send}
        </button>
      </div>
    </section>
  );
}
