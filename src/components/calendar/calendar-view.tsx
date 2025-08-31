
"use client"

import * as React from "react"
import { useDrop } from 'react-dnd';
import { format, addDays, startOfDay, set, getMinutes, getHours, differenceInMinutes, addMinutes } from "date-fns"
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, ChevronDown } from "lucide-react"

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

const HOUR_HEIGHT = 120; // The total height for one hour block in pixels

export function CalendarView() {
    const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
    const [dayCount, setDayCount] = React.useState<number>(1);
    const [events, setEvents] = React.useState<Event[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [startHour, setStartHour] = React.useState(8);
    const [endHour, setEndHour] = React.useState(17);
    const [slotIncrements, setSlotIncrements] = React.useState<Record<number, number>>({});
    
    const { user } = useAuth();
    const { toast } = useToast();
    const dropRef = React.useRef<HTMLDivElement>(null);

    const slotOptions = Array.from({ length: 12 }, (_, i) => i + 1);

    const handleSlotIncrementChange = (hour: number, numberOfSlots: number) => {
        setSlotIncrements(prev => ({ ...prev, [hour]: numberOfSlots }));
    };
    
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
    
    const visibleHours = React.useMemo(() => {
        return Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    }, [startHour, endHour]);

    const totalHeight = React.useMemo(() => visibleHours.length * HOUR_HEIGHT, [visibleHours]);
    
    const getEventPosition = (event: Event) => {
        const eventStartHour = getHours(event.start);
        const slotsInHour = slotIncrements[eventStartHour] || 1;
        const slotHeight = HOUR_HEIGHT / slotsInHour;
        const eventStartMinutesInHour = getMinutes(event.start);
        const slotIndex = Math.floor(eventStartMinutesInHour / (60 / slotsInHour));

        const topOffsetFromHour = slotIndex * slotHeight;

        const eventStartMinutesTotal = getHours(event.start) * 60 + getMinutes(event.start);
        const calendarStartMinutesTotal = startHour * 60;
        
        const top = ((eventStartMinutesTotal - calendarStartMinutesTotal) / 60) * HOUR_HEIGHT;

        const durationMinutes = differenceInMinutes(event.end, event.start);
        const height = (durationMinutes / 60) * HOUR_HEIGHT;

        return { top, height };
    };


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
            
            const minutesFromDayStart = startHour * 60 + (y / HOUR_HEIGHT) * 60;

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
                <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" aria-label="Previous period" onClick={handlePrev} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                         <h2 className="text-base font-semibold text-center w-32 truncate">{format(currentDate, 'MMMM yyyy')}</h2>
                        <Button variant="outline" size="icon" aria-label="Next period" onClick={handleNext} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Popover><PopoverTrigger asChild><Button variant="outline" className={cn(!currentDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" /><span>{format(currentDate, "PPP")}</span></Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarShadCN mode="single" selected={currentDate} onSelect={(date) => date && setCurrentDate(date)} initialFocus /></PopoverContent></Popover>
                        <Button variant="outline" onClick={handleToday}>Today</Button>
                        <Select value={String(dayCount)} onValueChange={(value) => setDayCount(Number(value))}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{[1, 3, 5, 7].map(day => (<SelectItem key={day} value={String(day)}>{day}-Day</SelectItem>))}</SelectContent></Select>
                        <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Settings"><Settings className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="w-80"><div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">Display Settings</h4><p className="text-sm text-muted-foreground">Set the visible hours for your calendar day.</p></div><div className="grid gap-2"><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="start-time">Start Time</Label><Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}><SelectTrigger id="start-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="end-time">End Time</Label><Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}><SelectTrigger id="end-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div></div></PopoverContent></Popover>
                    </div>
                </div>
                
                <div className="flex-1 min-h-0 grid grid-cols-[6rem,1fr] rounded-lg">
                    {/* Headers */}
                    <div className="border-r border-b" />
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                        {visibleDates.map((date) => (
                            <div key={date.toISOString()} className="text-center py-2 border-r border-b">
                                <p className="text-sm font-semibold">{format(date, 'EEE')}</p>
                                <p className="text-2xl font-bold">{format(date, 'd')}</p>
                            </div>
                        ))}
                    </div>
                    
                    {/* Calendar Body */}
                    <ScrollArea className="flex-1 min-h-0 border-r">
                        <div className="relative">
                            {visibleHours.map(hour => (
                                <div key={hour} className="flex flex-col items-center justify-start p-1 text-center border-black" style={{ height: '120px' }}>
                                    <span className="text-xs text-muted-foreground">{format(new Date(0, 0, 0, hour), 'h a')}</span>
                                    <Select onValueChange={(value) => handleSlotIncrementChange(hour, Number(value))}>
                                        <SelectTrigger className="h-auto w-auto p-1 flex items-center gap-1 focus:ring-0 focus:ring-offset-0 border-none bg-transparent shadow-none">
                                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {slotOptions.map(opt => (
                                                <SelectItem key={opt} value={String(opt)}>{opt} slot{opt > 1 ? 's' : ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <ScrollArea className="flex-1 min-h-0">
                        <div ref={dropRef} className="relative h-full grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                            {visibleHours.map(hour => (
                                <React.Fragment key={hour}>
                                    {visibleDates.map(date => (
                                        <div key={date.toISOString()} className="relative flex flex-col border-r border-black" style={{ height: '120px' }}>
                                            {Array.from({ length: slotIncrements[hour] || 1 }).map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className="flex-1 border border-black rounded-lg m-px box-border"
                                                ></div>
                                            ))}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                             {/* Event rendering */}
                             <div className="absolute inset-0 right-0">
                                <div className="relative h-full grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                                    {visibleDates.map((date) => (
                                        <div key={date.toISOString()} className="relative h-full">
                                            {events.filter(event => format(event.start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')).map(event => {
                                                const { top, height } = getEventPosition(event);
                                                if (top > totalHeight || top + height < 0) return null;
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
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
