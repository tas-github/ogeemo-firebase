
"use client"

import * as React from "react"
import { format, addDays, setHours, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns"
import { Users, Settings } from "lucide-react"

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


type CalendarView = "hour" | "day" | "5days" | "week";

type Event = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  attendees: string[];
};

const today = new Date();
const mockEvents: Event[] = [
    {
    id: '1',
    title: 'Daily Standup',
    description: 'Quick sync with the team on daily progress.',
    start: setHours(today, 9),
    end: setHours(today, 9, 15),
    attendees: ['You', 'Alice', 'Bob'],
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


export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [view, setView] = React.useState<CalendarView>("day");
  const [events] = React.useState<Event[]>(mockEvents);
  const [viewStartHour, setViewStartHour] = React.useState(8);
  const [viewEndHour, setViewEndHour] = React.useState(17);

  const viewOptions: { id: CalendarView; label: string }[] = [
    { id: "hour", label: "Hour" },
    { id: "day", label: "Day" },
    { id: "5days", label: "5 Days" },
    { id: "week", label: "Week" },
  ];

  const dailyEvents = React.useMemo(() => {
    if (!date) return [];
    return events
      .filter((event) => isSameDay(event.start, date))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, date]);

  const timeOptions = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: format(setHours(new Date(), i), 'ha'), // e.g., "12AM", "1AM", "1PM"
    }));
  }, []);

  const PIXELS_PER_MINUTE = 2;
  const hours = Array.from({ length: viewEndHour - viewStartHour + 1 }, (_, i) => i + viewStartHour);
  const CONTAINER_HEIGHT = hours.length * 60 * PIXELS_PER_MINUTE;

  const renderMultiDayView = (numDays: 5 | 7) => {
    if (!date) return null;

    const weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1; // Monday
    const startDate = numDays === 7 ? startOfWeek(date, { weekStartsOn }) : date;
    const dayRange = eachDayOfInterval({ start: startDate, end: addDays(startDate, numDays - 1) });

    const eventsInRange = events.filter(event => {
      const eventDate = event.start;
      return eventDate >= dayRange[0] && eventDate < addDays(dayRange[dayRange.length - 1], 1);
    });

    return (
      <ScrollArea className="h-full w-full">
        <div className="flex" style={{ minWidth: 64 + 150 * numDays }}>
          <div className="sticky left-0 z-20 w-16 shrink-0 bg-background">
            <div className="h-16 border-b border-r">&nbsp;</div>
            {hours.map(hour => (
              <div key={`time-gutter-${hour}`} className="relative h-[120px] border-r text-right">
                <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
                  {format(setHours(new Date(), hour), 'ha')}
                </span>
              </div>
            ))}
          </div>

          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${numDays}, minmax(150px, 1fr))` }}>
            {dayRange.map((day, dayIndex) => (
              <div key={day.toISOString()} className={cn("border-r", dayIndex === dayRange.length - 1 && "border-r-0")}>
                <div className="sticky top-0 z-10 h-16 border-b bg-background text-center">
                  <p className="text-sm font-semibold">{format(day, 'EEE')}</p>
                  <p className={cn("text-2xl font-bold", isSameDay(day, new Date()) && "text-primary")}>{format(day, 'd')}</p>
                </div>
                <div className="relative" style={{ height: `${CONTAINER_HEIGHT}px` }}>
                  {hours.map(hour => (
                    <div key={`line-${hour}-${day.toISOString()}`} className="h-[120px] border-b"></div>
                  ))}
                  {eventsInRange
                    .filter(event => isSameDay(event.start, day))
                    .map(event => {
                      const startMinutes = (event.start.getHours() - viewStartHour) * 60 + event.start.getMinutes();
                      const endMinutes = (event.end.getHours() - viewStartHour) * 60 + event.end.getMinutes();
                      const durationMinutes = Math.max(15, endMinutes - startMinutes);
                      const top = startMinutes * PIXELS_PER_MINUTE;
                      const height = durationMinutes * PIXELS_PER_MINUTE;
                      
                      if (endMinutes < 0 || startMinutes > (hours.length * 60)) return null;

                      return (
                          <div
                              key={event.id}
                              className="absolute left-1 right-1 rounded-lg bg-primary/20 p-2 border border-primary/50 overflow-hidden text-primary"
                              style={{ top: `${top}px`, height: `${height}px` }}
                          >
                              <p className="font-bold text-xs truncate">{event.title}</p>
                              <p className="text-xs opacity-80 truncate">{format(event.start, 'p')} - {format(event.end, 'p')}</p>
                          </div>
                      );
                    })
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  };


  const renderViewContent = () => {
    switch (view) {
      case "day":
        if (dailyEvents.length === 0) {
            return <div className="flex justify-center items-start pt-10"><p className="text-muted-foreground">No events for this day.</p></div>;
        }
        return (
            <ScrollArea className="h-full w-full">
                <div className="space-y-6 pr-4">
                    {dailyEvents.map(event => (
                        <div key={event.id} className="flex items-start gap-4">
                           <div className="w-20 text-right text-sm font-medium text-muted-foreground shrink-0 pt-1">
                                {format(event.start, 'p')}
                           </div>
                           <div className="flex-1">
                                <Card>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base font-semibold">{event.title}</CardTitle>
                                        <CardDescription className="text-xs">{event.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Users className="h-3 w-3" />
                                            <span>{event.attendees.join(', ')}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between">
                                      <span>Ends at {format(event.end, 'p')}</span>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        );
      case "hour":
        const visibleEvents = dailyEvents.filter(event => {
          const startHour = event.start.getHours();
          const endHour = event.end.getHours();
          return endHour >= viewStartHour && startHour <= viewEndHour;
        });

        return (
            <ScrollArea className="h-full w-full">
                <div className="relative" style={{ height: `${CONTAINER_HEIGHT}px` }}>
                    {/* Render hour lines */}
                    {hours.map(hour => (
                        <div key={hour} className="absolute w-full" style={{ top: `${(hour - viewStartHour) * 60 * PIXELS_PER_MINUTE}px`}}>
                            <div className="flex items-center">
                                <div className="text-xs text-muted-foreground pr-2 w-16 text-right">
                                    {format(setHours(new Date(), hour), 'ha')}
                                </div>
                                <div className="flex-1 border-t"></div>
                            </div>
                        </div>
                    ))}
                    {/* Render half-hour lines */}
                    {hours.slice(0, -1).map(hour => (
                         <div key={`half-${hour}`} className="absolute w-full" style={{ top: `${((hour - viewStartHour) * 60 + 30) * PIXELS_PER_MINUTE}px`}}>
                            <div className="flex items-center">
                                <div className="w-16"></div>
                                <div className="flex-1 border-t border-dashed"></div>
                            </div>
                        </div>
                    ))}

                    {/* Render events */}
                    {visibleEvents.map(event => {
                        const startMinutes = (event.start.getHours() - viewStartHour) * 60 + event.start.getMinutes();
                        const endMinutes = (event.end.getHours() - viewStartHour) * 60 + event.end.getMinutes();
                        
                        const clampedStartMinutes = Math.max(0, startMinutes);
                        const clampedEndMinutes = Math.min((viewEndHour - viewStartHour + 1) * 60, endMinutes);

                        const durationMinutes = Math.max(15, clampedEndMinutes - clampedStartMinutes);
                        const top = clampedStartMinutes * PIXELS_PER_MINUTE;
                        const height = durationMinutes * PIXELS_PER_MINUTE;
                        
                        if (endMinutes < 0 || startMinutes > (hours.length * 60)) return null;

                        return (
                            <div
                                key={event.id}
                                className="absolute left-16 right-2 rounded-lg bg-primary/20 p-2 border border-primary/50 overflow-hidden text-primary"
                                style={{ top: `${top}px`, height: `${height}px` }}
                            >
                                <p className="font-bold text-xs truncate">{event.title}</p>
                                <p className="text-xs opacity-80 truncate">{format(event.start, 'p')} - {format(event.end, 'p')}</p>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        );
      case "5days":
        return renderMultiDayView(5);
      case "week":
        return renderMultiDayView(7);
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
    </div>
  )
}
