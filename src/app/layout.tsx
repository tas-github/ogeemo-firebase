
import type { ReactNode } from "react";
import { Inter, Space_Grotesk as SpaceGrotesk } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';
import { LoadingProvider } from '@/context/loading-context';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { SiteHeader } from "@/components/landing/header";
import { SiteFooter } from "@/components/landing/footer";
import "./globals.css";

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = SpaceGrotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});

const marketingPaths = ['/home', '/for-small-businesses', '/for-accountants', '/news', '/about', '/contact', '/privacy', '/terms', '/'];

export default function RootLayout({ children }: { children: ReactNode }) {
  // We can't use usePathname here as it's a server component.
  // Instead, we inspect the child props passed by Next.js to determine the route segment.
  const segment = (children as React.ReactElement)?.props?.childProp?.segment || '';
  const isAppRoute = segment.startsWith('(app)');
  
  // A simple check to see if the root layout is rendering a known marketing page path.
  // This is a bit of a workaround because the root layout doesn't have the full pathname.
  const isLikelyMarketingRoute = marketingPaths.some(p => p.endsWith(segment)) || segment === '';
  
  const showHeaderFooter = !isAppRoute && isLikelyMarketingRoute;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(fontBody.variable, fontHeadline.variable)}>
        <AuthProvider>
          <LoadingProvider>
            {showHeaderFooter && <SiteHeader />}
            {children}
            {showHeaderFooter && <SiteFooter />}
            <Toaster />
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
