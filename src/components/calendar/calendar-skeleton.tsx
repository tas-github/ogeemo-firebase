
import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="text-center mb-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto mt-2" />
      </header>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
          <Skeleton className="h-10 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        
        <div className="flex-1 mt-2 overflow-hidden border-t border-black">
          <div className="h-full w-full flex">
            {/* Time gutter */}
            <div className="w-24 shrink-0 border-r border-black">
              {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="relative h-[120px] border-b border-black">
                      <span className="absolute top-0 right-2 -translate-y-1/2 text-sm text-muted-foreground">{i + 8}:00 AM</span>
                  </div>
              ))}
            </div>
            {/* Day columns */}
            <div className="flex-1 grid grid-cols-1">
                <div className="relative h-full">
                  {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="h-[120px] border-b border-black"></div>
                  ))}
                  <Skeleton className="absolute left-2 right-2 rounded-lg h-16" style={{top: '120px'}} />
                  <Skeleton className="absolute left-2 right-2 rounded-lg h-24" style={{top: '300px'}} />
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
