
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Calendar as CalendarIcon, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, set } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

const dayOptions: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const d = set(new Date(), { hours: i });
    return { value: String(i), label: format(d, 'h a') };
});

const minuteOptions = Array.from({ length: 4 }, (_, i) => {
    const minutes = i * 15;
    return { value: String(minutes), label: minutes.toString().padStart(2, '0') };
});


export default function PlanningRitualsPage() {
    const { toast } = useToast();

    // State for Daily Ritual
    const [dailyStartDate, setDailyStartDate] = useState<Date | undefined>();
    const [dailyStopDate, setDailyStopDate] = useState<Date | undefined>();
    const [dailyStartTime, setDailyStartTime] = useState<{ hour: string, minute: string }>({ hour: '17', minute: '00' });
    const [dailyEndTime, setDailyEndTime] = useState<{ hour: string, minute: string }>({ hour: '17', minute: '25' });
    
    // State for Weekly Ritual
    const [weeklyStartDate, setWeeklyStartDate] = useState<Date | undefined>();
    const [weeklyEndDate, setWeeklyEndDate] = useState<Date | undefined>();
    const [weeklyDay, setWeeklyDay] = useState<DayOfWeek>('Friday');
    const [weeklyTime, setWeeklyTime] = useState<{ hour: string, minute: string }>({ hour: '15', minute: '00' });

    const handleSaveDaily = () => {
        toast({
            title: "Daily Ritual Saved (Placeholder)",
            description: "Your settings for the Daily Wind-down have been saved.",
        });
    }
    
    const handleSaveWeekly = () => {
         toast({
            title: "Weekly Ritual Saved (Placeholder)",
            description: "Your settings for the Weekly Strategic Review have been saved.",
        });
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="relative text-center">
                 <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    <Button asChild variant="outline">
                        <Link href="/calendar">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Calendar
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl font-bold font-headline text-primary">
                        Planning Rituals
                    </h1>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="ghost" size="icon">
                                    <Link href="/settings/rituals/instructions">
                                        <Info className="h-5 w-5 text-muted-foreground" />
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Why are planning rituals important?</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Automate your success by scheduling dedicated time for planning.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {/* Daily Plan Card */}
                <Card>
                    <CardHeader className="p-0">
                        <div className="bg-gradient-to-r from-glass-start to-glass-end p-4 rounded-t-lg text-center">
                            <CardTitle className="text-lg font-semibold text-black">Daily Wind-down & Plan</CardTitle>
                        </div>
                        <CardDescription className="p-4 text-center">
                            End each day with a review and identify any carry-forward actions. Add those unfinished items to the next day and plan the next day.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4"/>{dailyStartDate ? format(dailyStartDate, 'PPP') : "Select date"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={dailyStartDate} onSelect={setDailyStartDate} /></PopoverContent></Popover>
                            </div>
                             <div className="space-y-2">
                                <Label>Stop Date</Label>
                                <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4"/>{dailyStopDate ? format(dailyStopDate, 'PPP') : "Select date"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={dailyStopDate} onSelect={setDailyStopDate} /></PopoverContent></Popover>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <div className="flex gap-2">
                                    <Select value={dailyStartTime.hour} onValueChange={(h) => setDailyStartTime(p => ({...p, hour: h}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{hourOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                    <Select value={dailyStartTime.minute} onValueChange={(m) => setDailyStartTime(p => ({...p, minute: m}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{minuteOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <div className="flex gap-2">
                                     <Select value={dailyEndTime.hour} onValueChange={(h) => setDailyEndTime(p => ({...p, hour: h}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{hourOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                    <Select value={dailyEndTime.minute} onValueChange={(m) => setDailyEndTime(p => ({...p, minute: m}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{minuteOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveDaily} className="w-full"><Save className="mr-2 h-4 w-4"/> Save Daily Ritual</Button>
                    </CardFooter>
                </Card>

                {/* Weekly Plan Card */}
                <Card>
                    <CardHeader className="p-0">
                        <div className="bg-gradient-to-r from-glass-start to-glass-end p-4 rounded-t-lg text-center">
                           <CardTitle className="text-lg font-semibold text-black">Weekly Strategic Review & Plan</CardTitle>
                        </div>
                        <CardDescription className="p-4 text-center">
                            Take a high-level view of your week, and build a plan for a successful week.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                                <Label>Day of the Week</Label>
                                <Select value={weeklyDay} onValueChange={(d: DayOfWeek) => setWeeklyDay(d)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{dayOptions.map(day=><SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <div className="flex gap-2">
                                     <Select value={weeklyTime.hour} onValueChange={(h) => setWeeklyTime(p => ({...p, hour: h}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{hourOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                    <Select value={weeklyTime.minute} onValueChange={(m) => setWeeklyTime(p => ({...p, minute: m}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{minuteOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4"/>{weeklyStartDate ? format(weeklyStartDate, 'PPP') : "Select date"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={weeklyStartDate} onSelect={setWeeklyStartDate} /></PopoverContent></Popover>
                            </div>
                             <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4"/>{weeklyEndDate ? format(weeklyEndDate, 'PPP') : "Select date"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={weeklyEndDate} onSelect={setWeeklyEndDate} /></PopoverContent></Popover>
                            </div>
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Button onClick={handleSaveWeekly} className="w-full"><Save className="mr-2 h-4 w-4"/> Save Weekly Ritual</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
