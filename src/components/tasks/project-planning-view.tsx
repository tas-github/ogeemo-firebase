
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoaderCircle, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getProjectById, type Project, type ProjectStep } from '@/services/project-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { useAuth } from '@/context/auth-context';

export function ProjectPlanningView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<Project | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();

    const loadProjectData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [fetchedProject, fetchedContacts] = await Promise.all([
                getProjectById(projectId),
                getContacts(user.uid),
            ]);

            if (fetchedProject) {
                setProject(fetchedProject);
                setContacts(fetchedContacts);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find the specified project.' });
                router.push('/projects');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to load project data', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [projectId, router, toast, user]);

    useEffect(() => {
        loadProjectData();
    }, [loadProjectData]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!project) {
        return null;
    }

    const clientName = contacts.find(c => c.id === project.clientId)?.name || 'No Client Assigned';

    return (
        <div className="p-4 sm:p-6 flex flex-col items-center h-full space-y-6">
            <header className="w-full max-w-4xl text-center">
                <div className="flex justify-end">
                     <Button asChild variant="outline">
                        <Link href="/projects">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Projects
                        </Link>
                    </Button>
                </div>
                <h1 className="text-3xl font-bold font-headline text-primary">Project Planning & Progress</h1>
                <p className="text-muted-foreground mt-1">
                    Project: <span className="font-semibold text-foreground">{project.name}</span> | Client: <span className="font-semibold text-foreground">{clientName}</span>
                </p>
            </header>

            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle>Project Steps</CardTitle>
                    <CardDescription>
                       The high-level plan for completing this project.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 mt-2">
                        {project.steps && project.steps.length > 0 ? project.steps.map(step => (
                            <div key={step.id} className="flex items-center gap-3 p-2 border rounded-lg bg-muted/50">
                                <Checkbox checked={step.isCompleted} disabled />
                                <span className="flex-1">{step.title}</span>
                                <span className="text-sm text-muted-foreground">{step.durationHours} hrs</span>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No steps defined for this project.</p>
                        )}
                    </div>
                     <Button asChild variant="link" className="px-0">
                        <Link href={`/projects/steps`}>
                            Edit Steps
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
