
"use client"

import * as React from "react"
import { format, addDays, setHours, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek, set, startOfMinute, startOfMonth, endOfMonth, isToday, isSameMonth, addMonths, addWeeks, getMinutes, getHours } from "date-fns"
import { ChevronLeft, ChevronRight, LoaderCircle, Plus } from "lucide-react"
import { useDrag, useDrop } from 'react-dnd';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { addTask, getTasksForUser, updateTask } from "@/services/project-service";
import { type Event } from "@/types/calendar";
import { getContacts, type Contact } from "@/services/contact-service";
import { NewTaskDialog } from "../tasks/NewTaskDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { HourlyPlannerDialog } from "./hourly-planner-dialog";


type CalendarView = "day" | "5days" | "week" | "month";

const DraggableTimelineEvent = ({ event, style, className, onClick }: { event: Event; style: React.CSSProperties; className: string, onClick: () => void }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'event',
    item: event,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{ ...style, opacity: isDragging ? 0.5 : 1 }}
      className={cn(className, "cursor-move")}
      onClick={onClick}
    >
      <p className="font-bold text-xs truncate">{event.title}</p>
      <p className="text-xs opacity-80 truncate">{format(event.start, 'p')} - {format(event.end, 'p')}</p>
    </div>
  );
};

const TimelineDayColumn = ({
  day,
  dayEvents,
  viewStartHour,
  viewEndHour,
  onEventDrop,
  onEventClick,
  hideHeader = false,
  today,
}: {
  day: Date;
  dayEvents: Event[];
  viewStartHour: number;
  viewEndHour: number;
  onEventDrop: (eventId: string, newStart: Date) => void;
  onEventClick: (event: Event) => void;
  hideHeader?: boolean;
  today: Date | null;
}) => {
  const PIXELS_PER_MINUTE = 2;
  const hours = Array.from({ length: viewEndHour - viewStartHour }, (_, i) => i + viewStartHour);
  const dropRef = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop(() => ({
    accept: 'event',
    drop: (item: Event, monitor) => {
      if (!dropRef.current) return;
      const dropTargetRect = dropRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      const dropY = clientOffset.y - dropTargetRect.top;
      const minutesFromStartOfDay = (dropY / (60 * PIXELS_PER_MINUTE)) * 60;
      
      const newHour = viewStartHour + Math.floor(minutesFromStartOfDay / 60);
      const newMinute = minutesFromStartOfDay % 60;
      
      const snappedMinute = Math.round(newMinute / 15) * 15;
      
      const newStartDate = set(day, { hours: newHour, minutes: snappedMinute, seconds: 0, milliseconds: 0 });
      
      onEventDrop(item.id, newStartDate);
    },
  }));

  drop(dropRef);
  
  const calculateEventPosition = (event: Event) => {
    const startMinutes = getHours(event.start) * 60 + getMinutes(event.start);
    const top = (startMinutes - viewStartHour * 60) * PIXELS_PER_MINUTE;
    const durationMinutes = Math.max(15, (event.end.getTime() - event.start.getTime()) / 60000);
    const height = durationMinutes * PIXELS_PER_MINUTE;

    return { top, height };
  }

  return (
    <div className={cn("border-r last:border-r-0", hideHeader && "border-t")}>
      {!hideHeader && (
        <div className="sticky top-0 z-10 h-16 border-b bg-background text-center">
          <p className="text-sm font-semibold">{format(day, 'EEE')}</p>
          <p className={cn("text-2xl font-bold", today && isSameDay(day, today) && "text-primary")}>{format(day, 'd')}</p>
        </div>
      )}
      <div ref={dropRef} className="relative">
        {hours.map(hour => (
          <div key={`hour-container-${hour}-${day.toISOString()}`} className="border-b h-[120px]" />
        ))}
        {dayEvents.map(event => {
          const { top, height } = calculateEventPosition(event);
          return (
            <DraggableTimelineEvent
              key={event.id}
              event={event}
              style={{ top: `${top}px`, height: `${height}px` }}
              className="absolute left-1 right-1 rounded-lg bg-primary/20 p-2 border border-primary/50 overflow-hidden text-primary"
              onClick={() => onEventClick(event)}
            />
          );
        })}
      </div>
    </div>
  );
};

