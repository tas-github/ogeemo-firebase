
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
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
import { type Event } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";

interface NewTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  defaultStartDate?: Date;
  eventToEdit?: Event | null;
  onTaskCreate?: (newEvent: Event) => void;
  onTaskUpdate?: (updatedEvent: Event) => void;
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


export function NewTaskDialog({ isOpen, onOpenChange, defaultStartDate, eventToEdit, onTaskCreate, onTaskUpdate }: NewTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string | undefined>();
  const [urgency, setUrgency] = useState<string | undefined>();
  const [assigneeId, setAssigneeId] = useState<string | undefined>();

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startHour, setStartHour] = useState<string | undefined>();
  const [startMinute, setStartMinute] = useState<string | undefined>();
  
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueHour, setDueHour] = useState<string | undefined>();
  const [dueMinute, setDueMinute] = useState<string | undefined>();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const { toast } = useToast();
  
  const isEditMode = !!eventToEdit;

  const resetForm = (date = defaultStartDate) => {
    setTitle("");
    setDescription("");
    setPriority(undefined);
    setUrgency(undefined);
    setAssigneeId(undefined);
    setStartDate(date);
    if (date) {
      setStartHour(String(date.getHours()));
      const roundedMinute = Math.round(date.getMinutes() / 5) * 5;
      setStartMinute(String(roundedMinute));
    } else {
      setStartHour(undefined);
      setStartMinute(undefined);
    }
    setDueDate(undefined);
    setDueHour(undefined);
    setDueMinute(undefined);
  };

  useEffect(() => {
    // In a real app, you might fetch this data.
    setContacts(mockContacts);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && eventToEdit) {
          setTitle(eventToEdit.title);
          setDescription(eventToEdit.description);
          setPriority(undefined);
          setUrgency(undefined);

          const start = eventToEdit.start;
          const end = eventToEdit.end;
          setStartDate(start);
          setStartHour(String(start.getHours()));
          setStartMinute(String(start.getMinutes()));
          setDueDate(end);
          setDueHour(String(end.getHours()));
          setDueMinute(String(end.getMinutes()));
          
          if (eventToEdit.attendees.length > 1) {
              const assigneeName = eventToEdit.attendees[1];
              const contact = mockContacts.find(c => c.name === assigneeName);
              if (contact) {
                  setAssigneeId(contact.id);
              } else {
                  setAssigneeId(undefined);
              }
          } else {
              setAssigneeId(undefined);
          }
      } else {
        resetForm(defaultStartDate);
      }
    }
  }, [isOpen, eventToEdit, defaultStartDate]);

  const handleSaveTask = () => {
    if (!title.trim()) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "A task title is required.",
        });
        return;
    }

    const now = new Date();
    
    const finalStartDate = startDate || now;
    const finalStartHour = startHour ? parseInt(startHour, 10) : now.getHours();
    const finalStartMinute = startMinute ? parseInt(startMinute, 10) : Math.floor(now.getMinutes() / 5) * 5;

    const startDateTime = set(finalStartDate, {
        hours: finalStartHour,
        minutes: finalStartMinute,
        seconds: 0,
        milliseconds: 0,
    });
    
    let endDateTime;

    if (dueDate && dueHour && dueMinute) {
        endDateTime = set(dueDate, {
            hours: parseInt(dueHour, 10),
            minutes: parseInt(dueMinute, 10),
            seconds: 0,
            milliseconds: 0,
        });
        
        if (endDateTime <= startDateTime) {
          toast({
              variant: "destructive",
              title: "Invalid Date",
              description: "The due date and time must be after the start date and time.",
          });
          return;
        }
    } else {
        // Default end time to 30 minutes after start time
        endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);
    }
    
    const assignee = contacts.find(c => c.id === assigneeId);
    
    if (isEditMode && eventToEdit) {
        const updatedEvent: Event = {
            ...eventToEdit,
            title,
            description,
            start: startDateTime,
            end: endDateTime,
            attendees: assignee ? ['You', assignee.name] : ['You'],
        };
        onTaskUpdate?.(updatedEvent);
        toast({
            title: "Task Updated",
            description: `"${updatedEvent.title}" has been successfully updated.`,
        });
    } else {
        const newEvent: Event = {
            id: `event-${Date.now()}`,
            title,
            description,
            start: startDateTime,
            end: endDateTime,
            attendees: assignee ? ['You', assignee.name] : ['You'],
            status: 'todo',
        };
        onTaskCreate?.(newEvent);
        toast({
            title: "Task Created",
            description: `"${newEvent.title}" has been successfully created.`,
        });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{isEditMode ? "Edit Task" : "Create a New Task"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details for your task." : "Fill out the details below to add a new task to your board."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
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
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
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
                <Select value={urgency} onValueChange={setUrgency}>
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
              <Label htmlFor="task-contact">Contact</Label>
              <div className="flex items-center gap-2">
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger id="task-contact">
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" asChild>
                  <Link href="/contacts" target="_blank" rel="noopener noreferrer">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add New Contact</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTask}>{isEditMode ? "Save Changes" : "Create Task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
