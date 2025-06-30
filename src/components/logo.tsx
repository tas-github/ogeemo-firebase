import Image from 'next/image';
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Image
        src="/logo.png"
        alt="Ogeemo Logo"
        width={24}
        height={24}
        className="h-6 w-6"
        priority
      />
      <span className="text-xl font-bold font-headline">Ogeemo</span>
    </div>
  );
}
