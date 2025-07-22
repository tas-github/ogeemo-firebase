import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";
import { LoadingProvider } from "@/context/loading-context";
import { RouteChangeListener } from "@/components/route-change-listener";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-headline",
});

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <Suspense>
            <AuthProvider>
            <LoadingProvider>
                <RouteChangeListener />
                {children}
                <Toaster />
            </LoadingProvider>
            </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
