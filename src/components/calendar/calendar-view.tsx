
"use client"

import * as React from "react"
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { format, addDays, startOfWeek, isSameDay, set, addMinutes, getHours, differenceInMinutes, startOfDay } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarShadCN } from "@/components/ui/calendar"
import { ScrollArea } from "../ui/scroll-area"
import { type Event } from '@/types/calendar'
import { NewTaskDialog } from "../tasks/NewTaskDialog"
import { getContacts, type Contact } from "@/services/contact-service"
import { getTasksForUser, updateTask } from "@/services/project-service";
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CalendarSkeleton } from "./calendar-skeleton";

type CalendarView = "day" | "5days" | "week" | "month";

const INCREMENT_OPTIONS = [5, 10, 15, 30, 60];
const DND_ITEM_TYPE = 'event';


const DraggableEvent = ({ event, onEventClick }: { event: Event; onEventClick: () => void }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: DND_ITEM_TYPE,
        item: event,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            onClick={onEventClick}
            className={cn(
                "text-xs bg-primary/20 text-primary-foreground p-1 rounded my-1 cursor-move",
                isDragging && "opacity-50"
            )}
        >
            <p className="font-semibold truncate text-foreground">{event.title}</p>
            <p className="opacity-80">{format(event.start, 'p')} - {format(event.end, 'p')}</p>
        </div>
    );
};


