import Link from "next/link";

const defaultClass =
  "ui-btn ui-btn-sm !no-underline hover:!no-underline focus-visible:!shadow-[0_0_0_2px_var(--color-page),0_0_0_4px_var(--color-ink)]";

const toolbarClass =
  "ui-btn ui-btn-equal !no-underline hover:!no-underline focus-visible:!shadow-[0_0_0_2px_var(--color-page),0_0_0_4px_var(--color-ink)]";

const onDarkClass =
  "ui-btn ui-btn-sm ui-btn-surface !no-underline hover:!no-underline focus-visible:!shadow-[0_0_0_2px_rgb(0_0_0/0.5),0_0_0_4px_var(--color-page)]";

const onDarkToolbarClass =
  "ui-btn ui-btn-equal ui-btn-surface !no-underline hover:!no-underline focus-visible:!shadow-[0_0_0_2px_rgb(0_0_0/0.5),0_0_0_4px_var(--color-page)]";

type Props = {
  variant?: "default" | "toolbar" | "onDark" | "onDarkToolbar";
};

export function BackToHomeLink({ variant = "default" }: Props) {
  const cls =
    variant === "onDarkToolbar"
      ? onDarkToolbarClass
      : variant === "onDark"
        ? onDarkClass
        : variant === "toolbar"
          ? toolbarClass
          : defaultClass;
  return (
    <Link href="/" className={cls}>
      返回首页
    </Link>
  );
}
