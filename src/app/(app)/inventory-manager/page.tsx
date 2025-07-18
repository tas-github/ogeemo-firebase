
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch } from "lucide-react";

export default function InventoryManagerPage() {
  return (
    <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full space-y-6">
       <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
          <PackageSearch className="h-8 w-8" />
          Inventory Manager
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
          Track stock levels, manage suppliers, and handle purchase orders for your physical products.
        </p>
      </header>
       <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed w-full max-w-4xl">
        <p className="text-2xl text-muted-foreground">Coming Soon.</p>
      </div>
    </div>
  );
}
