
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCircuit, Zap, BarChart } from "lucide-react";
import Link from "next/link";

export default function RitualsInstructionsPage() {
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
                <h1 className="text-2xl font-bold font-headline text-primary">
                    The Power of Planning Rituals
                </h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Why dedicating time to plan is the ultimate productivity hack.
                </p>
            </header>

            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        From Chaos to Clarity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p>
                           In a world of constant notifications and competing priorities, the single most effective way to regain control is to dedicate uninterrupted time to think and plan. It feels counterintuitive—to go faster, you must first slow down. Ogeemo's Planning Rituals are designed to help you build this essential habit.
                        </p>
                        
                        <blockquote className="border-l-4 border-primary pl-4 italic">
                           "I found that I got more results by working 4 days on sales than when I worked 5. That fifth day, reserved entirely for planning, made the other four more focused and effective."
                        </blockquote>

                        <p>
                           This isn't about adding more to your plate. It's about making the time you spend working more focused, strategic, and productive.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                            <Zap className="h-6 w-6 text-primary mt-1 shrink-0" />
                            <div>
                                <h4 className="font-semibold">The Daily Wind-Down</h4>
                                <p className="text-xs text-muted-foreground">End your day by reviewing what was accomplished and clarifying what needs to happen tomorrow. This 25-minute ritual prevents tasks from bleeding into your personal time and ensures you start the next day with a clear, actionable plan.</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                            <BarChart className="h-6 w-6 text-primary mt-1 shrink-0" />
                            <div>
                                <h4 className="font-semibold">The Weekly Strategic Review</h4>
                                <p className="text-xs text-muted-foreground">This is your command center meeting with yourself. Block off 90 minutes at the end of the week to review all your projects, clean up your inboxes, and set major goals for the week ahead. This is where you move from being reactive to proactive.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
