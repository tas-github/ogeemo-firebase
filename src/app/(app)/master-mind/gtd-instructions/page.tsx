'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Inbox, BrainCircuit, BookOpen, Folder, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function GtdInstructionsPage() {
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="grid grid-cols-3 items-center">
                <div className="flex flex-col items-start gap-2">
                    <Button asChild variant="outline">
                        <Link href="/master-mind">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Master Mind
                        </Link>
                    </Button>
                     <Button asChild variant="outline">
                        <Link href="/action-manager">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Action Manager
                        </Link>
                    </Button>
                </div>
                <div className="text-center col-span-1">
                    <h1 className="text-2xl font-bold font-headline text-primary">
                        The Ogeemo Method (TOM)
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        A guide to implementing our productivity method using your Ogeemo workspace.
                    </p>
                </div>
                <div className="flex justify-end">
                    {/* Spacer */}
                </div>
            </header>

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        The Core Philosophy: Clear your mind
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                        <p>
                           The goal of The Ogeemo Method is to get everything out of your head and into a trusted external system. This frees your mind to focus on having ideas, not holding them.
                        </p>
                        <p>
                           Ogeemo has integrated proven principles for productivity to provide you with a powerful, intuitive system for managing your workflow, helping you capture, clarify, and organize your work to reduce stress and increase focus.
                        </p>
                    </div>
                    
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <Inbox className="h-5 w-5 text-primary"/>
                                        <span className="font-semibold">Step 1: Collect Your Commitments</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-8">
                                        <p>
                                            Your first goal is to capture every idea, task, and commitment. Ogeemo provides several "inboxes" for this:
                                        </p>
                                        <ul>
                                            <li><strong>Project Inbox:</strong> Use the dedicated "Inbox" project in the <Link href="/projects/inbox/tasks">Task Board</Link> as your primary collection point for all actionable items.</li>
                                            <li><strong>Idea Board:</strong> For less defined thoughts or future possibilities, use the <Link href="/ideas">Idea Board</Link>. You can easily convert an idea into a project later.</li>
                                            <li><strong>Event Time Manager:</strong> When you need to schedule a specific event or meeting, creating it in the <Link href="/time">Event Time Manager</Link> captures it directly onto your calendar.</li>
                                        </ul>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="h-5 w-5 text-primary"/>
                                        <span className="font-semibold">Step 2: Define and Assign</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-8">
                                        <p>
                                            Process everything you've captured. Go to your "Inbox" project's task board. For each item, decide what it is and where it belongs.
                                        </p>
                                        <ul>
                                            <li><strong>Is it a Project?</strong> If it requires more than one step, create a new project for it in the <Link href="/projects">Project Manager</Link> and move the task there.</li>
                                            <li><strong>Is it a single task?</strong> Drag it from the "Inbox" board to the appropriate project's task board. If it's a standalone task, consider creating a "Next Actions" project to hold it.</li>
                                            <li><strong>Is it time-sensitive?</strong> Ensure it has a date and time set so it appears on your <Link href="/calendar">Calendar</Link>.</li>
                                            <li><strong>Is it reference material?</strong> Move any related documents to a relevant folder in the <Link href="/files">File Manager</Link>.</li>
                                        </ul>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <Folder className="h-5 w-5 text-primary"/>
                                        <span className="font-semibold">Step 3: The Weekly Review</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                   <div className="pl-8">
                                       <p>
                                          The key to our method is the Weekly Review. Set aside time each week to look over all your lists and projects to ensure they are current.
                                       </p>
                                        <ul>
                                            <li>Use the <Link href="/projects">Project Manager</Link> to get a high-level view of all active projects.</li>
                                            <li>Review your <Link href="/calendar">Calendar</Link> for the upcoming week.</li>
                                            <li>Process any remaining items in your "Inbox" project.</li>
                                            <li>Use the <Link href="/reports">Reports Hub</Link> to analyze your activity and progress.</li>
                                        </ul>
                                   </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4" className="border-b-0">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-primary"/>
                                        <span className="font-semibold">Step 4: Taking Action</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-8">
                                        <p>
                                            With a clear and organized system, you can confidently decide what to work on. Your <Link href="/action-manager">Action Manager</Link> dashboard gives you a clear starting point each day, showing you your most important shortcuts and tasks at a glance.
                                        </p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
