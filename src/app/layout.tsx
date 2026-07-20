import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnbuLoop",
  description: "Everyday voice-note exchanges across generations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
