import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Getting Into Character",
  description: "面试角色排练（默认本地处理，不上传）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

