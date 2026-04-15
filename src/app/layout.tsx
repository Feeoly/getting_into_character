import type { Metadata } from "next";

import { GongwuyuanReaderLayout } from "./_ui/GongwuyuanFloatingReader";
import "./globals.css";

export const metadata: Metadata = {
  title: "入戏",
  description: "面试角色打板录制（默认本地处理，不上传）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <GongwuyuanReaderLayout>{children}</GongwuyuanReaderLayout>
      </body>
    </html>
  );
}

