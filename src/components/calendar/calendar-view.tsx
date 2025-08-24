
"use client"

import * as React from "react"
import { format, addDays, startOfWeek, endOfWeek, isSameMonth, addMonths, addWeeks, setHours, set, addMinutes } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Settings, ChevronDown, CheckCircle } from "lucide-react"

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
import { getTasksForUser } from "@/services/project-service";
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CalendarSkeleton } from "./calendar-skeleton";

type CalendarView = "day" | "5days" | "week" | "month";

const INCREMENT_OPTIONS = [15, 30, 60];

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
  
  const [expandedHours, setExpandedHours] = React.useState<Set<number>>(new Set());
  const [hourIncrements, setHourIncrements] = React.useState<Record<number, number>>({});

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


  const viewTitle = React.useMemo(() => {
    if (!date) return "Select a date";
    
    const formatRange = (start: Date, end: Date) => {
        if (start.getFullYear() !== end.getFullYear()) {
            return `${format(start, 'MMMM d, yyyy')} – ${format(end, 'MMMM d, yyyy')}`;
        }
        if (!isSameMonth(start, end)) {
             return `${format(start, 'MMMM d')} – ${format(end, 'MMMM d, yyyy')}`;
        }
        return `${format(start, 'MMMM d')} – ${format(end, 'd, yyyy')}`;
    }

    switch (view) {
      case 'day':
        return format(date, 'EEEE, MMMM d, yyyy');
      case '5days': {
        const end = addDays(date, 4);
        return formatRange(date, end);
      }
      case 'week': {
        const weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1; // Monday
        const start = startOfWeek(date, { weekStartsOn });
        const end = endOfWeek(date, { weekStartsOn });
        return formatRange(start, end);
      }
      case 'month':
        return format(date, 'MMMM yyyy');
      default:
        return format(date, 'PPP');
    }
  }, [date, view]);

  const viewOptions: { id: CalendarView; label: string }[] = [
    { id: "day", label: "Day" },
    { id: "5days", label: "5 Days" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
  ];
  
  const handlePrev = () => {
    if (!date) return;
    const newDate = view === 'month' ? addMonths(date, -1)
                  : view === 'week' ? addWeeks(date, -1)
                  : view === '5days' ? addDays(date, -5)
                  : addDays(date, -1);
    setDate(newDate);
  };
  
  const handleNext = () => {
    if (!date) return;
    const newDate = view === 'month' ? addMonths(date, 1)
                  : view === 'week' ? addWeeks(date, 1)
                  : view === '5days' ? addDays(date, 5)
                  : addDays(date, 1);
    setDate(newDate);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: format(setHours(new Date(), i), 'h a') }));
  
  const handleEventCreatedOrUpdated = React.useCallback(() => {
      loadData(); // Reload all data to ensure view is up to date
      setIsNewEventDialogOpen(false);
      setEventToEdit(null);
  }, [loadData]);
  
  const handleHourToggle = (hour: number) => {
    setExpandedHours(prev => {
        const newSet = new Set(prev);
        if (newSet.has(hour)) {
            newSet.delete(hour);
        } else {
            newSet.add(hour);
            if (!hourIncrements[hour]) {
                setHourIncrements(prevIncrements => ({
                    ...prevIncrements,
                    [hour]: 15
                }));
            }
        }
        return newSet;
    });
  };
  
  const handleIncrementChange = (hour: number, direction: 'up' | 'down') => {
    setHourIncrements(prevIncrements => {
        const currentIncrement = prevIncrements[hour] || 15;
        const currentIndex = INCREMENT_OPTIONS.indexOf(currentIncrement);
        let nextIndex;
        if (direction === 'up') {
            nextIndex = (currentIndex + 1) % INCREMENT_OPTIONS.length;
        } else {
            nextIndex = (currentIndex - 1 + INCREMENT_OPTIONS.length) % INCREMENT_OPTIONS.length;
        }
        return {
            ...prevIncrements,
            [hour]: INCREMENT_OPTIONS[nextIndex]
        };
    });
  };

  const handleTimeSlotClick = (time: Date) => {
    setEventToEdit(null);
    setNewEventDefaultDate(time);
    setIsNewEventDialogOpen(true);
  };
  
  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <>
      <div className="p-4 sm:p-6 h-full flex flex-col space-y-6">
        {/* --- TOP FRAME (STATIC CONTROLS) --- */}
        <div>
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
        </div>
        
        {/* --- BOTTOM FRAME (SCROLLABLE CONTENT) --- */}
        <div className="flex-1 bg-card rounded-lg border p-4 min-h-0">
          <header className="text-center mb-4">
              <h3 className="text-lg font-semibold">Customizable Time Slots</h3>
          </header>
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              {Array.from({ length: viewEndHour - viewStartHour }).map((_, i) => {
                const hour = viewStartHour + i;
                const isExpanded = expandedHours.has(hour);
                const increment = hourIncrements[hour] || 15;
                
                return (
                  <div key={hour} className="border border-foreground rounded-lg p-2">
                    <div className="flex items-start">
                        <time 
                            className="font-semibold w-20 text-right pr-4 pt-1 cursor-pointer"
                            onClick={() => handleHourToggle(hour)}
                        >
                            {format(set(new Date(), { hours: hour }), 'h a')}
                        </time>
                        <div className="flex-1 justify-start gap-2 text-xs text-muted-foreground flex pt-1 min-h-[24px]">
                           {isExpanded && (
                                <div className="flex items-center gap-1 text-foreground animate-in fade-in-50 duration-300">
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleIncrementChange(hour, 'down')}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs w-16 text-center font-mono bg-muted rounded-sm py-0.5">{increment} min slots</span>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleIncrementChange(hour, 'up')}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    {isExpanded && (
                        <div className="grid grid-cols-1 gap-1 pl-20 mt-1">
                            {Array.from({ length: 60 / increment }).map((_, slotIndex) => {
                                const slotTime = addMinutes(set(date || new Date(), { hours: hour }), slotIndex * increment);
                                const slotEndTime = addMinutes(slotTime, increment);
                                const slotEvents = events.filter(e => e.start >= slotTime && e.start < slotEndTime);

                                return (
                                    <div
                                        key={slotIndex}
                                        className="border border-border rounded p-1 min-h-[50px] cursor-pointer hover:bg-accent/50"
                                        onClick={() => slotEvents.length === 0 && handleTimeSlotClick(slotTime)}
                                    >
                                        <time className="text-xs text-muted-foreground">{format(slotTime, 'p')}</time>
                                        {slotEvents.map(event => (
                                            <div key={event.id} className="text-xs bg-primary/20 p-1 rounded my-1">
                                                <p className="font-semibold truncate">{event.title}</p>
                                                <p>{format(event.start, 'p')} - {format(event.end, 'p')}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                  </div>
                );
              })}
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
    </>
  );
}
