
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Project | null;
  onProjectSave: (updatedProject: Project) => void;
}

export function EditProjectDialog({
  isOpen,
  onOpenChange,
  project,
  onProjectSave,
}: EditProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [assignee, setAssignee] = useState("");
  const [importance, setImportance] = useState<'Critical' | 'Important' | 'Optional'>('Important');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    if (project && isOpen) {
      setName(project.name);
      setDescription(project.description || "");
      setOwner(project.owner || "");
      setAssignee(project.assignee || "");
      setImportance(project.importance || "Important");
      setDueDate(project.dueDate ? new Date(project.dueDate) : undefined);
    }
  }, [project, isOpen]);

  if (!project) return null;

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Project Name Required",
        description: "Please enter a name for your project.",
      });
      return;
    }

    const updatedProject: Project = {
      ...project,
      name: name.trim(),
      description: description.trim(),
      owner: owner.trim(),
      assignee: assignee.trim(),
      importance,
      dueDate,
    };

    onProjectSave(updatedProject);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project: {project.name}</DialogTitle>
          <DialogDescription>
            Update the details for your project.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="edit-project-name">Project Name</Label>
                <Input id="edit-project-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-project-description">Project Description</Label>
                <Textarea id="edit-project-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-project-owner">Project Owner</Label>
                    <Input id="edit-project-owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-project-assignee">Project Assignee</Label>
                    <Input id="edit-project-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-project-importance">Importance</Label>
                    <Select value={importance} onValueChange={(v) => setImportance(v as any)}>
                        <SelectTrigger id="edit-project-importance"><SelectValue /></SelectTrigger>
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
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditProjectDialog;
