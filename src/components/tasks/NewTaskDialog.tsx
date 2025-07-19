
"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Clock, ChevronsUpDown, Check } from "lucide-react";
import { format, set } from "date-fns";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { type Event } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTaskCreate: (newEvent: Omit<Event, 'id' | 'userId'>) => void;
  onTaskUpdate: (updatedEvent: Omit<Event, 'userId'>) => void;
  eventToEdit?: Event | null;
  projectId: string | null;
  defaultStatus?: 'todo' | 'inProgress' | 'done';
}


export function NewTaskDialog({ isOpen, onOpenChange, onTaskCreate, onTaskUpdate, eventToEdit, projectId, defaultStatus = 'todo' }: NewTaskDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<'todo' | 'inProgress' | 'done'>(defaultStatus);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  
  const { toast } = useToast();
  
  const isEditMode = !!eventToEdit;

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStatus(defaultStatus);
    setDueDate(undefined);
  }, [defaultStatus]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && eventToEdit) {
          setTitle(eventToEdit.title);
          setDescription(eventToEdit.description || "");
          setStatus(eventToEdit.status);
          setDueDate(eventToEdit.end);
      } else {
        resetForm();
      }
    }
  }, [isOpen, eventToEdit, isEditMode, resetForm]);
  

  const handleSaveTask = () => {
    if (!title.trim()) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "A task title is required.",
        });
        return;
    }

    if (!isEditMode && projectId === null) {
      toast({
        variant: "destructive",
        title: "No Project Selected",
        description: "A task must belong to a project.",
      });
      return;
    }
    
    if (isEditMode && eventToEdit) {
        const updatedEvent: Omit<Event, 'userId'> = {
            ...eventToEdit,
            title,
            description: description,
            end: dueDate || eventToEdit.end,
            status,
        };
        onTaskUpdate(updatedEvent);
    } else {
        const now = new Date();
        const newEventData: Omit<Event, 'id' | 'userId'> = {
            title,
            description: description,
            start: now,
            end: dueDate || new Date(now.getTime() + 24 * 60 * 60 * 1000), // Default due date 1 day from now
            attendees: [],
            status,
            projectId: projectId,
        };
        onTaskCreate(newEventData);
    }

    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details for your task." : "Fill out the details below to add a new task."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
                id="task-title"
                placeholder="e.g., Deploy the new feature"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            </div>
            <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
                id="task-description"
                placeholder="Provide a detailed description of the task..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="task-status">Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as 'todo' | 'inProgress' | 'done')}>
                    <SelectTrigger id="task-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="inProgress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
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
                            {dueDate ? (
                                format(dueDate, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveTask}>{isEditMode ? "Save Changes" : "Create Task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewTaskDialog;
