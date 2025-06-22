
"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, setHours, set } from "date-fns";

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
  defaultStartDate?: Date;
}

const timeOptions = Array.from({ length: 24 * 12 }, (_, i) => {
    const totalMinutes = i * 5;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const date = set(new Date(), { hours, minutes });
    return {
        value: `${hours}:${minutes}`,
        label: format(date, 'h:mm a'),
    };
});

export function NewTaskDialog({ isOpen, onOpenChange, defaultStartDate }: NewTaskDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<string | undefined>();
  
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueTime, setDueTime] = useState<string | undefined>();

  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    // When the dialog opens or the default date changes, reset the state
    if (isOpen) {
      setStartDate(defaultStartDate);
      if (defaultStartDate) {
        const hour = defaultStartDate.getHours();
        const minute = Math.round(defaultStartDate.getMinutes() / 5) * 5;
        setStartTime(`${hour}:${minute}`);
      } else {
        setStartTime(undefined);
      }

      setDueDate(undefined);
      setDueTime(undefined);
    }
  }, [isOpen, defaultStartDate]);


  useEffect(() => {
    // In a real app, you might fetch this data.
    setContacts(mockContacts);
  }, []);

  const handleCreateTask = () => {
    // In a real app, you'd gather form data and create the task.
    console.log("Task created (mock)");
    onOpenChange(false);
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
                        onSelect={setStartDate}
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                    <Select
                        value={startTime}
                        onValueChange={setStartTime}
                        disabled={!startDate}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                        {timeOptions.map((option) => (
                            <SelectItem key={`start-time-${option.value}`} value={option.value}>{option.label}</SelectItem>
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
                        onSelect={setDueDate}
                        disabled={(date) => startDate ? date < startDate : false}
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                    <Select
                        value={dueTime}
                        onValueChange={setDueTime}
                        disabled={!dueDate}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                        {timeOptions.map((option) => (
                            <SelectItem key={`due-time-${option.value}`} value={option.value}>{option.label}</SelectItem>
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
          <Button onClick={handleCreateTask}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
