
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ProjectsSkeleton() {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="text-center pb-4 border-b shrink-0">
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
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <main className="flex-1 min-h-0">
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
                 <div className="pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
                <Skeleton className="h-6 w-24 mb-2" />
                <div className="flex-1 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