const MonthView = ({ date, events, onEventClick, today }: { date: Date; events: Event[], onEventClick: (event: Event) => void; today: Date | null }) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col h-full">
      <header className="grid grid-cols-7 flex-none text-center font-semibold text-sm text-muted-foreground border-t border-l border-r">
        {weekDays.map(day => (
          <div key={day} className="py-2 border-b border-r last:border-r-0">
            {day}
          </div>
        ))}
      </header>
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,_1fr)] border-l">
          {days.map((day) => {
            const dayEvents = events.filter(event => isSameDay(event.start, day));
            return (
              <div
                key={day.toString()}
                className={cn(
                  "border-b border-r p-2 flex flex-col",
                  !isSameMonth(day, date) && "bg-muted/20",
                )}
              >
                <p className={cn(
                  "font-medium text-sm self-start",
                  today && isSameDay(day, today) && "bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center",
                  !isSameMonth(day, date) && "text-muted-foreground"
                )}>
                  {format(day, 'd')}
                </p>
                <div className="mt-1 space-y-1 overflow-hidden">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded bg-primary/20 text-primary truncate cursor-pointer"
                      title={event.title}
                      onClick={() => onEventClick(event)}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export function CalendarView() {
  const [date, setDate] = React.useState<Date | undefined>();
  const [today, setToday] = React.useState<Date | null>(null);
  const [view, setView] = React.useState<CalendarView>("day");
  const [events, setEvents] = React.useState<Event[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [viewStartHour, setViewStartHour] = React.useState(8);
  const [viewEndHour, setViewEndHour] = React.useState(18);
  const [timeSlotIncrement, setTimeSlotIncrement] = React.useState(15);
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [eventToEdit, setEventToEdit] = React.useState<Event | null>(null);
  const [dialogDefaultValues, setDialogDefaultValues] = React.useState({});

  const [isPlannerOpen, setIsPlannerOpen] = React.useState(false);
  const [plannerDate, setPlannerDate] = React.useState<Date>(new Date());
  const [plannerHour, setPlannerHour] = React.useState(9);

  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    const now = new Date();
    setDate(now);
    setToday(now);
  }, []);
  
  const loadData = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    };
    setIsLoading(true);
    try {
        const [userTasks, userContacts] = await Promise.all([
            getTasksForUser(user.uid),
            getContacts(user.uid)
        ]);
        setEvents(userTasks);
        setContacts(userContacts);
    } catch(error: any) {
        toast({ variant: "destructive", title: "Could not load data", description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);
  
  React.useEffect(() => {
    loadData();
  }, [loadData]);


  const handleTaskCreate = async (taskData: Omit<Event, 'id' | 'userId'>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create events.' });
        return;
    }
    try {
        const newEvent = await addTask({ ...taskData, userId: user.uid, position: 0 }); // position needs logic
        setEvents(prev => [...prev, newEvent]);
        toast({ title: "Event Created" });
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Failed to create event', description: error.message });
    }
  };

  const handleTaskUpdate = async (updatedEventData: Event) => {
    try {
      await updateTask(updatedEventData.id, updatedEventData);
      setEvents(prev => prev.map(e => e.id === updatedEventData.id ? { ...e, ...updatedEventData } : e));
      toast({ title: "Event Updated" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to update event', description: error.message });
    }
  };
  
  const handleDialogClose = (open: boolean) => {
    setIsTaskDialogOpen(open);
    if (!open) {
        setEventToEdit(null);
        setDialogDefaultValues({});
        loadData();
    }
  };

  const handleEventClick = (event: Event) => {
    setEventToEdit(event);
    setDialogDefaultValues({
      ...event,
      isScheduled: true,
      startDate: event.start,
      endDate: event.end,
      startHour: String(event.start.getHours()),
      startMinute: String(event.start.getMinutes()),
      endHour: String(event.end.getHours()),
      endMinute: String(event.end.getMinutes()),
    });
    setIsTaskDialogOpen(true);
  };
  
  const handleTimeSlotClick = (time: Date) => {
      setDialogDefaultValues({
          isScheduled: true,
          startDate: time,
          startHour: String(time.getHours()),
          startMinute: String(time.getMinutes()),
      });
      setIsTaskDialogOpen(true);
      setIsPlannerOpen(false);
  }
  
  const handleOpenPlanner = (hour: number) => {
      if (!date) return;
      setPlannerDate(date);
      setPlannerHour(hour);
      setIsPlannerOpen(true);
  }

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

  const handleEventDrop = React.useCallback(async (eventId: string, newStart: Date) => {
    const eventToUpdate = events.find(e => e.id === eventId);
    if (!eventToUpdate) return;

    const duration = eventToUpdate.end.getTime() - eventToUpdate.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    
    try {
      await updateTask(eventId, { start: newStart, end: newEnd });
      setEvents(prevEvents => prevEvents.map(e => 
        e.id === eventId ? { ...e, start: newStart, end: newEnd } : e
      ));
      toast({ title: "Event Time Updated" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to update event time', description: error.message });
    }
  }, [events, toast]);
  
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

  const hours = React.useMemo(() => {
    return Array.from({ length: viewEndHour - viewStartHour }, (_, i) => i + viewStartHour);
  }, [viewStartHour, viewEndHour]);

  const renderTimelineView = (days: Date[]) => {
    if (days.length === 0) return null;
    
    const hideDayHeader = days.length === 1;

    return (
      <ScrollArea className="h-full w-full">
        <div className="flex" style={{ minWidth: 80 + 150 * days.length }}>
          <div className="sticky left-0 z-20 w-24 shrink-0 bg-background">
            {!hideDayHeader && <div className="h-16 border-b border-r">&nbsp;</div>}
            <div>
              {hours.map(hour => (
                  <button key={`time-gutter-${hour}`} className="relative w-full border-r text-right h-[120px] hover:bg-accent/50" onClick={() => handleOpenPlanner(hour)}>
                      <p className="absolute top-0 right-2 -translate-y-1/2 bg-background px-1 text-xs text-muted-foreground">{format(setHours(new Date(), hour), 'ha')}</p>
                  </button>
              ))}
            </div>
          </div>
          
          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(150px, 1fr))` }}>
            {days.map((day) => {
              const dayEvents = events.filter(event => isSameDay(event.start, day));
              return (
                <TimelineDayColumn
                    key={day.toISOString()}
                    day={day}
                    dayEvents={dayEvents}
                    viewStartHour={viewStartHour}
                    viewEndHour={viewEndHour}
                    onEventDrop={handleEventDrop}
                    onEventClick={handleEventClick}
                    hideHeader={hideDayHeader}
                    today={today}
                />
              )
            })}
          </div>
        </div>
      </ScrollArea>
    );
  }

  const renderViewContent = () => {
    if (!date) return null;

    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
      )
    }

    switch (view) {
      case "day":
        return renderTimelineView([date]);
      case "5days":
        const fiveDayRange = eachDayOfInterval({ start: date, end: addDays(date, 4) });
        return renderTimelineView(fiveDayRange);
      case "week":
        const weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1; // Monday
        const weekRange = eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn }), end: endOfWeek(date, { weekStartsOn }) });
        return renderTimelineView(weekRange);
      case "month":
        return <MonthView date={date} events={events} onEventClick={handleEventClick} today={today} />;
      default:
        return null;
    }
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: format(setHours(new Date(), i), 'h a') }));


  return (
      <div className="p-4 sm:p-6 flex flex-col h-full">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold font-headline text-primary">
            Calendar
          </h1>
          <p className="text-muted-foreground">
            Manage your schedule, events and appointments.
          </p>
        </header>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
            <h2 className="text-xl font-semibold font-headline">
              <span>{viewTitle}</span>
            </h2>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setEventToEdit(null); setIsTaskDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Event</Button>
              <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                  {viewOptions.map((option) => (
                  <Button key={option.id} variant={view === option.id ? "secondary" : "ghost"} size="sm" onClick={() => setView(option.id)} className="h-8 px-3">
                      {option.label}
                  </Button>
                  ))}
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}><span className="sr-only">Previous period</span><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}><span className="sr-only">Next period</span><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          
           <div className="flex items-center gap-4 py-2 text-sm">
                <div className="flex items-center gap-2"><Label>Start Hour</Label><Select value={String(viewStartHour)} onValueChange={(v) => setViewStartHour(Number(v))}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-center gap-2"><Label>End Hour</Label><Select value={String(viewEndHour)} onValueChange={(v) => setViewEndHour(Number(v))}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-center gap-2"><Label>Time Slots</Label><Select value={String(timeSlotIncrement)} onValueChange={(v) => setTimeSlotIncrement(Number(v))}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5 min</SelectItem><SelectItem value="10">10 min</SelectItem><SelectItem value="15">15 min</SelectItem><SelectItem value="30">30 min</SelectItem></SelectContent></Select></div>
           </div>
          
          <div className="flex-1 mt-2 overflow-hidden border-t">
              {renderViewContent()}
          </div>
        </div>

        <NewTaskDialog 
            isOpen={isTaskDialogOpen} 
            onOpenChange={handleDialogClose}
            onTaskCreate={handleTaskCreate}
            onTaskUpdate={handleTaskUpdate}
            eventToEdit={eventToEdit}
            contacts={contacts}
            defaultValues={dialogDefaultValues}
        />

        {isPlannerOpen && date && (
          <HourlyPlannerDialog
            isOpen={isPlannerOpen}
            onOpenChange={setIsPlannerOpen}
            selectedDate={date}
            selectedHour={plannerHour}
            events={events.filter(e => isSameDay(e.start, date) && getHours(e.start) === plannerHour)}
            timeSlotIncrement={timeSlotIncrement}
            onEventUpdate={handleEventDrop}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}
      </div>
  )
}
