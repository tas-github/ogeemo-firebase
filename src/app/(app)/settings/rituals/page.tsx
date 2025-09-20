
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlanningRitualsPage() {
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Wind-Down</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Content for the first panel will go here */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Strategic Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Content for the second panel will go here */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
