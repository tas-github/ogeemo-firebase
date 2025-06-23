
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type Event } from "@/types/calendar";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const projectTemplates = [
  {
    name: "Standard Web App",
    steps: [
      { title: "Project Kick-off Meeting", description: "Initial meeting with stakeholders." },
      { title: "Design Mockups", description: "Create UI mockups in Figma." },
      { title: "Develop Frontend", description: "Build React components and pages." },
      { title: "Develop Backend API", description: "Create necessary API endpoints." },
      { title: "User Acceptance Testing", description: "Testing by the client/end-users." },
      { title: "Deployment", description: "Deploy to production environment." },
    ]
  },
  {
    name: "Marketing Campaign",
    steps: [
        { title: "Define Campaign Goals", description: "Set clear objectives and KPIs." },
        { title: "Identify Target Audience", description: "Research and define the ideal customer profile." },
        { title: "Create Marketing Assets", description: "Develop ad copy, visuals, and landing pages." },
        { title: "Launch Campaign", description: "Push the campaign live across selected channels." },
        { title: "Monitor and Optimize", description: "Track performance and make adjustments." },
        { title: "Final Report", description: "Summarize campaign results." },
    ]
  }
];

type PartialTask = { title: string; description: string; };

interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectCreate: (projectName: string, projectDescription: string, tasks: PartialTask[]) => void;
}

export function NewProjectDialog({ isOpen, onOpenChange, onProjectCreate }: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [tasks, setTasks] = useState<PartialTask[]>([]);
  const { toast } = useToast();

  const resetForm = () => {
    setProjectName("");
    setProjectDescription("");
    setTasks([]);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleApplyTemplate = (templateIndex: number) => {
    const selectedTemplate = projectTemplates[templateIndex];
    if (!selectedTemplate) return;

    setTasks(prevTasks => [...prevTasks, ...selectedTemplate.steps]);
    toast({
        title: "Template Applied",
        description: `Added ${selectedTemplate.steps.length} steps from the "${selectedTemplate.name}" template.`,
    });
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) {
      toast({
        variant: "destructive",
        title: "Project Name Required",
        description: "Please enter a name for your project.",
      });
      return;
    }
    onProjectCreate(projectName.trim(), projectDescription.trim(), tasks);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Create a New Project</DialogTitle>
          <DialogDescription>
            Give your new project a name, description, and pre-fill it with tasks from a template.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g., Q4 Marketing Campaign"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Project Description</Label>
              <Textarea
                id="project-description"
                placeholder="Describe the project's goals and scope."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={4}
              />
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-2">Project Steps ({tasks.length})</h3>
              <ScrollArea className="h-48 border rounded-md p-2">
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map((task, index) => (
                      <div key={index} className="p-2 bg-muted/50 rounded-md text-sm">
                        {task.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No steps added yet. Apply a template below.</p>
                )}
              </ScrollArea>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Project Templates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projectTemplates.map((template, index) => (
                  <Card key={template.name}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs">{template.steps.length} steps</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                      <Button size="sm" variant="outline" onClick={() => handleApplyTemplate(index)}>Apply Template</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreateProject}>Create Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
