
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { fontOrbitron } from '@/app/layout';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <Link href="/" aria-label="Go to Ogeemo dashboard">
      <div className={cn("flex items-center gap-2 cursor-pointer", className)} {...props}>
        <h1 className={cn(
            fontOrbitron.variable,
            "font-headline font-bold text-2xl tracking-wider text-black uppercase"
        )}>
            OGEEMO
        </h1>
      </div>
   </Link>
 );
}
