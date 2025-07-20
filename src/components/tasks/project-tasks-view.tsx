
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

export function ProjectTasksView({ projectId }: { projectId: string }) {
    return (
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This is the landing page for Project ID: {projectId}.</p>
                    <p className="text-muted-foreground mt-2">The content for this view is pending.</p>
                </CardContent>
                <CardContent>
                    <Button asChild>
                        <Link href="/projects">
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Back to All Projects
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
