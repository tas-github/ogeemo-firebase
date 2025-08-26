
"use client"

import * as React from "react"
import { format, addDays, isSameDay, set, getHours, getMinutes, startOfDay, addMinutes, differenceInMinutes, addHours } from "date-fns"
import { useDrop, useDrag } from 'react-dnd';
import { ChevronLeft, ChevronRight, Plus, Settings, Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarShadCN } from "@/components/ui/calendar"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CalendarSkeleton } from "./calendar-skeleton";
import { type Event } from '@/types/calendar';
import { getTasksForUser, updateTask } from "@/services/project-service";
import { ScrollArea } from '../ui/scroll-area';
import { DraggableEvent, ItemTypes } from "./DraggableEvent";
import { NewTaskDialog, type EventFormData } from "../tasks/NewTaskDialog";

const DraggableAddEvent = () => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.ZOOM_IN,
        item: { type: ItemTypes.ZOOM_IN },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <Button ref={drag} className="h-8 py-1 cursor-move bg-slate-700 text-slate-50 hover:bg-slate-700/90" style={{ opacity: isDragging ? 0.5 : 1 }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
        </Button>
    );
};

const TimeSlot = ({ time, height, onDrop }: { time: Date, height: number, onDrop: (item: any) => void }) => {
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.EVENT, ItemTypes.ZOOM_IN],
    drop: (item: any) => onDrop(item),
  }));

  return (
    <div ref={drop} style={{ height: `${height}px` }} className="border-b relative group hover:bg-primary/5">
    </div>
  );
};

