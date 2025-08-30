
"use client"

import * as React from "react"
import { useDrop } from 'react-dnd';
import { format, addDays, startOfDay, set, getMinutes, getHours, differenceInMinutes, addMinutes } from "date-fns"
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarShadCN } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getTasksForUser } from "@/services/project-service"
import { type Event } from "@/types/calendar-types"
import { Label } from "../ui/label"
import { DraggableEvent, ItemTypes } from "./DraggableEvent";

const SLOT_HEIGHT = 24; // Height in pixels for one time slot

export function CalendarView() {
    const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
    const [dayCount, setDayCount] = React.useState<number>(1);
    const [events, setEvents] = React.useState<Event[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [startHour, setStartHour] = React.useState(8);
    const [endHour, setEndHour] = React.useState(17);

    const { user } = useAuth();
    const { toast } = useToast();
    const dropRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const loadEvents = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const fetchedTasks = await getTasksForUser(user.uid);
                setEvents(fetchedTasks);
            } catch (error: any)
{
                toast({ variant: 'destructive', title: 'Failed to load events', description: error.message });
            } finally {
                setIsLoading(false);
            }
        };
        loadEvents();
    }, [user, toast]);

    const visibleDates = React.useMemo(() => {
        const start = startOfDay(currentDate);
        return Array.from({ length: dayCount }, (_, i) => addDays(start, i));
    }, [currentDate, dayCount]);
    
    const handlePrev = () => setCurrentDate(prev => addDays(prev, -dayCount));
    const handleNext = () => setCurrentDate(prev => addDays(prev, dayCount));
    const handleToday = () => setCurrentDate(new Date());

    const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: format(set(new Date(), { hours: i }), 'h a') }));

    const totalHours = endHour - startHour;
    const totalHeight = totalHours * 120; // 120px per hour
    
    const visibleHours = React.useMemo(() => {
        return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    }, [startHour, endHour]);
    
    const handleEventDrop = (item: Event, dropDate: Date, dropTimeInMinutes: number) => {
        const duration = differenceInMinutes(item.end, item.start);
        const newStart = addMinutes(startOfDay(dropDate), dropTimeInMinutes);
        const newEnd = addMinutes(newStart, duration);

        setEvents(prev =>
            prev.map(e =>
                e.id === item.id ? { ...e, start: newStart, end: newEnd } : e
            )
        );
        toast({
            title: "Event Updated",
            description: `"${item.title}" moved to ${format(newStart, 'PPp')}.`
        })
    };
    
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.EVENT,
        drop: (item: Event, monitor) => {
            const dropTarget = dropRef.current;
            if (!dropTarget) return;

            const dropTargetRect = dropTarget.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;

            const x = clientOffset.x - dropTargetRect.left;
            const y = clientOffset.y - dropTargetRect.top;
            
            const dayIndex = Math.floor(x / (dropTargetRect.width / dayCount));
            const dropDate = visibleDates[dayIndex];
            
            const minutesFromDayStart = (y / totalHeight) * (totalHours * 60);
            
            handleEventDrop(item, dropDate, minutesFromDayStart);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    drop(dropRef);
    
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
                <div className="flex items-center justify-between flex-wrap gap-4 pb-4">
                    <h2 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
                    <div className="flex items-center gap-2">
                        <Popover><PopoverTrigger asChild><Button variant="outline" className={cn(!currentDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" /><span>{format(currentDate, "PPP")}</span></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarShadCN mode="single" selected={currentDate} onSelect={(date) => date && setCurrentDate(date)} initialFocus /></PopoverContent></Popover>
                        <Button variant="outline" size="icon" aria-label="Previous period" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" onClick={handleToday}>Today</Button>
                        <Button variant="outline" size="icon" aria-label="Next period" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
                        <Select value={String(dayCount)} onValueChange={(value) => setDayCount(Number(value))}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{[1, 3, 5, 7].map(day => (<SelectItem key={day} value={String(day)}>{day}-Day</SelectItem>))}</SelectContent></Select>
                        <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Settings"><Settings className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="w-80"><div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">Display Settings</h4><p className="text-sm text-muted-foreground">Set the visible hours for your calendar day.</p></div><div className="grid gap-2"><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="start-time">Start Time</Label><Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}><SelectTrigger id="start-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="end-time">End Time</Label><Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}><SelectTrigger id="end-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div></div></PopoverContent></Popover>
                    </div>
                </div>
                
                <div className="flex-1 min-h-0 flex flex-col border border-black rounded-lg overflow-hidden">
                    <div className="flex items-center">
                        <div className="w-16 shrink-0 text-center py-2"></div>
                        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))`}}>
                            {visibleDates.map((date, index) => (
                                <div key={date.toISOString()} className={cn("text-center py-2 border-l border-black")}>
                                    <p className="text-sm font-semibold">{format(date, 'EEE')}</p>
                                    <p className="text-2xl font-bold">{format(date, 'd')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="relative flex border-t border-black" style={{ height: `${totalHeight}px` }}>
                            <div className="w-16 shrink-0 pr-2">
                                {visibleHours.map((hour) => (
                                    <div key={hour} className="relative text-right h-[120px]">
                                        <span className="text-xs text-muted-foreground absolute -top-2 right-2">{format(new Date(0,0,0,hour), 'h a')}</span>
                                    </div>
                                ))}
                            </div>
                            <div ref={dropRef} className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                                {visibleDates.map((date, index) => (
                                    <div key={date.toISOString()} className={cn("relative h-full border-l border-black")}>
                                        {visibleHours.map((hour) => (
                                            <div key={hour} className="h-[120px] border-b border-black/20 bg-tan"></div>
                                        ))}
                                        {events.filter(event => format(event.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')).map(event => {
                                            const eventStartHour = getHours(event.start);
                                            const eventStartMinutes = getMinutes(event.start);
                                            
                                            const minutesFromDayStart = (eventStartHour - startHour) * 60 + eventStartMinutes;
                                            const top = (minutesFromDayStart / (totalHours * 60)) * totalHeight;
                                            
                                            const durationMinutes = differenceInMinutes(event.end, event.start);
                                            const height = (durationMinutes / (totalHours * 60)) * totalHeight;

                                            if (top < 0 || top > totalHeight) return null;

                                            return (
                                               <DraggableEvent
                                                    key={event.id}
                                                    event={event}
                                                    style={{
                                                        top: `${top}px`,
                                                        height: `${height}px`,
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
