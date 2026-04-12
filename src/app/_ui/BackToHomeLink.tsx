import Link from "next/link";

const defaultClass =
  "text-sm font-semibold text-link hover:text-ink hover:underline outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page rounded";

const onDarkClass =
  "text-sm font-semibold text-white/90 hover:text-white hover:underline outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded drop-shadow-sm";

type Props = {
  variant?: "default" | "onDark";
};

export function BackToHomeLink({ variant = "default" }: Props) {
  return (
    <Link href="/" className={variant === "onDark" ? onDarkClass : defaultClass}>
      返回首页
    </Link>
  );
}
