import Link from "next/link";
import { Logo } from "../logo";
import { Button } from "../ui/button";
import { navLinks } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Logo />
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
           <Button asChild variant="ghost">
                <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
                <Link href="/register">Join Beta Program</Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
