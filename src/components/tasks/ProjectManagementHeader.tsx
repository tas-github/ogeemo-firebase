'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase, ListChecks, Inbox, Calendar as CalendarIcon, Plus } from 'lucide-react';

interface ProjectManagementHeaderProps {
    onNewProjectClick: () => void;
    projectId?: string; // Make projectId optional
}

export function ProjectManagementHeader({ onNewProjectClick, projectId }: ProjectManagementHeaderProps) {
    // If a projectId is provided, the calendar link will be specific to that project.
    const calendarHref = projectId ? `/calendar?projectId=${projectId}` : '/calendar';

    return (
        <div className="flex justify-center gap-2 pb-4">
            <Button asChild variant="outline">
                <Link href="/projects">
                    <Briefcase className="mr-2 h-4 w-4" /> All Projects
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/project-status">
                    <ListChecks className="mr-2 h-4 w-4" /> Status Board
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/tasks">
                    <Inbox className="mr-2 h-4 w-4" /> Action Items
                </Link>
            </Button>
            <Button onClick={onNewProjectClick}>
                <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
        </div>
    );
}
