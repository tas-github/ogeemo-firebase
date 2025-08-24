
"use client"

import * as React from "react"
import { format, addDays, startOfWeek, isSameDay, set } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarShadCN } from "@/components/ui/calendar"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CalendarSkeleton } from "./calendar-skeleton";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { type Event } from '@/types/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { HourlyPlannerDialog } from "./hourly-planner-dialog";

export function CalendarView() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [numberOfDays, setNumberOfDays] = React.useState<number>(2);
  
  const [viewStartHour, setViewStartHour] = React.useState(8);
  const [viewEndHour, setViewEndHour] = React.useState(18);

  const [isLoading, setIsLoading] = React.useState(false); // Kept for future use
  const [events, setEvents] = React.useState<Event[]>([]); // Placeholder for events

  const [isHourlyPlannerOpen, setIsHourlyPlannerOpen] = React.useState(false);
  const [selectedPlannerDate, setSelectedPlannerDate] = React.useState<Date>(new Date());
  const [selectedPlannerHour, setSelectedPlannerHour] = React.useState(0);

  const { user } = useAuth();
  const { toast } = useToast();

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

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: format(set(new Date(), { hours: i }), 'h a') }));

  const handleOpenHourlyPlanner = (date: Date, hour: number) => {
    setSelectedPlannerDate(date);
    setSelectedPlannerHour(hour);
    setIsHourlyPlannerOpen(true);
  };

  const handleEventUpdate = (eventId: string, newStart: Date) => {
    // Placeholder function for updating events from the dialog
    console.log(`Update event ${eventId} to start at ${newStart}`);
  };

  const handleTimeSlotClick = (time: Date) => {
    // Placeholder function for creating a new event from the dialog
    console.log(`Create new event at ${time}`);
  };


  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col p-4 sm:p-6">
        {/* FRAME 1: STATIC HEADER */}
        <header className="shrink-0 space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Calendar</h1>
            <p className="text-muted-foreground">Manage your schedule, events and appointments.</p>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
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
              <Button variant="outline" className="h-8 py-1" onClick={() => setDate(new Date())}>Today</Button>
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
              <Button className="h-8 py-1"><Plus className="mr-2 h-4 w-4" />New Event</Button>
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
        </header>

        {/* FRAME 2: CALENDAR PANEL */}
        <div className="flex-1 min-h-0 pt-4">
          <div className="h-full border rounded-lg flex flex-col bg-background p-4">
            <div className="flex-1 min-h-0 flex flex-col">
                {/* Day Headers */}
                <div className="flex border-b shrink-0">
                    <div className="w-14 shrink-0 border-r"></div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysInView.length}, 1fr)`}}>
                        {daysInView.map(day => (
                            <div key={day.toISOString()} className="p-1 text-center border-l first:border-l-0">
                                <p className="text-xs font-medium">{format(day, 'E')}</p>
                                <p className={cn("text-lg font-bold", isSameDay(day, new Date()) && "text-primary")}>{format(day, 'd')}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Scrollable Time Grid */}
                <ScrollArea className="flex-1">
                  <div className="flex h-full">
                    {/* Time Gutter */}
                    <div className="w-14 shrink-0">
                      {Array.from({ length: viewEndHour - viewStartHour + 1 }).map((_, i) => (
                        <div key={i} className="relative h-20 text-right border-r pt-2 pr-2">
                          <span className="text-xs text-muted-foreground">
                            {format(set(new Date(), { hours: viewStartHour + i }), 'h a')}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Day Columns */}
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysInView.length}, 1fr)`}}>
                      {daysInView.map(day => (
                        <div key={day.toISOString()} className="relative border-l first:border-l-0">
                          {Array.from({ length: viewEndHour - viewStartHour + 1 }).map((_, i) => (
                            <div key={i} className="h-20 border-b relative group">
                              <Button 
                                variant="ghost" 
                                className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center"
                                onClick={() => handleOpenHourlyPlanner(day, viewStartHour + i)}
                              >
                                <ZoomIn className="h-5 w-5"/>
                              </Button>
                            </div>
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
      
       <HourlyPlannerDialog 
          isOpen={isHourlyPlannerOpen}
          onOpenChange={setIsHourlyPlannerOpen}
          selectedDate={selectedPlannerDate}
          selectedHour={selectedPlannerHour}
          events={events}
          timeSlotIncrement={15}
          onEventUpdate={handleEventUpdate}
          onTimeSlotClick={handleTimeSlotClick}
        />
    </DndProvider>
  );
}
