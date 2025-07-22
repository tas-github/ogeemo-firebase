
import type {Metadata} from 'next';
import { Inter, Space_Grotesk as SpaceGrotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const spaceGrotesk = SpaceGrotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});


export const metadata: Metadata = {
  title: 'Ogeemo Firebase Console',
  description: 'Manage your Firebase projects with ease.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head />
      <body>
        {/*
          The AuthProvider and LoadingProvider have been temporarily removed
          to isolate a startup issue. They will be restored once the
          basic application rendering is confirmed.
        */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
