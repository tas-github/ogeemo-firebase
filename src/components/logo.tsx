import Link from 'next/link';
import Image from 'next/image';
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Link href="/" aria-label="Go to Ogeemo dashboard">
      <div className={cn("flex items-center gap-2 cursor-pointer", className)} {...props}>
        <Image 
          src="/images/ogeemo-logo.png" 
          alt="Ogeemo Logo" 
          width={150} 
          height={40}
          priority
        />
      </div>
    </Link>
  );
}
