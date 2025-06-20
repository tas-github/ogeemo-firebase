import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        width="1.5em"
        height="1.5em"
        className="text-primary"
        {...props}
      >
        <path
          fill="currentColor"
          d="M128 24a104 104 0 0 0-91.83 152.84l.2.32a104.05 104.05 0 0 0 183.26 0l.2-.32A104 104 0 0 0 128 24Zm0 192a88 88 0 0 1-79.6-134.11l79.41 113.44a.43.43 0 0 0 .19.16a.81.81 0 0 0 .39 0h.1a.83.83 0 0 0 .38-.17l79.42-113.43A88 88 0 0 1 128 216Z"
        />
      </svg>
      <span className="text-xl font-bold font-headline">Ogeemo</span>
    </div>
  );
}
