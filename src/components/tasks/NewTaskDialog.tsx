
"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
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

const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const date = set(new Date(), { hours: i });
    return {
        value: String(i),
        label: format(date, 'h a'),
    };
});

const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const minutes = i * 5;
    return {
        value: String(minutes),
        label: `:${minutes.toString().padStart(2, '0')}`,
    };
});


export function NewTaskDialog({ isOpen, onOpenChange, defaultStartDate }: NewTaskDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startHour, setStartHour] = useState<string | undefined>();
  const [startMinute, setStartMinute] = useState<string | undefined>();
  
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueHour, setDueHour] = useState<string | undefined>();
  const [dueMinute, setDueMinute] = useState<string | undefined>();

  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    // When the dialog opens or the default date changes, reset the state
    if (isOpen) {
      setStartDate(defaultStartDate);
      if (defaultStartDate) {
        setStartHour(String(defaultStartDate.getHours()));
        const roundedMinute = Math.round(defaultStartDate.getMinutes() / 5) * 5;
        setStartMinute(String(roundedMinute));
      } else {
        setStartHour(undefined);
        setStartMinute(undefined);
      }

      setDueDate(undefined);
      setDueHour(undefined);
      setDueMinute(undefined);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            "w-[160px] justify-start text-left font-normal",
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
                        value={startHour}
                        onValueChange={setStartHour}
                        disabled={!startDate}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {hourOptions.map((option) => (
                              <SelectItem key={`start-hour-${option.value}`} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                     <Select
                        value={startMinute}
                        onValueChange={setStartMinute}
                        disabled={!startDate}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map((option) => (
                              <SelectItem key={`start-minute-${option.value}`} value={option.value}>{option.label}</SelectItem>
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
                            "w-[160px] justify-start text-left font-normal",
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
                        value={dueHour}
                        onValueChange={setDueHour}
                        disabled={!dueDate}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                            {hourOptions.map((option) => (
                                <SelectItem key={`due-hour-${option.value}`} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select
                        value={dueMinute}
                        onValueChange={setDueMinute}
                        disabled={!dueDate}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                        <SelectContent>
                           {minuteOptions.map((option) => (
                                <SelectItem key={`due-minute-${option.value}`} value={option.value}>{option.label}</SelectItem>
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
