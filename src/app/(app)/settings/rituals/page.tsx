
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
import { format, set, addDays, addMinutes } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { upsertRitualTask } from '@/app/actions/rituals';
import type { PlanningRitual } from '@/hooks/use-user-preferences';
import { getUserProfile, updateUserProfile } from '@/services/user-profile-service';

type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

const dayOptions: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hourOptions = Array.from({ length: 24 }, (_, i) => { const d = set(new Date(), { hours: i }); return { value: String(i), label: format(d, 'h a') }; });
const minuteOptions = Array.from({ length: 12 }, (_, i) => { const minutes = i * 5; return { value: String(minutes), label: minutes.toString().padStart(2, '0') }; });


export default function PlanningRitualsPage() {
    const { toast } = useToast();
    const { user } = useAuth();

    // State for Daily Ritual
    const [dailyRitual, setDailyRitual] = useState<PlanningRitual>({ enabled: true, time: '17:00', duration: 25 });
    const [dailyDateRange, setDailyDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ from: new Date(), to: addDays(new Date(), 30) });

    // State for Weekly Ritual
    const [weeklyRitual, setWeeklyRitual] = useState<PlanningRitual>({ enabled: true, day: 'Friday', time: '15:00', duration: 90 });
    const [weeklyDateRange, setWeeklyDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ from: new Date(), to: addDays(new Date(), 90) });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadSettings() {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const profile = await getUserProfile(user.uid);
                const rituals = profile?.preferences?.planningRituals;
                if (rituals) {
                    setDailyRitual(rituals.daily);
                    setWeeklyRitual(rituals.weekly);
                    if (rituals.ritualsStartDate) setDailyDateRange(prev => ({ ...prev, from: new Date(rituals.ritualsStartDate!) }));
                    if (rituals.ritualsEndDate) setDailyDateRange(prev => ({ ...prev, to: new Date(rituals.ritualsEndDate!) }));
                    if (rituals.ritualsStartDate) setWeeklyDateRange(prev => ({ ...prev, from: new Date(rituals.ritualsStartDate!) }));
                    if (rituals.ritualsEndDate) setWeeklyDateRange(prev => ({ ...prev, to: new Date(rituals.ritualsEndDate!) }));
                }
            } catch (error) {
                console.error("Failed to load ritual settings:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [user]);
    
    const handleSaveDaily = async () => {
        if (!user || !dailyDateRange.from || !dailyDateRange.to) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a valid date range for the daily ritual.'});
            return;
        }
        try {
            await upsertRitualTask(user.uid, 'daily', dailyRitual, { from: dailyDateRange.from, to: dailyDateRange.to });
            await updateUserProfile(user.uid, user.email || '', {
                preferences: {
                    planningRituals: {
                        daily: dailyRitual,
                        weekly: weeklyRitual,
                        ritualsStartDate: dailyDateRange.from.toISOString(),
                        ritualsEndDate: dailyDateRange.to.toISOString(),
                    }
                }
            });
            toast({ title: "Daily Ritual Saved", description: "Your daily planning sessions have been updated on the calendar." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Save Failed", description: error.message });
        }
    };
    
    const handleSaveWeekly = async () => {
         if (!user || !weeklyDateRange.from || !weeklyDateRange.to) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a valid date range for the weekly ritual.'});
            return;
        }
         try {
            await upsertRitualTask(user.uid, 'weekly', weeklyRitual, { from: weeklyDateRange.from, to: weeklyDateRange.to });
             await updateUserProfile(user.uid, user.email || '', {
                preferences: {
                    planningRituals: {
                        daily: dailyRitual,
                        weekly: weeklyRitual,
                        ritualsStartDate: weeklyDateRange.from.toISOString(),
                        ritualsEndDate: weeklyDateRange.to.toISOString(),
                    }
                }
            });
            toast({ title: "Weekly Ritual Saved", description: "Your weekly strategic reviews have been updated on the calendar." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Save Failed", description: error.message });
        }
    };

    const dailyStartTime = { hour: dailyRitual.time.split(':')[0], minute: dailyRitual.time.split(':')[1] };
    const dailyEndTimeDate = addMinutes(set(new Date(), { hours: parseInt(dailyStartTime.hour), minutes: parseInt(dailyStartTime.minute) }), dailyRitual.duration);

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
                                <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4"/>{dailyDateRange.from ? format(dailyDateRange.from, 'PPP') : "Select date"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={dailyDateRange.from} onSelect={(date) => setDailyDateRange(p => ({...p, from: date}))} /></PopoverContent></Popover>
                            </div>
                             <div className="space-y-2">
                                <Label>Stop Date</Label>
                                <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4"/>{dailyDateRange.to ? format(dailyDateRange.to, 'PPP') : "Select date"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={dailyDateRange.to} onSelect={(date) => setDailyDateRange(p => ({...p, to: date}))} /></PopoverContent></Popover>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <div className="flex gap-2">
                                    <Select value={dailyStartTime.hour} onValueChange={(h) => setDailyRitual(p => ({...p, time: `${h}:${dailyStartTime.minute}`}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{hourOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                    <Select value={dailyStartTime.minute} onValueChange={(m) => setDailyRitual(p => ({...p, time: `${dailyStartTime.hour}:${m}`}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{minuteOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input value={format(dailyEndTimeDate, 'h:mm a')} readOnly disabled />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveDaily} className="w-full"><Save className="mr-2 h-4 w-4"/> Save Daily Ritual</Button>
                    </CardFooter>
                </Card>

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
                                <Select value={weeklyRitual.day} onValueChange={(d: DayOfWeek) => setWeeklyRitual(p => ({...p, day: d}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{dayOptions.map(day=><SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <div className="flex gap-2">
                                     <Select value={weeklyRitual.time.split(':')[0]} onValueChange={(h) => setWeeklyRitual(p => ({...p, time: `${h}:${p.time.split(':')[1]}`}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{hourOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                    <Select value={weeklyRitual.time.split(':')[1]} onValueChange={(m) => setWeeklyRitual(p => ({...p, time: `${p.time.split(':')[0]}:${m}`}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{minuteOptions.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4"/>{weeklyDateRange.from ? format(weeklyDateRange.from, 'PPP') : "Select date"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={weeklyDateRange.from} onSelect={(date) => setWeeklyDateRange(p => ({...p, from: date}))} /></PopoverContent></Popover>
                            </div>
                             <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4"/>{weeklyDateRange.to ? format(weeklyDateRange.to, 'PPP') : "Select date"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={weeklyDateRange.to} onSelect={(date) => setWeeklyDateRange(p => ({...p, to: date}))} /></PopoverContent></Popover>
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
