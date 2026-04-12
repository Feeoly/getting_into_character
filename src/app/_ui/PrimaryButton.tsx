import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
};

export function PrimaryButton({ href, children }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 min-w-[8.5rem] items-center justify-center rounded-2xl bg-accent px-8 text-sm font-semibold text-white shadow-soft-sm outline-none ring-offset-2 ring-offset-page transition hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </Link>
  );
}

