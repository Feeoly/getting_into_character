"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/** Marble：奶油内区 + 黑字 + 黑链接 */
const cream = "bg-page";
const body = "text-ink";
const link =
  "font-semibold text-ink underline decoration-ink/35 underline-offset-[3px] hover:decoration-ink";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
  },
};

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className={`mb-4 mt-6 text-xl font-bold leading-snug first:mt-0 ${body}`}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className={`mb-3 mt-5 text-lg font-bold leading-snug first:mt-0 ${body}`}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className={`mb-2 mt-4 text-base font-semibold leading-snug first:mt-0 ${body}`}>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className={`mb-4 text-[15px] leading-[1.75] last:mb-0 ${body}`}>{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => (
    <div className="my-6 h-px w-[92%] max-w-md bg-ink/10" role="presentation" />
  ),
  ul: ({ children }) => (
    <ul className={`mb-4 list-disc space-y-2 pl-6 text-[15px] leading-[1.75] last:mb-0 ${body}`}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className={`mb-4 list-decimal space-y-2 pl-6 text-[15px] leading-[1.75] last:mb-0 ${body}`}>
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href ?? "#"}
      className={link}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-4 rounded-lg bg-ink/[0.04] py-2 pl-4 pr-3 text-[15px] leading-[1.75] text-ink-muted">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[0.9em] text-ink"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-2xl bg-page p-4 text-[14px] leading-relaxed text-ink">
      {children}
    </pre>
  ),
};

type Props = {
  markdown: string;
  /** 详情页卡片内：可滚动 + 略紧内边距 */
  variant?: "compact" | "read";
};

export function RoleCardMarkdown({ markdown, variant = "compact" }: Props) {
  const src = markdown.trim() || "—";
  const pad =
    variant === "read"
      ? "rounded-2xl px-5 py-6 md:px-8 md:py-8"
      : "rounded-2xl px-4 py-4 md:px-5 md:py-5";
  const scroll = variant === "compact" ? "max-h-[min(60vh,28rem)] overflow-y-auto" : "";

  return (
    <div className={`${cream} ${pad} ${scroll}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={mdComponents}
      >
        {src}
      </ReactMarkdown>
    </div>
  );
}
