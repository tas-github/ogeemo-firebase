
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
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type Project } from "@/data/projects";

interface NewProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectCreate: (projectData: Omit<Project, 'id' | 'userId' | 'createdAt'>, tasks: PartialTask[]) => void;
  templates: ProjectTemplate[];
  onSaveAsTemplate: (name: string, tasks: PartialTask[]) => void;
  initialName?: string;
  initialDescription?: string;
}

export function NewProjectDialog({
  isOpen,
  onOpenChange,
  onProjectCreate,
  templates,
  onSaveAsTemplate,
  initialName,
  initialDescription,
}: NewProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [assignee, setAssignee] = useState("");
  const [importance, setImportance] = useState<'Critical' | 'Important' | 'Optional'>('Important');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [tasks, setTasks] = useState<PartialTask[]>([]);
  const [newStep, setNewStep] = useState("");
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setDescription("");
    setOwner("");
    setAssignee("");
    setImportance("Important");
    setDueDate(undefined);
    setTasks([]);
    setNewStep("");
  };

  useEffect(() => {
    if (isOpen) {
      if (initialName) setName(initialName);
      if (initialDescription) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = initialDescription;
        setDescription(tempDiv.textContent || tempDiv.innerText || "");
      }
    } else {
      resetForm();
    }
  }, [isOpen, initialName, initialDescription]);

  const handleApplyTemplate = (template: ProjectTemplate) => {
    setTasks(prevTasks => [...prevTasks, ...template.steps]);
    toast({
      title: "Template Applied",
      description: `Added ${template.steps.length} steps from the "${template.name}" template.`,
    });
  };

  const handleAddStep = () => {
    if (newStep.trim()) {
        setTasks(prev => [...prev, { title: newStep.trim(), description: '' }]);
        setNewStep('');
    }
  };

  const handleRemoveStep = (indexToRemove: number) => {
    setTasks(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCreateProject = () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Project Name Required",
        description: "Please enter a name for your project.",
      });
      return;
    }
    const projectData = { name: name.trim(), description: description.trim(), owner, assignee, importance, dueDate };
    onProjectCreate(projectData, tasks);
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
    setNewTemplateName(name); // Pre-fill with project name
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
              Fill in the project details and add initial tasks or steps.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Q4 Marketing Campaign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Project Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe the project's goals and scope."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-owner">Project Owner</Label>
                    <Input id="project-owner" placeholder="e.g., Jane Doe" value={owner} onChange={(e) => setOwner(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-assignee">Project Assignee</Label>
                    <Input id="project-assignee" placeholder="e.g., John Smith" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-importance">Importance</Label>
                    <Select value={importance} onValueChange={(v) => setImportance(v as any)}>
                        <SelectTrigger id="project-importance"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Critical">Critical</SelectItem>
                            <SelectItem value="Important">Important</SelectItem>
                            <SelectItem value="Optional">Optional</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus /></PopoverContent>
                    </Popover>
                  </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Project Steps ({tasks.length})</h3>
                <div className="flex items-center gap-2 mb-4">
                    <Input 
                        placeholder="Add a new step or task..."
                        value={newStep}
                        onChange={(e) => setNewStep(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddStep();
                            }
                        }}
                    />
                    <Button onClick={handleAddStep}><Plus className="mr-2 h-4 w-4"/> Add Step</Button>
                </div>
                <ScrollArea className="h-48 border rounded-md p-2">
                  {tasks.length > 0 ? (
                    <div className="space-y-2">
                      {tasks.map((task, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                          <span>{task.title}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveStep(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No steps added yet. Add a custom step or apply a template below.</p>
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

export default NewProjectDialog;
