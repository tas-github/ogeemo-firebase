import Image from 'next/image';
import Link from 'next/link';
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Link href="https://studio.firebase.google.com/studio-6489696380">
      <div className={cn("flex items-center gap-2 cursor-pointer", className)} {...props}>
        <Image
          src="/images/Ogeemo-Logo-BonT.png"
          alt="Ogeemo Logo"
          width={24}
          height={24}
          className="h-6 w-6"
          priority
        />
        <span className="text-xl font-bold font-headline">Ogeemo</span>
      </div>
    </Link>
  );
}
