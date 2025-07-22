import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ogeemo",
  description: "Your AI-Powered Business Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
