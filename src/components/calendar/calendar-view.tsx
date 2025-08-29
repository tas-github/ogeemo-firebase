
"use client"

import * as React from "react"
import { format, addDays, startOfDay, set } from "date-fns"
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
import { type Event as TaskEvent } from "@/types/calendar"
import { Label } from "../ui/label"

export function CalendarView() {
    const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
    const [dayCount, setDayCount] = React.useState<number>(1);
    const [granularity, setGranularity] = React.useState<number>(60);
    const [events, setEvents] = React.useState<TaskEvent[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [startHour, setStartHour] = React.useState(8); // Default 8 AM
    const [endHour, setEndHour] = React.useState(17); // Default 5 PM
    
    const { user } = useAuth();
    const { toast } = useToast();

    const visibleHours = React.useMemo(() => {
        const hours = [];
        for (let i = startHour; i < endHour; i++) {
            hours.push(i);
        }
        return hours;
    }, [startHour, endHour]);

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
            } catch (error: any) {
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
    
    const handlePrev = () => {
        setCurrentDate(prev => addDays(prev, -dayCount));
    };

    const handleNext = () => {
        setCurrentDate(prev => addDays(prev, dayCount));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };
    
    const granularityOptions = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
    
    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const date = set(new Date(), { hours: i, minutes: 0 });
        return { value: String(i), label: format(date, 'h a') };
    });

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
                    <h2 className="text-xl font-semibold">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn(!currentDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    <span>{format(currentDate, "PPP")}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <CalendarShadCN
                                    mode="single"
                                    selected={currentDate}
                                    onSelect={(date) => date && setCurrentDate(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="icon" aria-label="Previous period" onClick={handlePrev}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={handleToday}>Today</Button>
                        <Button variant="outline" size="icon" aria-label="Next period" onClick={handleNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Select value={String(dayCount)} onValueChange={(value) => setDayCount(Number(value))}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                                    <SelectItem key={day} value={String(day)}>
                                        {day}-Day
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Settings">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Display Settings</h4>
                                    <p className="text-sm text-muted-foreground">
                                    Set the visible hours for your calendar day.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="start-time">Start Time</Label>
                                        <Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}>
                                            <SelectTrigger id="start-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="end-time">End Time</Label>
                                        <Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}>
                                            <SelectTrigger id="end-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                
                 <div className="flex items-center border-b">
                    <div className="w-24 shrink-0 border-r text-center py-2">
                        {/* Empty space for alignment */}
                    </div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))`}}>
                        {visibleDates.map(date => (
                            <div key={date.toISOString()} className="text-center py-2 border-r last:border-r-0">
                                <p className="text-sm font-semibold">{format(date, 'EEE')}</p>
                                <p className="text-2xl font-bold">{format(date, 'd')}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="space-y-2">
                        {visibleHours.map((hour) => {
                            const slotsPerHour = 60 / granularity;
                            return (
                                <div key={hour} className="relative flex border border-black rounded-lg m-2">
                                    {/* Time Gutter */}
                                    <div className="w-24 shrink-0 h-24 flex flex-col items-center justify-center p-2">
                                        <span className="text-xs text-muted-foreground font-semibold">
                                            {format(new Date(0, 0, 0, hour), 'h a')}
                                        </span>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 mt-1">
                                                     <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-0">
                                                <ScrollArea className="h-48">
                                                    <div className="p-2 flex flex-col">
                                                        {granularityOptions.map(g => (
                                                            <Button
                                                                key={g}
                                                                variant={granularity === g ? 'secondary' : 'ghost'}
                                                                size="sm"
                                                                onClick={() => setGranularity(g)}
                                                                className="justify-start"
                                                            >
                                                                {g} minutes
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    {/* Day Columns for this hour */}
                                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                                        {visibleDates.map(date => (
                                            <div key={date.toISOString()} className="h-24 border-l border-black p-1">
                                                <div className="h-full w-full flex flex-col">
                                                    {Array.from({ length: slotsPerHour }).map((_, slotIndex) => (
                                                        <div key={slotIndex} className="flex-1 h-full w-full rounded-lg border border-black">
                                                            {/* Event titles will go here later */}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
