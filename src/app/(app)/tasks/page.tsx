
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function TaskItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function TasksPage() {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 border-b shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Task Manager
          </h1>
          <p className="text-muted-foreground">
            Organize your to-do lists and manage your workflow.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </header>
      <main className="flex-1 grid md:grid-cols-3 gap-6 py-6 min-h-0">
        {/* To Do Column */}
        <Card className="flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>To Do</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4 pt-0">
            <TaskItem
              title="Design new dashboard layout"
              description="Create mockups in Figma for the v2 dashboard."
            />
            <TaskItem
              title="API for user authentication"
              description="Develop endpoints for registration and login."
            />
            <TaskItem
              title="Write API documentation"
              description="Use Swagger/OpenAPI for clear documentation."
            />
            <TaskItem
              title="Plan Q3 marketing campaign"
              description="Outline goals, target audience, and channels."
            />
          </CardContent>
        </Card>

        {/* In Progress Column */}
        <Card className="flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>In Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4 pt-0">
            <TaskItem
              title="Implement sidebar navigation"
              description="Using ShadCN UI and Next.js App Router."
            />
            <TaskItem
              title="Fix login bug #123"
              description="Users reporting issues with Google OAuth."
            />
          </CardContent>
        </Card>

        {/* Done Column */}
        <Card className="flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>Done</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto custom-scrollbar p-4 pt-0">
            <TaskItem
              title="Setup Next.js project"
              description="Configured Tailwind, TypeScript, and ESLint."
            />
            <TaskItem
              title="Initial deployment to Firebase"
              description="Live environment is up and running."
            />
            <TaskItem
              title="Create foundational UI components"
              description="Buttons, Cards, and Inputs are complete."
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
