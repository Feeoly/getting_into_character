import type { ReactNode } from "react";

/** 顶栏左侧：返回首页、删除整场等全局操作 */
export function PageHeaderGlobalRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>{children}</div>
  );
}

/** 顶栏右侧：单会话/轮次操作 */
export function ContextActionsWithDivider({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