const TimeGutterHour = ({ hour, interval, onIntervalChange }: { hour: number, interval: number, onIntervalChange: (newInterval: number) => void }) => {
    const intervalOptions = [5, 10, 15, 20, 30, 60];
    const timeLabel = format(set(new Date(), { hours: hour }), 'h a');

    return (
        <div className="relative text-right pr-2 h-full flex items-center justify-end">
             <Select
                value={String(interval)}
                onValueChange={(value) => onIntervalChange(Number(value))}
            >
                <SelectTrigger className="h-7 text-xs w-20 border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                    <SelectValue>
                         <span className="text-xs text-muted-foreground">{timeLabel}</span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {intervalOptions.map(opt => (
                        <SelectItem key={opt} value={String(opt)}>{opt} min intervals</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};


export function CalendarView() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [numberOfDays, setNumberOfDays] = React.useState<number>(1);
  
  const [viewStartHour] = React.useState(8);
  const [viewEndHour] = React.useState(18);

  const [isLoading, setIsLoading] = React.useState(true);
  const [events, setEvents] = React.useState<Event[]>([]);

  const [isEventManagerOpen, setIsEventManagerOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [dialogInitialData, setDialogInitialData] = React.useState<Partial<EventFormData>>({});
  
  const [hourIntervals, setHourIntervals] = React.useState<Record<number, number>>(
    Object.fromEntries(Array.from({ length: 24 }, (_, i) => [i, 15]))
  );
  
  const handleIntervalChange = (hour: number, newInterval: number) => {
    setHourIntervals(prev => ({ ...prev, [hour]: newInterval }));
  };
  
  const hourBlockHeights = React.useMemo(() => {
    const MIN_SLOT_HEIGHT = 20; // px
    const heights: Record<number, number> = {};
    for (let i = viewStartHour; i <= viewEndHour; i++) {
        const slots = 60 / hourIntervals[i];
        heights[i] = Math.max(slots * MIN_SLOT_HEIGHT, 60); // Min height of 60px per hour
    }
    return heights;
  }, [hourIntervals, viewStartHour, viewEndHour]);

  const { user } = useAuth();
  const { toast } = useToast();
  
  const loadEvents = React.useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const fetchedEvents = await getTasksForUser(user.uid);
        setEvents(fetchedEvents.filter(e => e.isScheduled));
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load events', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const daysInView = React.useMemo(() => {
    if (!date) return [];
    return Array.from({ length: numberOfDays }, (_, i) => addDays(date, i));
  }, [date, numberOfDays]);

  const viewTitle = React.useMemo(() => {
    if (!date) return "Select a date";
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
  }, [date, daysInView]);
  
  const handlePrev = () => {
    if (!date) return;
    const newDate = addDays(date, -numberOfDays);
    setDate(newDate);
  };
  
  const handleNext = () => {
    if (!date) return;
    const newDate = addDays(date, numberOfDays);
    setDate(newDate);
  };
  
  const handleToday = () => {
    setDate(new Date());
    setNumberOfDays(1);
  };

  const handleOpenEventManager = (initialTime: Date) => {
    setSelectedEvent(null);
    setDialogInitialData({
      isScheduled: true,
      startDate: initialTime,
      endDate: addHours(initialTime, 1),
      startHour: String(initialTime.getHours()),
      startMinute: String(initialTime.getMinutes()),
      endHour: String(addHours(initialTime, 1).getHours()),
      endMinute: String(initialTime.getMinutes()),
    });
    setIsEventManagerOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setDialogInitialData({}); // Clear initial data to let the dialog handle it
    setIsEventManagerOpen(true);
  };
  
  const handleDrop = async (item: any, newStartTime: Date) => {
    if (item.type === ItemTypes.ZOOM_IN) {
        handleOpenEventManager(newStartTime);
    } else {
        const event = item as Event;
        const durationMinutes = differenceInMinutes(event.end, event.start);
        const newEndTime = addMinutes(newStartTime, durationMinutes);

        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, start: newStartTime, end: newEndTime } : e));
        
        try {
            await updateTask(event.id, { start: newStartTime, end: newEndTime });
            toast({ title: "Event Rescheduled", description: `"${event.title}" has been moved.`});
        } catch (error) {
            toast({ variant: 'destructive', title: "Update failed", description: "Could not save the new time. Reverting." });
            loadEvents();
        }
    }
  };
  
  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <>
      <div className="h-full flex flex-col p-4 sm:p-6">
        <header className="shrink-0 space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Calendar</h1>
            <p className="text-muted-foreground">Manage your schedule, events and appointments.</p>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
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
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}><span className="sr-only">Previous period</span><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}><span className="sr-only">Next period</span><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" className="h-8 py-1" onClick={handleToday}>Today</Button>
              <DraggableAddEvent />
              <div className="flex items-center gap-2">
                <Label htmlFor="days-select" className="text-sm">Show:</Label>
                <Select
                  value={String(numberOfDays)}
                  onValueChange={(value) => setNumberOfDays(Number(value))}
                >
                  <SelectTrigger id="days-select" className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(dayCount => (
                      <SelectItem key={dayCount} value={String(dayCount)}>
                        {dayCount} day{dayCount > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
            <div className="flex">
                <div className="w-24 shrink-0 border-r"></div>
                <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysInView.length}, 1fr)`}}>
                    {daysInView.map(day => (
                        <div key={day.toISOString()} className="py-1 text-center border-l first:border-l-0">
                            <p className="text-xs font-medium">{format(day, 'E')}</p>
                            <p className={cn("text-sm font-bold", isSameDay(day, new Date()) && "text-primary")}>{format(day, 'd')}</p>
                        </div>
                    ))}
                </div>
            </div>
        </header>

        <div className="flex-1 min-h-0">
          <div className="h-full border rounded-lg flex flex-col bg-white">
            <div className="flex-1 min-h-0 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="flex h-full">
                    <div className="w-24 shrink-0">
                      {Array.from({ length: viewEndHour - viewStartHour + 1 }).map((_, i) => {
                          const hour = viewStartHour + i;
                          return (
                            <div key={hour} className="relative border-r" style={{ height: `${hourBlockHeights[hour]}px` }}>
                                <TimeGutterHour hour={hour} interval={hourIntervals[hour]} onIntervalChange={(newInterval) => handleIntervalChange(hour, newInterval)} />
                            </div>
                          );
                      })}
                    </div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysInView.length}, 1fr)`}}>
                      {daysInView.map(day => (
                        <div key={day.toISOString()} className="relative border-l first:border-l-0">
                            {Array.from({ length: viewEndHour - viewStartHour + 1 }).map((_, hourIndex) => {
                                const currentHour = viewStartHour + hourIndex;
                                const interval = hourIntervals[currentHour];
                                const slotsInHour = 60 / interval;
                                const slotHeight = hourBlockHeights[currentHour] / slotsInHour;
                                return Array.from({ length: slotsInHour }).map((_, slotIndex) => {
                                    const time = addMinutes(startOfDay(day), (currentHour * 60) + (slotIndex * interval));
                                    return (
                                        <TimeSlot
                                            key={`${hourIndex}-${slotIndex}`}
                                            time={time}
                                            height={slotHeight}
                                            onDrop={(item: any) => handleDrop(item, time)}
                                        />
                                    );
                                });
                            })}
                          {events.filter(e => isSameDay(e.start, day)).map(event => (
                              <DraggableEvent
                                  key={event.id}
                                  event={event}
                                  onEdit={handleEditEvent}
                                  viewStartHour={viewStartHour}
                                  hourBlockHeights={hourBlockHeights}
                              />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
          </div>
        </div>
      </div>
      
       <NewTaskDialog 
          isOpen={isEventManagerOpen}
          onOpenChange={(open) => {
            setIsEventManagerOpen(open);
            if (!open) loadEvents();
          }}
          eventToEdit={selectedEvent}
          defaultValues={dialogInitialData}
          onTaskUpdate={loadEvents}
          onTaskCreate={loadEvents}
        />
    </>
  );
}
