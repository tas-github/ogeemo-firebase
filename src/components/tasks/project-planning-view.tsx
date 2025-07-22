
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LoaderCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getProjectById, type Project } from '@/services/project-service';
import { getContacts, type Contact } from '@/services/contact-service';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ProjectPlanningView({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<Project | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        async function loadData() {
            setIsLoading(true);
            setError(null);
            try {
                const [projectData, contactsData] = await Promise.all([
                    getProjectById(projectId),
                    getContacts(user.uid),
                ]);

                if (!projectData) {
                    setError("Project not found.");
                } else {
                    setProject(projectData);
                }
                setContacts(contactsData);
            } catch (err: any) {
                setError("Failed to load project details.");
                toast({ variant: 'destructive', title: 'Error', description: err.message });
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [projectId, user, toast]);

    const clientName = useMemo(() => {
        if (!project || !project.clientId) return "No Client Assigned";
        const contact = contacts.find(c => c.id === project.clientId);
        return contact?.name || "Unknown Client";
    }, [project, contacts]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading Project Plan...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                     <CardContent className="p-6">
                        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                        <h2 className="mt-4 text-xl font-semibold">Could not load project</h2>
                        <p className="mt-2 text-muted-foreground">{error || "The project could not be found."}</p>
                        <Button asChild className="mt-6">
                            <Link href="/projects">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to All Projects
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="relative">
                <div className="absolute left-0 top-0">
                    <Button asChild variant="outline">
                        <Link href="/projects">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to All Projects
                        </Link>
                    </Button>
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline text-primary">Project Planning and Progress</h1>
                    <p className="text-muted-foreground mt-1">
                        Project: <span className="font-semibold text-foreground">{project.name}</span> | Client: <span className="font-semibold text-foreground">{clientName}</span>
                    </p>
                </div>
            </header>
            
            {/* Future content will go here */}
            <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Planning and progress view coming soon.</p>
            </div>
        </div>
    );
}