export function CalendarView() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [view, setView] = React.useState<CalendarView>("week");
  
  const [viewStartHour, setViewStartHour] = React.useState(8);
  const [viewEndHour, setViewEndHour] = React.useState(18);

  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = React.useState(false);
  const [newEventDefaultDate, setNewEventDefaultDate] = React.useState<Date | null>(null);
  const [eventToEdit, setEventToEdit] = React.useState<Event | null>(null);

  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [expandedHours, setExpandedHours] = React.useState<Set<string>>(new Set());
  const [hourIncrements, setHourIncrements] = React.useState<Record<string, number>>({});

  const loadData = React.useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const [fetchedContacts, fetchedEvents] = await Promise.all([
            getContacts(user.uid),
            getTasksForUser(user.uid)
        ]);
        setContacts(fetchedContacts);
        setEvents(fetchedEvents);
    } catch (error) {
        console.error("Failed to load calendar data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load calendar data.' });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const daysInView = React.useMemo(() => {
    if (!date) return [];
    const weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1; // Monday
    switch(view) {
        case 'day':
            return [startOfDay(date)];
        case '5days':
            return Array.from({ length: 5 }, (_, i) => startOfDay(addDays(date, i)));
        case 'week':
            const start = startOfWeek(date, { weekStartsOn });
            return Array.from({ length: 7 }, (_, i) => startOfDay(addDays(start, i)));
        default:
            return [];
    }
  }, [date, view]);

  const viewTitle = React.useMemo(() => {
    if (!date) return "Select a date";
    if (view === 'month') return format(date, 'MMMM yyyy');
    if (daysInView.length === 1) return format(date, 'EEEE, MMMM d, yyyy');
    if (daysInView.length > 1) {
        const start = daysInView[0];
        const end = daysInView[daysInView.length - 1];
        if (start.getFullYear() !== end.getFullYear()) {
            return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
        }
        if (start.getMonth() !== end.getMonth()) {
             return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
        }
        return `${format(start, 'MMMM d')} – ${format(end, 'd, yyyy')}`;
    }
    return format(date, 'PPP');
  }, [date, view, daysInView]);


  const viewOptions: { id: CalendarView; label: string }[] = [
    { id: "day", label: "Day" },
    { id: "5days", label: "5 Days" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
  ];
  
  const handlePrev = () => {
    if (!date) return;
    const newDate = view === 'month' ? addDays(date, -28) // approx.
                  : view === 'week' ? addDays(date, -7)
                  : view === '5days' ? addDays(date, -5)
                  : addDays(date, -1);
    setDate(newDate);
  };
  
  const handleNext = () => {
    if (!date) return;
    const newDate = view === 'month' ? addDays(date, 28)
                  : view === 'week' ? addDays(date, 7)
                  : view === '5days' ? addDays(date, 5)
                  : addDays(date, 1);
    setDate(newDate);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: format(set(new Date(), { hours: i }), 'h a') }));
  
  const handleEventCreatedOrUpdated = React.useCallback(() => {
      loadData();
      setIsNewEventDialogOpen(false);
      setEventToEdit(null);
  }, [loadData]);

  const handleEventDrop = React.useCallback(async (eventId: string, newStartTime: Date) => {
    const eventToMove = events.find(e => e.id === eventId);
    if (!eventToMove) return;

    const originalStartTime = eventToMove.start;
    const durationMinutes = differenceInMinutes(eventToMove.end, eventToMove.start);
    const newEndTime = addMinutes(newStartTime, durationMinutes);

    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, start: newStartTime, end: newEndTime } : e));

    try {
        await updateTask(eventId, { start: newStartTime, end: newEndTime });
        toast({ title: "Event Rescheduled", description: `"${eventToMove.title}" moved to ${format(newStartTime, 'p')}.` });
    } catch (error) {
        console.error("Failed to update event:", error);
        toast({ variant: 'destructive', title: "Update Failed", description: "Could not save the new event time." });
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, start: originalStartTime, end: eventToMove.end } : e));
    }
  }, [events, toast]);
  
  const handleHourToggle = (day: Date, hour: number) => {
    const key = `${format(day, 'yyyy-MM-dd')}-${hour}`;
    setExpandedHours(prev => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
            if (!hourIncrements[key]) {
                setHourIncrements(prevIncrements => ({
                    ...prevIncrements,
                    [key]: 15
                }));
            }
        }
        return newSet;
    });
  };
  
  const handleIncrementChange = (key: string, direction: 'up' | 'down') => {
    setHourIncrements(prevIncrements => {
        const currentIncrement = prevIncrements[key] || 15;
        const currentIndex = INCREMENT_OPTIONS.indexOf(currentIncrement);
        let nextIndex;
        if (direction === 'up') {
            nextIndex = (currentIndex + 1) % INCREMENT_OPTIONS.length;
        } else {
            nextIndex = (currentIndex - 1 + INCREMENT_OPTIONS.length) % INCREMENT_OPTIONS.length;
        }
        return {
            ...prevIncrements,
            [key]: INCREMENT_OPTIONS[nextIndex]
        };
    });
  };

  const handleTimeSlotClick = (time: Date) => {
    setEventToEdit(null);
    setNewEventDefaultDate(time);
    setIsNewEventDialogOpen(true);
  };
  
  const handleEventClick = (event: Event) => {
    setEventToEdit(event);
    setNewEventDefaultDate(null);
    setIsNewEventDialogOpen(true);
  };
  
  if (isLoading) {
    return <CalendarSkeleton />;
  }
  
  if (view === 'month') {
    return (
      <div className="p-4 sm:p-6 h-full flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Month view is coming soon.</p>
        <Button onClick={() => setView('week')} className="mt-4">Switch to Week View</Button>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 sm:p-6 h-full flex flex-col">
        {/* --- TOP FRAME (STATIC CONTROLS) --- */}
        <header className="text-center mb-6">
            <h1 className="text-3xl font-bold font-headline text-primary">Calendar</h1>
            <p className="text-muted-foreground">Manage your schedule, events and appointments.</p>
        </header>
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}><span className="sr-only">Previous period</span><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}><span className="sr-only">Next period</span><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <h2 className="text-xl font-semibold font-headline text-center">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost">{viewTitle}</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <CalendarShadCN mode="single" selected={date} onSelect={setDate} />
                    </PopoverContent>
                </Popover>
            </h2>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                    {viewOptions.map((option) => (
                        <Button key={option.id} variant={view === option.id ? "secondary" : "ghost"} size="sm" onClick={() => setView(option.id)} className="h-8 px-3">
                            {option.label}
                        </Button>
                    ))}
                </div>
                <Button className="h-8 py-1" onClick={() => { setEventToEdit(null); setNewEventDefaultDate(new Date()); setIsNewEventDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Event</Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 space-y-4">
                        <div className="space-y-2">
                            <Label className="font-semibold">View Start Hour</Label>
                            <Select value={String(viewStartHour)} onValueChange={(v) => setViewStartHour(Number(v))}>
                                <SelectTrigger className="h-8 py-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{hourOptions.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                          <div className="space-y-2">
                            <Label className="font-semibold">View End Hour</Label>
                            <Select value={String(viewEndHour)} onValueChange={(v) => setViewEndHour(Number(v))}>
                                <SelectTrigger className="h-8 py-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{hourOptions.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
        
        {/* --- BOTTOM FRAME (SCROLLABLE CONTENT) --- */}
        <div className="flex-1 min-h-0 flex flex-col">
            <ScrollArea className="flex-1">
                <div className="flex h-full">
                    <div className="w-24 shrink-0">
                         {Array.from({ length: viewEndHour - viewStartHour }).map((_, i) => {
                             const hour = viewStartHour + i;
                             return (
                                <div key={hour} className="relative h-[120px] border-r border-b text-right pr-2">
                                    <time className="text-xs text-muted-foreground absolute -top-2 right-2">{format(set(new Date(), { hours: hour }), 'h a')}</time>
                                </div>
                             )
                         })}
                    </div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysInView.length}, minmax(0, 1fr))`}}>
                        {daysInView.map((day) => {
                            const eventsOnDay = events.filter(e => isSameDay(e.start, day));
                            return (
                                <div key={day.toISOString()} className="border-r last:border-r-0 relative">
                                    {Array.from({ length: viewEndHour - viewStartHour }).map((_, i) => {
                                        const hour = viewStartHour + i;
                                        const hourKey = `${format(day, 'yyyy-MM-dd')}-${hour}`;
                                        const isExpanded = expandedHours.has(hourKey);
                                        const increment = hourIncrements[hourKey] || 15;
                                        const hourStartTime = set(day, { hours: hour, minutes: 0 });
                                        const eventsInHour = eventsOnDay.filter(e => getHours(e.start) === hour);
                                        
                                        const HourDropTarget = ({ children, time }: { children: React.ReactNode, time: Date }) => {
                                            const [{ isOver }, drop] = useDrop(() => ({
                                                accept: DND_ITEM_TYPE,
                                                drop: (item: Event) => handleEventDrop(item.id, time),
                                                collect: (monitor) => ({ isOver: !!monitor.isOver() }),
                                            }));
                                            return <div ref={drop} className={cn("flex-1", isOver && "bg-accent")}>{children}</div>;
                                        };

                                        return (
                                            <div key={hour} className="h-[120px] border-b p-1">
                                                <HourDropTarget time={hourStartTime}>
                                                    <div className="space-y-1 w-full h-full">
                                                        {eventsInHour.map(event => (
                                                            <DraggableEvent key={event.id} event={event} onEventClick={() => handleEventClick(event)} />
                                                        ))}
                                                    </div>
                                                </HourDropTarget>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </ScrollArea>
        </div>
      </div>
      
      <NewTaskDialog
        isOpen={isNewEventDialogOpen}
        onOpenChange={(open) => {
            setIsNewEventDialogOpen(open);
            if (!open) setEventToEdit(null);
        }}
        onTaskCreate={handleEventCreatedOrUpdated}
        onTaskUpdate={handleEventCreatedOrUpdated}
        initialMode="task"
        contacts={contacts}
        eventToEdit={eventToEdit}
        defaultValues={{
            isScheduled: true,
            startDate: newEventDefaultDate || undefined,
            startHour: newEventDefaultDate ? String(newEventDefaultDate.getHours()) : undefined,
            startMinute: newEventDefaultDate ? String(newEventDefaultDate.getMinutes()) : undefined,
        }}
      />
    </DndProvider>
  );
}
