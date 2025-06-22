
"use client";

import { useState } from "react";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function TaskItem({
  title,
  description,
}: {
  title: string;
  description:string;
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
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="flex items-center justify-between pb-4 border-b shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Project Manager
          </h1>
          <p className="text-muted-foreground">
            Oversee your projects from start to finish.
          </p>
        </div>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle>Create a New Task</DialogTitle>
              <DialogDescription>
                Fill out the details below to add a new task to your board.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    placeholder="e.g., Deploy the new feature"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    placeholder="Provide a detailed description of the task..."
                    rows={8}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="task-status">Status</Label>
                    <Select defaultValue="todo">
                      <SelectTrigger id="task-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="inprogress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select>
                      <SelectTrigger id="task-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assignee</Label>
                  <Select>
                    <SelectTrigger id="task-assignee">
                      <SelectValue placeholder="Assign to a team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user1">User One</SelectItem>
                      <SelectItem value="user2">User Two</SelectItem>
                      <SelectItem value="user3">User Three</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsNewTaskOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsNewTaskOpen(false)}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
