
"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { mockContacts, type Contact } from "@/data/contacts";

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // onTaskCreate?: (task: any) => void; // For future use
}

export function NewTaskDialog({ isOpen, onOpenChange }: NewTaskDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    // In a real app, you might fetch this data.
    // For now, we'll just use the mock data.
    setContacts(mockContacts);
  }, []);

  const handleSelectStartDate = (day: Date | undefined) => {
    if (!day) {
      setStartDate(undefined);
      return;
    }
    const newDate = startDate ? new Date(startDate) : new Date();
    newDate.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    if (!startDate) {
      newDate.setHours(9, 0, 0, 0);
    }
    setStartDate(newDate);
  };

  const handleStartTimeChange = (type: "hour" | "minute", value: string) => {
    const newDate = startDate ? new Date(startDate) : new Date();
    if (type === "hour") {
      newDate.setHours(parseInt(value, 10));
    } else {
      newDate.setMinutes(parseInt(value, 10));
    }
    setStartDate(newDate);
  };

  const handleSelectDueDate = (day: Date | undefined) => {
    if (!day) {
      setDueDate(undefined);
      return;
    }
    const newDate = dueDate ? new Date(dueDate) : new Date();
    newDate.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    if (!dueDate) {
      newDate.setHours(17, 0, 0, 0);
    }
    setDueDate(newDate);
  };

  const handleDueTimeChange = (type: "hour" | "minute", value: string) => {
    const newDate = dueDate ? new Date(dueDate) : new Date();
    if (type === "hour") {
      newDate.setHours(parseInt(value, 10));
    } else {
      newDate.setMinutes(parseInt(value, 10));
    }
    setDueDate(newDate);
  };


  const handleCreateTask = () => {
    // In a real app, you'd gather form data and create the task.
    // For now, we just close the dialog.
    console.log("Task created (mock)");
    onOpenChange(false);
  };
  
  const timeOptions = {
    hours: Array.from({ length: 24 }, (_, i) => i),
    minutes: [0, 15, 30, 45],
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <Label htmlFor="task-urgency">Urgency</Label>
                <Select>
                  <SelectTrigger id="task-urgency">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Start Date & Time</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={handleSelectStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Select
                    value={
                      startDate
                        ? String(startDate.getHours()).padStart(2, "0")
                        : undefined
                    }
                    onValueChange={(value) => handleStartTimeChange("hour", value)}
                    disabled={!startDate}
                  >
                    <SelectTrigger className="w-[5.5rem]">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.hours.map((hour) => (
                        <SelectItem
                          key={`start-hour-${hour}`}
                          value={String(hour)}
                        >
                          {String(hour).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={
                      startDate
                        ? String(startDate.getMinutes()).padStart(2, "0")
                        : undefined
                    }
                    onValueChange={(value) =>
                      handleStartTimeChange("minute", value)
                    }
                    disabled={!startDate}
                  >
                    <SelectTrigger className="w-[5.5rem]">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.minutes.map((minute) => (
                        <SelectItem
                          key={`start-min-${minute}`}
                          value={String(minute)}
                        >
                          {String(minute).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date & Time</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
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
                        onSelect={handleSelectDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Select
                    value={
                      dueDate
                        ? String(dueDate.getHours()).padStart(2, "0")
                        : undefined
                    }
                    onValueChange={(value) => handleDueTimeChange("hour", value)}
                    disabled={!dueDate}
                  >
                    <SelectTrigger className="w-[5.5rem]">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.hours.map((hour) => (
                        <SelectItem
                          key={`due-hour-${hour}`}
                          value={String(hour)}
                        >
                          {String(hour).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={
                      dueDate
                        ? String(dueDate.getMinutes()).padStart(2, "0")
                        : undefined
                    }
                    onValueChange={(value) =>
                      handleDueTimeChange("minute", value)
                    }
                    disabled={!dueDate}
                  >
                    <SelectTrigger className="w-[5.5rem]">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.minutes.map((minute) => (
                        <SelectItem
                          key={`due-min-${minute}`}
                          value={String(minute)}
                        >
                          {String(minute).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <Select>
                <SelectTrigger id="task-assignee">
                  <SelectValue placeholder="Assign to a team member" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateTask}>
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
