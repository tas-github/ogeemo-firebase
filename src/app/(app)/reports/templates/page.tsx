
import { ReportsPageHeader } from "@/components/reports/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown } from "lucide-react";

export default function ReportTemplatesPage() {
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
      </div>

      <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-2xl text-muted-foreground">Template editor will be here.</p>
      </div>
    </div>
  );
}
