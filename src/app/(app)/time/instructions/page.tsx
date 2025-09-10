
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, Play, Save, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function TimeManagerInstructionsPage() {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div className="w-1/4">
                    {/* Spacer */}
                </div>
                <div className="text-center flex-1">
                    <h1 className="text-2xl font-bold font-headline text-primary">
                        How to Use the Time & Task Manager
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Your central hub for both scheduling future work and logging time that has already been completed.
                    </p>
                </div>
                <div className="w-1/4 flex justify-end">
                    <Button asChild variant="outline">
                        <Link href="/time">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Time Manager
                        </Link>
                    </Button>
                </div>
            </header>

            <Card className="max-w-4xl mx-auto">
                <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-primary"/>
                                    <span className="font-semibold">Logging Time with the Real-Time Timer</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none pl-8">
                                    <p>
                                        Use the timer to track work as it happens. This is ideal for tasks where you want to capture the exact time spent.
                                    </p>
                                    <ol>
                                        <li>Fill in the <strong>Subject Title</strong> for the task.</li>
                                        <li>Optionally, link it to a Client and Project.</li>
                                        <li>Click the <strong>"Start Timer Now"</strong> button. The timer will begin counting up.</li>
                                        <li>You can close this window; a small indicator will appear at the bottom of your screen.</li>
                                        <li>When you're finished, click <strong>"Stop & Log Time"</strong>. This creates a completed task record with the exact duration.</li>
                                    </ol>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Save className="h-5 w-5 text-primary"/>
                                    <span className="font-semibold">Logging Time Manually (Past Work)</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none pl-8">
                                    <p>
                                        If you've already completed the work, you can log it manually.
                                    </p>
                                     <ol>
                                        <li>Fill in the <strong>Subject Title</strong> and other details.</li>
                                        <li>Set the <strong>Start Time</strong> and <strong>End Time</strong> to reflect when the work was done.</li>
                                        <li>Click the <strong>"Save Event"</strong> button. This will create a completed task directly on your calendar for the time you specified.</li>
                                    </ol>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-primary"/>
                                    <span className="font-semibold">Scheduling a Future Task or Event</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none pl-8">
                                    <p>
                                        Use this manager to block out time on your calendar for future work, meetings, or appointments.
                                    </p>
                                     <ol>
                                        <li>Fill in the <strong>Subject Title</strong> for the future event.</li>
                                        <li>Set the <strong>Start Time</strong> and <strong>End Time</strong> to when you plan to do the work.</li>
                                        <li>Click the <strong>"Save Event"</strong> button. This will add an event to your calendar.</li>
                                        <li>Later, you can find this event on your calendar and use the "Log Time" option to record the actual time spent.</li>
                                    </ol>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-4" className="border-b-0">
                            <AccordionTrigger>
                                <div className="flex items-center gap-3">
                                    <LinkIcon className="h-5 w-5 text-primary"/>
                                    <span className="font-semibold">Linking to Clients & Projects</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none pl-8">
                                    <p>
                                        For accurate reporting and billing, always link your time entries to a specific <strong>Client</strong> and, if applicable, a <strong>Project</strong>. This ensures that the time is correctly allocated and can be easily pulled into reports and invoices later.
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
