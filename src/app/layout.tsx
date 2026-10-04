import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "R10-Docs",
  description: "گفتگو با هر سند PDF با هوش مصنوعی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className={`${vazirmatn.className} min-h-full flex flex-col`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
