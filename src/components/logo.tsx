
import Link from 'next/link';
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: number;
    height?: number;
}

export function Logo({ className, width = 48, height = 48, ...props }: LogoProps) {
  return (
    <Link href="/" aria-label="Go to Ogeemo dashboard">
      <div className={cn("flex items-center gap-2 cursor-pointer", className)} {...props}>
        <Image
         src="/images/Ogeemo-Logo-BonT.png"
         alt="Ogeemo Logo"
         width={width}
         height={height}
         priority
       />
     </div>
   </Link>
 );
}
