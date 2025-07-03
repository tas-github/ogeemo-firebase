
import { Skeleton } from "@/components/ui/skeleton";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function FilesSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 sm:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Ogeemo File Manager
        </h1>
        <p className="text-muted-foreground">
          A new foundation for managing your files and folders.
        </p>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
          <ResizablePanel defaultSize={25} minSize={20}>
              <div className="flex h-full flex-col">
                  <div className="flex items-center justify-center p-2 border-b h-[57px]">
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="flex-1 p-2 space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                      ))}
                  </div>
              </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75}>
              <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-2 border-b h-[57px]">
                      <Skeleton className="h-6 w-32" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-36" />
                        <Skeleton className="h-9 w-28" />
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[50px]"><Skeleton className="h-4 w-4" /></TableHead>
                                  <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                                  <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                                  <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {Array.from({ length: 8 }).map((_, i) => (
                                  <TableRow key={i}>
                                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </div>
              </div>
          </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
