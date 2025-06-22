
"use client"

import * as React from "react"
import { format, addDays, setHours, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek, set, addMinutes } from "date-fns"
import { Users, Settings } from "lucide-react"
import { DndProvider, useDrag, useDrop, DragPreviewImage } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
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


type CalendarView = "day" | "5days" | "week";

type Event = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  attendees: string[];
};

type HourTask = {
  id: string;
  title: string;
  start: Date;
  end: Date;
};

const today = new Date();
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Daily Standup',
    description: 'Quick sync with the development team to discuss progress and blockers.',
    start: setHours(today, 9),
    end: setHours(today, 9, 15),
    attendees: ['You', 'John Doe', 'Jane Smith'],
  },
    {
    id: '2',
    title: 'Design Review',
    description: 'Review the new landing page mockups.',
    start: setHours(today, 14),
    end: setHours(today, 15),
    attendees: ['You', 'Jane Smith', 'Design Team'],
  },
  {
    id: '3',
    title: 'Client Call',
    description: 'Discuss Q3 goals with Acme Corp.',
    start: setHours(addDays(today, 1), 11),
    end: setHours(addDays(today, 1), 11, 45),
    attendees: ['You', 'Frank White'],
  },
  {
    id: '4',
    title: 'Frontend Team Sync',
    description: 'Discuss component library progress.',
    start: setHours(addDays(today, 2), 10),
    end: setHours(addDays(today, 2), 11),
    attendees: ['You', 'William Kim', 'Sofia Davis'],
  },
  {
    id: '5',
    title: '1:1 with Manager',
    description: 'Performance review.',
    start: setHours(addDays(today, 3), 16),
    end: setHours(addDays(today, 3), 16, 30),
    attendees: ['You', 'Alice Johnson'],
  },
  {
    id: '6',
    title: 'Finalize Marketing Plan',
    description: 'Finalize the marketing plan for the upcoming launch.',
    start: setHours(addDays(today, 4), 13),
    end: setHours(addDays(today, 4), 15),
    attendees: ['You', 'Charlie Brown'],
  },
];

const mockHourTasksData: Omit<HourTask, 'start' | 'end'> & { startMinutes: number; durationMinutes: number }[] = [
    { id: 'ht1', title: 'Review PR #123', startMinutes: 5, durationMinutes: 15 },
    { id: 'ht2', title: 'Quick stand-up prep', startMinutes: 30, durationMinutes: 10 },
    { id: 'ht3', title: 'Answer urgent email', startMinutes: 50, durationMinutes: 5 },
];


const DraggableTimelineEvent = ({ event, style, className }: { event: Event; style: React.CSSProperties; className: string }) => {
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
  onEventDrop
}: {
  day: Date;
  dayEvents: Event[];
  viewStartHour: number;
  viewEndHour: number;
  onEventDrop: (eventId: string, newStart: Date) => void;
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
      minutesFromStart = Math.max(0, Math.round(minutesFromStart / 15) * 15);

      const newHour = viewStartHour + Math.floor(minutesFromStart / 60);
      const newMinute = minutesFromStart % 60;
      
      const newStartDate = set(day, { hours: newHour, minutes: newMinute, seconds: 0, milliseconds: 0 });
      
      onEventDrop(item.id, newStartDate);
    },
  }));

  drop(dropRef);

  return (
    <div className="border-r last:border-r-0">
      <div className="sticky top-0 z-10 h-16 border-b bg-background text-center">
        <p className="text-sm font-semibold">{format(day, 'EEE')}</p>
        <p className={cn("text-2xl font-bold", isSameDay(day, new Date()) && "text-primary")}>{format(day, 'd')}</p>
      </div>
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
            />
          );
        })}
      </div>
    </div>
  );
};


const DraggableHourTask = ({ task, style }: { task: HourTask; style: React.CSSProperties }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'hourTask',
    item: task,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{ ...style, opacity: isDragging ? 0.5 : 1 }}
      className="absolute left-1 right-1 cursor-move rounded-md bg-accent p-1 border border-accent-foreground/50 overflow-hidden text-accent-foreground"
    >
      <p className="font-semibold text-xs truncate">{task.title}</p>
      <p className="text-xs opacity-80 truncate">{format(task.start, 'p')} - {format(task.end, 'p')}</p>
    </div>
  );
};


