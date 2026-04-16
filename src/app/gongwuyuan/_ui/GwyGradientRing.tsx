import type { ReactNode } from "react";

/** 真题面板统一：to top #fad0c4 → #ffd1ff 渐变描边（与侧栏一致） */
const GRAD = "bg-[linear-gradient(to_top,#fad0c4_0%,#ffd1ff_100%)]";

export type GwyGradientRadius = "card" | "pill" | "md";

const outerR: Record<GwyGradientRadius, string> = {
  card: "rounded-[var(--radius-card)]",
  pill: "rounded-full",
  md: "rounded-md",
};

const innerR: Record<GwyGradientRadius, string> = {
  card: "rounded-[calc(var(--radius-card)-2px)]",
  pill: "rounded-full",
  md: "rounded-[calc(0.375rem-2px)]",
};

type Props = {
  children: ReactNode;
  radius: GwyGradientRadius;
  className?: string;
  innerClassName?: string;
};

export function GwyGradientRing({ children, radius, className = "", innerClassName = "" }: Props) {
  return (
    <span
      className={`box-border inline-flex min-w-0 ${GRAD} p-[2px] transition-[background-color] duration-200 hover:bg-ink/[0.14] hover:[background-image:none] ${outerR[radius]} ${className}`}
    >
      <span className={`box-border min-h-0 min-w-0 ${innerR[radius]} ${innerClassName}`}>
        {children}
      </span>
    </span>
  );
}
