
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type Project } from "@/data/projects";
import { type Event } from "@/types/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type ProjectTemplate, type PartialTask } from "@/data/project-templates";

interface EditProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Project | null;
  tasks: Event[];
  onProjectSave: (updatedProject: Project, newTasks: Event[]) => void;
  templates: ProjectTemplate[];
  onSaveAsTemplate: (name: string, tasks: PartialTask[]) => void;
}

export function EditProjectDialog({
  isOpen,
  onOpenChange,
  project,
  tasks,
  onProjectSave,
  templates,
  onSaveAsTemplate,
}: EditProjectDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [currentTasks, setCurrentTasks] = useState<Event[]>([]);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (project && isOpen) {
      setProjectName(project.name);
      setProjectDescription(project.description || "");
      setCurrentTasks(tasks);
    }
  }, [project, tasks, isOpen]);

  if (!project) return null;

  const handleApplyTemplate = (template: ProjectTemplate) => {
    const newTasksFromTemplate: Event[] = template.steps.map((step, index) => ({
      id: `task-${project.id}-${Date.now()}-${index}`,
      title: step.title,
      description: step.description,
      start: new Date(),
      end: new Date(new Date().getTime() + 30 * 60000), // Default 30 min duration
      attendees: [],
      status: 'todo',
      projectId: project.id,
    }));

    setCurrentTasks(prevTasks => [...prevTasks, ...newTasksFromTemplate]);
    toast({
      title: "Template Applied",
      description: `Added ${template.steps.length} tasks from the "${template.name}" template.`,
    });
  };

  const handleSave = () => {
    if (!projectName.trim()) {
      toast({
        variant: "destructive",
        title: "Project Name Required",
        description: "Please enter a name for your project.",
      });
      return;
    }

    const updatedProject: Project = {
      ...project,
      name: projectName.trim(),
      description: projectDescription.trim(),
    };

    onProjectSave(updatedProject, currentTasks);
    onOpenChange(false);
  };
  
  const handleSaveTemplateClick = () => {
    if (currentTasks.length === 0) {
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
    const tasksToSave = currentTasks.map(t => ({ title: t.title, description: t.description }));
    onSaveAsTemplate(newTemplateName, tasksToSave);
    setIsSaveTemplateOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Edit Project: {project.name}</DialogTitle>
            <DialogDescription>
              Manage project details, steps, and apply templates.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-project-name">Project Name</Label>
                <Input
                  id="edit-project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-project-description">Project Description</Label>
                <Textarea
                  id="edit-project-description"
                  placeholder="Describe the project's goals and scope."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Project Steps ({currentTasks.length})</h3>
                <ScrollArea className="h-48 border rounded-md p-2">
                  {currentTasks.length > 0 ? (
                    <div className="space-y-2">
                      {currentTasks.map(task => (
                        <div key={task.id} className="p-2 bg-muted/50 rounded-md text-sm">
                          {task.title}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No steps in this project yet.</p>
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
              <Button onClick={handleSave}>Save Project</Button>
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
                <Label htmlFor="template-name-edit" className="sr-only">Template Name</Label>
                <Input id="template-name-edit" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="Enter template name..." />
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

export default EditProjectDialog;