function HourDetailView({ 
    isOpen, 
    onOpenChange, 
    hourStart 
}: { 
    isOpen: boolean; 
    onOpenChange: (open: boolean) => void; 
    hourStart: Date; 
}) {
    const [tasks, setTasks] = React.useState<HourTask[]>(() => {
        return mockHourTasksData.map(t => ({
            id: `${hourStart.getTime()}-${t.id}`,
            title: t.title,
            start: addMinutes(hourStart, t.startMinutes),
            end: addMinutes(hourStart, t.startMinutes + t.durationMinutes),
        }));
    });

    const onTaskDrop = React.useCallback((taskId: string, newStart: Date) => {
        setTasks(prevTasks => {
            const taskToUpdate = prevTasks.find(t => t.id === taskId);
            if (!taskToUpdate) return prevTasks;
            
            const duration = taskToUpdate.end.getTime() - taskToUpdate.start.getTime();
            const newEnd = new Date(newStart.getTime() + duration);
            
            return prevTasks.map(t =>
                t.id === taskId ? { ...t, start: newStart, end: newEnd } : t
            );
        });
    }, []);

    const fiveMinuteIntervals = Array.from({ length: 12 }, (_, i) => i * 5);
    const PIXELS_PER_MINUTE_DETAIL = 4;
    const CONTAINER_HEIGHT = 60 * PIXELS_PER_MINUTE_DETAIL;
    const dropRef = React.useRef<HTMLDivElement>(null);

    const [, drop] = useDrop(() => ({
        accept: 'hourTask',
        drop: (item: HourTask, monitor) => {
            if (!dropRef.current) return;
            const dropTargetRect = dropRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();
            const scrollOffset = dropRef.current.scrollTop;

            if (!clientOffset) return;
            
            const dropY = clientOffset.y - dropTargetRect.top + scrollOffset;
            
            let minutesFromStart = Math.round(dropY / PIXELS_PER_MINUTE_DETAIL);
            minutesFromStart = Math.max(0, Math.round(minutesFromStart / 5) * 5);
            
            const newStartDate = set(hourStart, { minutes: minutesFromStart, seconds: 0, milliseconds: 0 });
            
            onTaskDrop(item.id, newStartDate);
        },
    }));

    drop(dropRef);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 pb-2 border-b">
                    <DialogTitle>Timebox for {format(hourStart, 'h a')}</DialogTitle>
                    <DialogDescription>
                        Plan your hour in 5-minute increments. Drag tasks to reschedule.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 flex overflow-hidden">
                    <ScrollArea className="h-full flex-1">
                        <div className="flex">
                            <div className="w-24 shrink-0 border-r bg-muted/50">
                                {fiveMinuteIntervals.map(minute => (
                                    <div key={minute} className="relative text-right" style={{ height: `${5 * PIXELS_PER_MINUTE_DETAIL}px` }}>
                                        {minute > 0 && (
                                            <span className="absolute -top-2.5 right-2 text-xs text-muted-foreground pr-1">
                                                {minute} minutes
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div ref={dropRef} className="relative flex-1" style={{ height: `${CONTAINER_HEIGHT}px` }}>
                                {fiveMinuteIntervals.map(minute => (
                                   <div key={`line-${minute}`} className="border-b" style={{ height: `${5 * PIXELS_PER_MINUTE_DETAIL}px` }}></div>
                                ))}
                                {tasks.map(task => {
                                    const startMinutes = task.start.getMinutes();
                                    const endMinutes = task.end.getMinutes();
                                    const durationMinutes = Math.max(5, (endMinutes === 0 ? 60 : endMinutes) - startMinutes);
                                    
                                    const top = startMinutes * PIXELS_PER_MINUTE_DETAIL;
                                    const height = durationMinutes * PIXELS_PER_MINUTE_DETAIL;

                                    return (
                                        <DraggableHourTask
                                            key={task.id}
                                            task={task}
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CalendarPageContent() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [view, setView] = React.useState<CalendarView>("day");
  const [events, setEvents] = React.useState<Event[]>(mockEvents);
  const [viewStartHour, setViewStartHour] = React.useState(9);
  const [viewEndHour, setViewEndHour] = React.useState(17);
  
  const [isHourDetailOpen, setIsHourDetailOpen] = React.useState(false);
  const [selectedHourForDetail, setSelectedHourForDetail] = React.useState<Date | null>(null);

  const viewOptions: { id: CalendarView; label: string }[] = [
    { id: "day", label: "Day" },
    { id: "5days", label: "5 Days" },
    { id: "week", label: "Week" },
  ];

  const timeOptions = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: format(setHours(new Date(), i), 'ha'),
    }));
  }, []);

  const handleEventDrop = React.useCallback((eventId: string, newStart: Date) => {
    setEvents(prevEvents => {
      const eventToUpdate = prevEvents.find(e => e.id === eventId);
      if (!eventToUpdate) return prevEvents;

      const duration = eventToUpdate.end.getTime() - eventToUpdate.start.getTime();
      const newEnd = new Date(newStart.getTime() + duration);

      return prevEvents.map(e => 
        e.id === eventId ? { ...e, start: newStart, end: newEnd } : e
      );
    });
  }, []);

  const handleHourClick = (hour: number) => {
    if (!date) return;
    const selected = set(date, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0});
    setSelectedHourForDetail(selected);
    setIsHourDetailOpen(true);
  };
  
  const hours = Array.from({ length: viewEndHour - viewStartHour + 1 }, (_, i) => i + viewStartHour);

  const renderTimelineView = (days: Date[]) => {
    if (days.length === 0) return null;

    return (
      <ScrollArea className="h-full w-full">
        <div className="flex" style={{ minWidth: 64 + 150 * days.length }}>
          <div className="sticky left-0 z-20 w-16 shrink-0 bg-background">
            <div className="h-16 border-b border-r">&nbsp;</div>
            {hours.map(hour => (
              <div key={`time-gutter-${hour}`} className="relative h-[120px] border-r text-right">
                <button 
                  onClick={() => handleHourClick(hour)}
                  className="absolute top-0 right-2 -translate-y-1/2 bg-background px-1 text-xs text-muted-foreground transition-colors hover:font-bold hover:text-primary"
                >
                  {format(setHours(new Date(), hour), 'ha')}
                </button>
              </div>
            ))}
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
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
            <ResizablePanel defaultSize={35} minSize={25} maxSize={40}>
              <div className="flex h-full items-center justify-center p-6">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={65}>
              <div className="flex flex-col h-full p-6">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <h2 className="text-xl font-semibold font-headline">
                        Schedule for {date ? format(date, "PPP") : "..."}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDate(new Date())}
                          className="h-8 px-3"
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
                       <Dialog>
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
                                              value={String(viewStartHour)}
                                              onValueChange={(value) => setViewStartHour(Number(value))}
                                          >
                                              <SelectTrigger id="start-time" className="mt-2">
                                                  <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                  {timeOptions.map((option) => (
                                                      <SelectItem
                                                          key={`start-${option.value}`}
                                                          value={String(option.value)}
                                                          disabled={option.value >= viewEndHour}
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
                                              value={String(viewEndHour)}
                                              onValueChange={(value) => setViewEndHour(Number(value))}
                                          >
                                              <SelectTrigger id="end-time" className="mt-2">
                                                  <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                  {timeOptions.map((option) => (
                                                      <SelectItem
                                                          key={`end-${option.value}`}
                                                          value={String(option.value)}
                                                          disabled={option.value <= viewStartHour}
                                                      >
                                                          {option.label}
                                                      </SelectItem>
                                                  ))}
                                              </SelectContent>
                                          </Select>
                                      </div>
                                  </div>
                              </div>
                          </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="flex-1 mt-4 border-t pt-4 overflow-hidden">
                      {renderViewContent()}
                  </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        {selectedHourForDetail && (
            <HourDetailView
                isOpen={isHourDetailOpen}
                onOpenChange={setIsHourDetailOpen}
                hourStart={selectedHourForDetail}
            />
        )}
      </div>
  )
}


export default function CalendarPage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <CalendarPageContent />
    </DndProvider>
  )
}
