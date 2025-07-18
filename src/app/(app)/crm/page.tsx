
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users2 } from "lucide-react";

export default function CrmManagerPage() {
  return (
    <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full space-y-6">
       <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
          <Users2 className="h-8 w-8" />
          CRM
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
          Build stronger customer relationships with advanced sales funnels, lead tracking, and automated follow-ups.
        </p>
      </header>
       <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed w-full max-w-4xl">
        <p className="text-2xl text-muted-foreground">Coming Soon.</p>
      </div>
    </div>
  );
}
