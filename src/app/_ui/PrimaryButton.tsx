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
      className="ui-btn ui-btn-page-header-gradient min-h-12 min-w-[8.5rem] px-8"
    >
      {children}
    </Link>
  );
}

