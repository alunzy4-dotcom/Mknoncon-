import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مكنون كون | خدمات الأعمال",
  description: "حلول أعمال واستشارات مالية وتنفيذية باحترافية."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
