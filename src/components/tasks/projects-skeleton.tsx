
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ProjectsSkeleton() {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="text-center pb-4 shrink-0">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Projects Manager
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Oversee your projects from start to finish. All tasks created here are automatically added to your calendar.
        </p>
      </header>

      <div className="flex items-center justify-between py-4 flex-wrap gap-4">
        <Skeleton className="h-10 w-[250px]" />
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <main className="flex-1 min-h-0">
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-56 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
