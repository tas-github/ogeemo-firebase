import Link from "next/link";
import { Logo } from "../logo";
import { Button } from "../ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
            <Button asChild>
                <Link href="/register">Join Beta Program</Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
