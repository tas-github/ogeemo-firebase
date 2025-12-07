
'use client';

import React, { useState, useEffect } from 'react';
import { getProjects } from '@/services/project-service';
import { getContacts } from '@/services/contact-service';
import { getTasksForUser } from '@/services/project-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Contact } from '@/data/contacts';
import type { Project, Event as TaskEvent } from '@/types/calendar-types';
import { LoaderCircle } from 'lucide-react';
import { ClientTimeLogReport } from '@/components/client-manager/client-time-log-report';

export default function ClientTimeLogReportPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<TaskEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (user) {
                setIsLoading(true);
                try {
                    const [contactData, projectData, taskData] = await Promise.all([
                        getContacts(user.uid),
                        getProjects(user.uid),
                        getTasksForUser(user.uid),
                    ]);
                    setContacts(contactData);
                    setProjects(projectData);
                    setTasks(taskData);
                } catch (error) {
                    console.error("Failed to load data for billing report:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Failed to load report data',
                        description: error instanceof Error ? error.message : 'An unknown error occurred.',
                    });
                } finally {
                    setIsLoading(false);
                }
            } else {
                 setIsLoading(false);
            }
        }
        loadData();
    }, [user, toast]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading Report Data...</p>
                </div>
            </div>
        );
    }

  return <ClientTimeLogReport initialContacts={contacts} initialEntries={tasks} initialProjects={projects} />;
}
