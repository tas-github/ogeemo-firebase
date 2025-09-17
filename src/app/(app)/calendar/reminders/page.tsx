
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, ArrowLeft, Calendar as CalendarIcon, Save, BellRing } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addTask } from '@/services/project-service';
import { format, set, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewReminderPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [hour, setHour] = useState<string>(String(new Date().getHours()));
    const [minute, setMinute] = useState<string>(String(Math.floor(new Date().getMinutes() / 5) * 5));
    const [isSaving, setIsSaving] = useState(false);

    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const initialTitle = searchParams.get('title');
        if (initialTitle) {
            setTitle(initialTitle);
        }
    }, [searchParams]);


    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const d = set(new Date(), { hours: i });
        return { value: String(i), label: format(d, 'h a') };
    });

    const minuteOptions = Array.from({ length: 12 }, (_, i) => {
        const minutes = i * 5;
        return { value: String(minutes), label: `:${minutes.toString().padStart(2, '0')}` };
    });
    
    const handleSaveReminder = async () => {
        if (!user || !title.trim() || !date) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a title and date for the reminder.' });
            return;
        }
        
        setIsSaving(true);
        try {
            const startTime = set(date, { hours: parseInt(hour), minutes: parseInt(minute) });
            const endTime = addMinutes(startTime, 30); // Default 30-minute duration

            const reminderData = {
                title: `Reminder: ${title}`,
                description: notes,
                start: startTime,
                end: endTime,
                status: 'todo' as const,
                position: 0,
                userId: user.uid,
                isScheduled: true,
            };
            
            await addTask(reminderData);
            
            toast({ title: 'Reminder Saved', description: `Your reminder has been added to the calendar.` });
            router.push('/calendar');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            setIsSaving(false);
        }
    };
    
    return (
        <div className="p-4 sm:p-6 flex items-center justify-center h-full">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                        <BellRing className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Create a New Reminder</CardTitle>
                    <CardDescription>
                        This will be added as an event on your calendar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reminder-title">Reminder Title</Label>
                        <Input id="reminder-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Date & Time</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                            </Popover>
                            <div className="flex-1 flex gap-2">
                                <Select value={hour} onValueChange={setHour}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{hourOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                                <Select value={minute} onValueChange={setMinute}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{minuteOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reminder-notes">Notes (Optional)</Label>
                        <Textarea id="reminder-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button asChild variant="outline">
                        <Link href="/calendar">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Calendar
                        </Link>
                    </Button>
                    <Button onClick={handleSaveReminder} disabled={isSaving}>
                        {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Save Reminder
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
