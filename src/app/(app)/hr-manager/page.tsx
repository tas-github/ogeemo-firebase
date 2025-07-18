
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact2 } from "lucide-react";

export default function HrManagerPage() {
  return (
    <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full space-y-6">
       <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
          <Contact2 className="h-8 w-8" />
          HR Manager
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
          Manage employee information, payroll, time off, and other human resources tasks.
        </p>
      </header>
       <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed w-full max-w-4xl">
        <p className="text-2xl text-muted-foreground">Coming Soon.</p>
      </div>
    </div>
  );
}
