
"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { format, addDays, setHours, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek, set, addMinutes, startOfMinute, startOfMonth, endOfMonth, isToday, isSameMonth, addMonths, addWeeks } from "date-fns"
import { Users, Settings, Plus, Calendar as CalendarIcon, Edit, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react"
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Event } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import * as ProjectService from "@/services/project-service";

const NewTaskDialog = dynamic(() => import('@/components/tasks/NewTaskDialog').then((mod) => mod.NewTaskDialog), {
  loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});


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
  const hours = Array.from({ length: viewEndHour - viewStartHour + 1 }, (_, i) => i + viewStartHour);
  const CONTAINER_HEIGHT = hours.length * 60 * PIXELS_PER_MINUTE;
  const dropRef = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop(() => ({
    accept: 'event',
    drop: (item: Event, monitor) => {
      if (!dropRef.current) return;
      const dropTargetRect = dropRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      const dropY = clientOffset.y - dropTargetRect.top;
      
      let minutesFromStart = Math.round(dropY / PIXELS_PER_MINUTE);
      minutesFromStart = Math.max(0, Math.round(minutesFromStart / 5) * 5);

      const newHour = viewStartHour + Math.floor(minutesFromStart / 60);
      const newMinute = minutesFromStart % 60;
      
      const newStartDate = set(day, { hours: newHour, minutes: newMinute, seconds: 0, milliseconds: 0 });
      
      onEventDrop(item.id, newStartDate);
    },
  }));

  drop(dropRef);

  return (
    <div className={cn("border-r last:border-r-0", hideHeader && "border-t")}>
      {!hideHeader && (
        <div className="sticky top-0 z-10 h-16 border-b bg-background text-center">
          <p className="text-sm font-semibold">{format(day, 'EEE')}</p>
          <p className={cn("text-2xl font-bold", today && isSameDay(day, today) && "text-primary")}>{format(day, 'd')}</p>
        </div>
      )}
      <div ref={dropRef} className="relative" style={{ height: `${CONTAINER_HEIGHT}px` }}>
        {hours.map(hour => (
          <div key={`line-${hour}-${day.toISOString()}`} className="h-[120px] border-b"></div>
        ))}
        {dayEvents.map(event => {
          const startMinutes = (event.start.getHours() - viewStartHour) * 60 + event.start.getMinutes();
          const endMinutes = (event.end.getHours() - viewStartHour) * 60 + event.end.getMinutes();
          const durationMinutes = Math.max(15, endMinutes - startMinutes);
          const top = startMinutes * PIXELS_PER_MINUTE;
          const height = durationMinutes * PIXELS_PER_MINUTE;
          
          const totalMinutesInView = (viewEndHour - viewStartHour + 1) * 60;
          if (endMinutes < 0 || startMinutes > totalMinutesInView) return null;

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

function CalendarPageContent() {
  const [date, setDate] = React.useState<Date | undefined>();
  const [today, setToday] = React.useState<Date | null>(null);
  const [view, setView] = React.useState<CalendarView>("day");
  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const [viewStartHour, setViewStartHour] = React.useState(9);
  const [viewEndHour, setViewEndHour] = React.useState(17);
  
  const [newTaskDefaultDate, setNewTaskDefaultDate] = React.useState<Date | undefined>();
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = React.useState(false);
  const [isMonthViewOpen, setIsMonthViewOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [tempViewHours, setTempViewHours] = React.useState({ start: viewStartHour, end: viewEndHour });
  
  const [eventToEdit, setEventToEdit] = React.useState<Event | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    const now = new Date();
    setDate(now);
    setToday(now);
  }, []);

  React.useEffect(() => {
    async function loadEvents(userId: string) {
        setIsLoading(true);
        try {
            const fetchedEvents = await ProjectService.getTasks(userId);
            setEvents(fetchedEvents);
        } catch (error: any) {
            console.error("Failed to load events:", error);
            toast({
                variant: "destructive",
                title: "Failed to load events",
                description: error.message || "Could not retrieve calendar events from the database.",
            });
        } finally {
            setIsLoading(false);
        }
    }
    if (user) {
        loadEvents(user.uid);
    } else {
        setIsLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    try {
      const savedStartHour = localStorage.getItem('calendarViewStartHour');
      const savedEndHour = localStorage.getItem('calendarViewEndHour');
      if (savedStartHour) {
        setViewStartHour(Number(savedStartHour));
        setTempViewHours(prev => ({ ...prev, start: Number(savedStartHour) }));
      }
      if (savedEndHour) {
        setViewEndHour(Number(savedEndHour));
        setTempViewHours(prev => ({ ...prev, end: Number(savedEndHour) }));
      }
    } catch (error) {
      console.error("Could not read calendar settings from localStorage", error);
    }
  }, []);

  const handleTaskCreate = async (taskData: Omit<Event, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      const newEvent = await ProjectService.addTask({ ...taskData, userId: user.uid });
      setEvents(prev => [...prev, newEvent]);
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast({ variant: "destructive", title: "Create Failed", description: error.message });
    }
  };

  const handleTaskUpdate = async (updatedEventData: Omit<Event, 'userId'>) => {
    try {
      const { id, ...dataToUpdate } = updatedEventData;
      await ProjectService.updateTask(id, dataToUpdate);
      setEvents(prev => prev.map(e => e.id === id ? { ...e, ...dataToUpdate } : e));
    } catch (error: any) {
      console.error("Failed to update task:", error);
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const handleEventClick = (event: Event) => {
    setEventToEdit(event);
    setIsNewTaskDialogOpen(true);
  };

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

  const timeOptions = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: format(setHours(new Date(), i), 'ha'),
    }));
  }, []);

  const handleEventDrop = React.useCallback(async (eventId: string, newStart: Date) => {
    const eventToUpdate = events.find(e => e.id === eventId);
    if (!eventToUpdate) return;

    const duration = eventToUpdate.end.getTime() - eventToUpdate.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);
    
    try {
        await ProjectService.updateTask(eventId, { start: newStart, end: newEnd });
        setEvents(prevEvents => prevEvents.map(e => 
          e.id === eventId ? { ...e, start: newStart, end: newEnd } : e
        ));
    } catch(error: any) {
        console.error("Failed to update task time:", error);
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  }, [events, toast]);

  const handleHourClick = (hour: number) => {
    if (!date) return;
    const selectedDateTime = set(date, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 });
    setNewTaskDefaultDate(selectedDateTime);
    setEventToEdit(null);
    setIsNewTaskDialogOpen(true);
  };
  
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
    return Array.from({ length: viewEndHour - viewStartHour + 1 }, (_, i) => i + viewStartHour);
  }, [viewStartHour, viewEndHour]);

  const renderTimelineView = (days: Date[]) => {
    if (days.length === 0) return null;
    
    const hideDayHeader = days.length === 1;

    return (
      <ScrollArea className="h-full w-full">
        <div className="flex" style={{ minWidth: 80 + 150 * days.length }}>
          <div className="sticky left-0 z-20 w-24 shrink-0 bg-background">
            {!hideDayHeader && <div className="h-16 border-b border-r">&nbsp;</div>}
            <div className="pt-4">
              {hours.map(hour => (
                <div key={`time-gutter-${hour}`} className="relative h-[120px] border-r text-right">
                  <button 
                    onClick={() => handleHourClick(hour)}
                    className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-background px-1 text-xs text-muted-foreground transition-colors hover:font-bold hover:text-primary"
                  >
                    <span>{format(setHours(new Date(), hour), 'ha')}</span>
                    <Edit className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(150px, 1fr))` }}>
            {days.map((day, index) => {
              const dayEvents = events.filter(event => isSameDay(event.start, day));
              return (
                <div key={day.toISOString()} className={cn(index === 0 && 'col-start-1 -ml-24 pl-24' )}>
                  <div className="pt-4">
                    <TimelineDayColumn
                      day={day}
                      dayEvents={dayEvents}
                      viewStartHour={viewStartHour}
                      viewEndHour={viewEndHour}
                      onEventDrop={handleEventDrop}
                      onEventClick={handleEventClick}
                      hideHeader={hideDayHeader}
                      today={today}
                    />
                  </div>
                </div>
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
            
            <Dialog open={isMonthViewOpen} onOpenChange={setIsMonthViewOpen}>
                <DialogTrigger asChild>
                    <h2 className="text-xl font-semibold font-headline cursor-pointer hover:underline">
                        <span>{viewTitle}</span>
                    </h2>
                </DialogTrigger>
                <DialogContent className="sm:max-w-auto w-auto p-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Select a date</DialogTitle>
                    </DialogHeader>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                            if (newDate) setDate(newDate);
                            setIsMonthViewOpen(false);
                        }}
                        initialFocus
                    />
                </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2">
              <Button onClick={() => {
                  setNewTaskDefaultDate(new Date());
                  setEventToEdit(null);
                  setIsNewTaskDialogOpen(true);
              }}>+New Event</Button>
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => date && setDate(new Date())}
                  className="h-8 px-3"
                  disabled={!today || (date ? isSameDay(date, today) : false)}
              >
                  Today
              </Button>
              <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                  {viewOptions.map((option) => (
                  <Button
                      key={option.id}
                      variant={view === option.id ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setView(option.id)}
                      className="h-8 px-3"
                  >
                      {option.label}
                  </Button>
                  ))}
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
                <span className="sr-only">Previous period</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
                <span className="sr-only">Next period</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
                <Dialog open={isSettingsOpen} onOpenChange={(open) => {
                    if (open) {
                      setTempViewHours({ start: viewStartHour, end: viewEndHour });
                    }
                    setIsSettingsOpen(open);
                  }}
                >
                  <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Calendar Settings">
                          <Settings className="h-4 w-4" />
                          <span className="sr-only">Settings</span>
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                          <DialogTitle>Calendar Settings</DialogTitle>
                          <DialogDescription>
                              Customize your calendar hourly view.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 items-end gap-4">
                              <div>
                                  <Label htmlFor="start-time">Day Start Time</Label>
                                  <Select
                                      value={String(tempViewHours.start)}
                                      onValueChange={(value) => setTempViewHours(prev => ({ ...prev, start: Number(value) }))}
                                  >
                                      <SelectTrigger id="start-time" className="mt-2">
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {timeOptions.map((option) => (
                                              <SelectItem
                                                  key={`start-${option.value}`}
                                                  value={String(option.value)}
                                                  disabled={option.value >= tempViewHours.end}
                                              >
                                                  {option.label}
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div>
                                  <Label htmlFor="end-time">Day End Time</Label>
                                  <Select
                                      value={String(tempViewHours.end)}
                                      onValueChange={(value) => setTempViewHours(prev => ({ ...prev, end: Number(value) }))}
                                  >
                                      <SelectTrigger id="end-time" className="mt-2">
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {timeOptions.map((option) => (
                                              <SelectItem
                                                  key={`end-${option.value}`}
                                                  value={String(option.value)}
                                                  disabled={option.value <= tempViewHours.start}
                                              >
                                                  {option.label}
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                      </div>
                      <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                          <Button onClick={() => {
                              setViewStartHour(tempViewHours.start);
                              setViewEndHour(tempViewHours.end);
                              try {
                                localStorage.setItem('calendarViewStartHour', String(tempViewHours.start));
                                localStorage.setItem('calendarViewEndHour', String(tempViewHours.end));
                              } catch (error) {
                                console.error("Could not write calendar settings to localStorage", error);
                              }
                              setIsSettingsOpen(false);
                          }}>
                              Save Changes
                          </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="flex-1 mt-4 overflow-hidden">
              {renderViewContent()}
          </div>
        </div>

        {isNewTaskDialogOpen && (
            <NewTaskDialog 
                isOpen={isNewTaskDialogOpen} 
                onOpenChange={(open) => {
                    setIsNewTaskDialogOpen(open);
                    if (!open) {
                        setEventToEdit(null);
                    }
                }}
                defaultStartDate={newTaskDefaultDate}
                eventToEdit={eventToEdit}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                projectId={eventToEdit?.projectId || null}
            />
        )}
      </div>
  )
}


export function CalendarView() {
  return (
    <DndProvider backend={HTML5Backend}>
      <CalendarPageContent />
    </DndProvider>
  )
}
