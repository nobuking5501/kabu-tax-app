import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kabu Tax Admin",
  description: "管理画面 - 株式譲渡益計算アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
