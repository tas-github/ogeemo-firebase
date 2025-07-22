import type { ReactNode } from "react";
import { Inter, Space_Grotesk as SpaceGrotesk } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';
import { LoadingProvider } from '@/context/loading-context';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import "./globals.css";

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = SpaceGrotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(fontBody.variable, fontHeadline.variable)}>
        <AuthProvider>
          <LoadingProvider>
            {children}
            <Toaster />
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
