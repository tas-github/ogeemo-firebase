
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
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type ProjectTemplate, type PartialTask } from "@/data/project-templates";

interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectCreate: (projectName: string, projectDescription: string, tasks: PartialTask[]) => void;
  templates: ProjectTemplate[];
  onSaveAsTemplate: (name: string, tasks: PartialTask[]) => void;
  initialTasks?: PartialTask[] | null;
}

export function NewProjectDialog({
  isOpen,
  onOpenChange,
  onProjectCreate,
  templates,
  onSaveAsTemplate,
  initialTasks,
}: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [tasks, setTasks] = useState<PartialTask[]>([]);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const { toast } = useToast();

  const resetForm = () => {
    setProjectName("");
    setProjectDescription("");
    setTasks([]);
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTasks) {
        setTasks(initialTasks);
      }
    } else {
      resetForm();
    }
  }, [isOpen, initialTasks]);

  const handleApplyTemplate = (template: ProjectTemplate) => {
    setTasks(prevTasks => [...prevTasks, ...template.steps]);
    toast({
      title: "Template Applied",
      description: `Added ${template.steps.length} steps from the "${template.name}" template.`,
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
  
  const handleSaveTemplateClick = () => {
    if (tasks.length === 0) {
      toast({
        variant: "destructive",
        title: "No Steps to Save",
        description: "Add some steps to the project before saving it as a template.",
      });
      return;
    }
    setNewTemplateName(projectName); // Pre-fill with project name
    setIsSaveTemplateOpen(true);
  };

  const handleConfirmSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({ variant: "destructive", title: "Template name required" });
      return;
    }
    onSaveAsTemplate(newTemplateName, tasks);
    setIsSaveTemplateOpen(false);
  };

  return (
    <>
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
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs">{template.steps.length} steps</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0">
                        <Button size="sm" variant="outline" onClick={() => handleApplyTemplate(template)}>Apply Template</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-4 border-t flex justify-between">
            <Button variant="outline" onClick={handleSaveTemplateClick}>Save as Template</Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Save Project as Template</DialogTitle>
                <DialogDescription>Enter a name for your new template. The current project steps will be saved.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="template-name" className="sr-only">Template Name</Label>
                <Input id="template-name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Enter template name..." />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSaveTemplateOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmSaveTemplate}>Save Template</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
