
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
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (project && isOpen) {
      setProjectName(project.name);
      setProjectDescription(project.description || "");
    }
  }, [project, isOpen]);

  if (!project) return null;

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

    onProjectSave(updatedProject);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project: {project.name}</DialogTitle>
          <DialogDescription>
            Update the name and description for your project.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
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
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditProjectDialog;

    