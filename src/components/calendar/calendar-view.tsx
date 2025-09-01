
"use client"

import * as React from "react"
import { format, addDays, startOfDay, set } from "date-fns"
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, MoreVertical, BookOpen, Pencil, Trash2 } from "lucide-react"

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
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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

    const slotOptions = Array.from({ length: 12 }, (_, i) => i + 1);
    const dayOptions = Array.from({ length: 30 }, (_, i) => i + 1);

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
        return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
    }, [startHour, endHour]);
    
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
                    <div className="w-1/4">
                        {/* Left Spacer */}
                    </div>
                    <div className="flex-1 flex justify-center items-center gap-2">
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-center text-center font-normal",
                                        !currentDate && "text-muted-foreground"
                                    )}
                                >
                                    <ChevronLeft onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="h-4 w-4" />
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    <span className="mx-2">{format(currentDate, "PPP")}</span>
                                    <ChevronRight onClick={(e) => { e.stopPropagation(); handleNext(); }} className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><CalendarShadCN mode="single" selected={currentDate} onSelect={(date) => date && setCurrentDate(date)} initialFocus /></PopoverContent>
                        </Popover>
                        <Button variant="outline" onClick={handleToday}>Today</Button>
                        <Select value={String(dayCount)} onValueChange={(value) => setDayCount(Number(value))}>
                            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {dayOptions.map(day => (
                                    <SelectItem key={day} value={String(day)}>{day} Day{day > 1 ? 's' : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button asChild>
                            <Link href="/time">
                                Add Event
                            </Link>
                        </Button>
                        <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Settings"><Settings className="h-4 w-4" /></Button></PopoverTrigger><PopoverContent className="w-80"><div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">Display Settings</h4><p className="text-sm text-muted-foreground">Set the visible hours for your calendar day.</p></div><div className="grid gap-2"><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="start-time">Start Time</Label><Select value={String(startHour)} onValueChange={(v) => setStartHour(Number(v))}><SelectTrigger id="start-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="end-time">End Time</Label><Select value={String(endHour)} onValueChange={(v) => setEndHour(Number(v))}><SelectTrigger id="end-time" className="col-span-2 h-8"><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div></div></div></PopoverContent></Popover>
                    </div>
                    <div className="w-1/4 flex justify-end">
                        
                    </div>
                </div>
                
                <div className="grid grid-cols-[4.5rem,1fr]">
                    {/* Empty top-left corner */}
                    <div />
                    {/* Date headers */}
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                        {visibleDates.map((date) => (
                            <div key={date.toISOString()} className="h-8 flex items-center justify-center border-l border-b">
                                <p className="text-sm font-semibold">{format(date, 'PPPP')}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                <ScrollArea className="flex-1 min-h-0">
                    <div className="relative pr-2">
                        {visibleHours.map(hour => (
                            <div key={hour} className="grid grid-cols-[4.5rem,1fr] border-2 border-black my-1">
                                <div className="flex flex-col items-center justify-start p-1 text-center">
                                    <span className="text-xs text-muted-foreground">{format(new Date(0, 0, 0, hour), 'h a')}</span>
                                    <Select onValueChange={(value) => handleSlotIncrementChange(hour, Number(value))}>
                                        <SelectTrigger className="h-auto w-auto p-1 flex items-center gap-1 focus:ring-0 focus:ring-offset-0 border-none bg-transparent shadow-none">
                                            <CalendarIcon className="h-4 w-4 text-primary" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {slotOptions.map(opt => (
                                                <SelectItem key={opt} value={String(opt)}>{opt} slot{opt > 1 ? 's' : ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                                    {visibleDates.map(date => (
                                        <div 
                                            key={date.toISOString()} 
                                            className={cn(
                                                "relative flex flex-col border-l border-black",
                                                (slotIncrements[hour] || 1) === 1 && "justify-center"
                                            )}
                                        >
                                            {Array.from({ length: slotIncrements[hour] || 1 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="relative h-8 border border-black m-px rounded-lg p-1"
                                                >
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 p-1">
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Time slot options</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem><BookOpen className="mr-2 h-4 w-4" /> Open</DropdownMenuItem>
                                                            <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
