
'use client';

import { useState } from "react";
import { ReportsPageHeader } from "@/components/reports/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown, Info } from "lucide-react";

export default function ReportTemplatesPage() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const mockTemplates = ["Monthly Financial Summary", "Client Activity Log", "Project Progress Report"];

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full space-y-6">
      <ReportsPageHeader pageTitle="Report Templates" />
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Report Templates
        </h1>
        <p className="text-muted-foreground">
          Create, manage, and utilize standardized report templates.
        </p>
      </header>
      
      <div className="flex justify-center gap-4">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create a Report Template
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Templates
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Existing Templates</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockTemplates.map((template) => (
              <DropdownMenuItem key={template}>{template}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Info className="mr-2 h-4 w-4" />
                    Information
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>About Report Templates</DialogTitle>
                    <DialogDescription>
                        An overview of how to create and use report templates effectively.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 prose prose-sm dark:prose-invert max-w-none">
                    <h4>What are Report Templates?</h4>
                    <p>Report templates are pre-designed structures for your reports. They allow you to define the layout, data fields, and filters once, and then reuse that structure to generate new reports quickly and consistently. This saves time and ensures a uniform look and feel across all your reporting.</p>
                    
                    <h4>Guidelines for Creating Reports</h4>
                    <ul>
                        <li><strong>Start with a clear objective:</strong> Know what question you are trying to answer or what information you want to convey.</li>
                        <li><strong>Identify your audience:</strong> Tailor the complexity and content of the report to who will be reading it (e.g., clients, internal team, executives).</li>
                        <li><strong>Choose the right data:</strong> Select only the relevant collections and fields needed for your report to keep it focused and performant.</li>
                        <li><strong>Use filters effectively:</strong> Apply date ranges and other conditions to narrow down the data to the most relevant information.</li>
                        <li><strong>Name templates descriptively:</strong> Use clear names like "Monthly Client Activity" or "Quarterly Financial Summary" so you can easily find them later.</li>
                    </ul>
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsInfoOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-2xl text-muted-foreground">Template editor will be here.</p>
      </div>
    </div>
  );
}
