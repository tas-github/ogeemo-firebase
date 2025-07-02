
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function OgeeMailInboxSkeleton() {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full bg-background overflow-hidden">
        <header className="text-center pb-4">
            <h1 className="text-3xl font-bold font-headline text-primary">OgeeMail</h1>
            <p className="text-muted-foreground">
                This is your new OgeeMail app, built to be fast, intelligent, and integrated with the Ogeemo platform.
            </p>
        </header>
        <div className="flex-1 min-h-0">
             <div className="h-full flex rounded-lg border">
                {/* Folder Panel */}
                <div className="w-1/5 min-w-[200px] max-w-[250px] p-2 flex flex-col">
                    <Skeleton className="h-10 w-full mb-2" />
                    <Separator />
                    <div className="p-2 space-y-1">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                </div>
                <Separator orientation="vertical" />
                {/* Email List Panel */}
                <div className="w-2/5 min-w-[300px] flex flex-col">
                    <div className="p-2 border-b">
                        <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {Array.from({ length: 8 }).map((_, i) => (
                             <div key={i} className="p-3 border-b space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-full" />
                             </div>
                        ))}
                    </div>
                </div>
                <Separator orientation="vertical" />
                {/* Email Content Panel */}
                <div className="flex-1 p-4 flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-80" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    </div>
                     <div className="pt-4 space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
}
