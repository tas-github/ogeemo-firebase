import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Circle } from 'lucide-react';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Link href="/" aria-label="Go to Ogeemo dashboard">
      <div className={cn("flex items-center gap-2 cursor-pointer", className)} {...props}>
        <div className="p-1.5 bg-primary rounded-full text-primary-foreground">
            <Circle className="h-3 w-3 fill-current" />
        </div>
        <span className="text-xl font-bold font-headline text-primary">Ogeemo</span>
      </div>
    </Link>
  );
}
