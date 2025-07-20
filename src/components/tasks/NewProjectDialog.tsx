
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
import { type PartialTask, type ProjectTemplate } from "@/services/project-service";
import { Plus, Trash2, Calendar as CalendarIcon, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type Project } from "@/services/project-service";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskWithSelection extends PartialTask {
  id: number;
  selected: boolean;
}

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
  const [tasks, setTasks] = useState<TaskWithSelection[]>([]);
  const [newStep, setNewStep] = useState("");
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
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
    const newTasksFromTemplate = template.steps.map(step => ({
        ...step,
        id: Date.now() + Math.random(),
        selected: false,
    }));
    setTasks(prevTasks => [...prevTasks, ...newTasksFromTemplate]);
    toast({
      title: "Template Applied",
      description: `Added ${template.steps.length} steps from the "${template.name}" template.`,
    });
  };

  const handleAddStep = () => {
    if (newStep.trim()) {
        setTasks(prev => [...prev, { id: Date.now(), title: newStep.trim(), description: '', selected: true }]);
        setNewStep('');
    }
  };

  const handleRemoveStep = (idToRemove: number) => {
    setTasks(prev => prev.filter(task => task.id !== idToRemove));
  };

  const handleToggleStep = (id: number) => {
      setTasks(prev => prev.map(task => task.id === id ? { ...task, selected: !task.selected } : task));
  };
  
  const handleUpdateStepTitle = (id: number, newTitle: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, title: newTitle } : task));
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
    const selectedTasks = tasks.filter(task => task.selected).map(({ id, selected, ...rest }) => rest);
    onProjectCreate(projectData, selectedTasks);
    onOpenChange(false);
  };
  
  const handleSaveTemplateClick = () => {
    const selectedTasks = tasks.filter(task => task.selected);
    if (selectedTasks.length === 0) {
      toast({
        variant: "destructive",
        title: "No Steps Selected",
        description: "Select some steps to include in the template before saving.",
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
    const selectedTasksForTemplate = tasks.filter(task => task.selected).map(({ id, selected, ...rest }) => rest);
    onSaveAsTemplate(newTemplateName, selectedTasksForTemplate);
    setIsSaveTemplateOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Create a New Project</DialogTitle>
            <DialogDescription>
              Fill in the project details and add initial tasks or steps. Only selected steps will be added to the project.
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
                <h3 className="text-lg font-semibold mb-2">Project Steps ({tasks.filter(t=>t.selected).length} Selected)</h3>
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
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm group">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox checked={task.selected} onCheckedChange={() => handleToggleStep(task.id)} id={`task-${task.id}`} />
                            {editingTaskId === task.id ? (
                                <Input 
                                    value={task.title} 
                                    onChange={(e) => handleUpdateStepTitle(task.id, e.target.value)}
                                    onBlur={() => setEditingTaskId(null)}
                                    onKeyDown={(e) => { if(e.key === 'Enter') setEditingTaskId(null); }}
                                    autoFocus
                                    className="h-7"
                                />
                            ) : (
                                <label htmlFor={`task-${task.id}`} className="flex-1 cursor-pointer">{task.title}</label>
                            )}
                          </div>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTaskId(task.id)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveStep(task.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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
                <DialogDescription>Enter a name for your new template. Only the selected steps will be saved.</DialogDescription>
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
