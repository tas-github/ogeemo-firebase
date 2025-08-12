
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownAZ, ArrowUpZA, Save } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, updateUserProfile } from "@/services/user-profile-service";
import { DraggableAppButton } from "./DraggableAppButton";

// Icon components remain the same
const GoogleDriveIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M7.71 5.42L12 12.25l4.29-6.83a.996.996 0 00-.85-1.42H8.56c-.5 0-.89.37-.85.86z" fill="#34A853"/> <path d="M16.29 18.58l4.29-6.83h-8.58L7.71 18.58c.28.45.81.71 1.35.71h5.88c.54 0 1.07-.26 1.35-.71z" fill="#FFC107"/> <path d="M3.42 11.75l4.29 6.83 4.29-6.83H3.42z" fill="#4285F4"/> </svg> );
const GmailIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#DB4437"/> </svg> );
const DocsIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 9H7v-2h6v2zm3 4H7v-2h9v2zm-3-8V4.5L16.5 9H13z" fill="#4285F4"/> </svg> );
const SheetsIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 10h-2v2H9v-2H7v-2h2V8h2v2h2v2zm3 5H7v-2h9v2z" fill="#0F9D58"/> </svg> );
const SlidesIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM12 18h-2v-4h2v4zm4-6h-2V8h2v4zM8 12H6v-2h2v2zm5-4V3.5L18.5 9H13z" fill="#F4B400"/> </svg> );
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" fill="#4285F4"/> <path d="M12 13H7v-2h5v2z" fill="#4285F4"/> </svg> );
const ContactsIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M20 0H4v24h16V0zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z" fill="#4285F4"/> </svg> );
const ChatIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM8 12H6v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" fill="#34A853"/> </svg> );
const KeepIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M5 2h14c1.1 0 2 .9 2 2v18l-2-2H5c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm7 14c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="#FFC107"/> <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5V7z" fill="#FFEB3B"/> <path d="M11 5h2v3h-2z" fill="#FFC107"/> <path d="M10 8h4v2h-4z" fill="#FFF"/> </svg> );
const MeetIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M19 8l-4 4-4-4-4 4V5H3v14h18V5h-6z" fill="#00832D"/> <path d="M19 8l-4 4h8l-4-4z" fill="#FFBA00"/> <path d="M5 8l4 4-4 4-4-4 4-4z" fill="#00ACF2"/> </svg> );
const SitesIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 4H5v3h8V8zm0 7H5v-3h8v3zm6 0h-5v-7h5v7z" fill="#4285F4"/> </svg> );
const MapsIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4285F4"/> <path d="M0 0h24v24H0z" fill="none"/> </svg> );
const PhotosIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5l-3-3-1.5 1.5L9 18l6-6-1.5-1.5-4.5 4.5z" fill="#DB4437"/> <path d="M12 4c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8z" fill="#4285F4"/> <path d="M12 4v8l4-4-4-4z" fill="#FFC107"/> <path d="M12 4v8l-4-4 4-4z" fill="#34A853"/> </svg> );
const GeminiIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.15 13.85c-.32.32-.74.5-1.15.5s-.83-.18-1.15-.5c-.63-.63-.63-1.65 0-2.28l1.15-1.15 1.15 1.15c.63.63.63 1.65 0 2.28zm1.06-1.06l1.15 1.15c.63.63.63 1.65 0 2.28s-1.65.63-2.28 0l-1.15-1.15-1.15 1.15c-.63-.63-1.65.63-2.28 0s-.63-1.65 0-2.28l1.15-1.15-1.15-1.15c-.63-.63-.63-1.65 0-2.28s1.65-.63 2.28 0l1.15 1.15 1.15-1.15c.63-.63 1.65-.63 2.28 0s.63 1.65 0 2.28l-1.15 1.15z" fill="#4285F4"/> </svg> );
const NotebookIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}> <path d="M6 2h10c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 2v16h10V4H6zm2 2h6v2H8V6zm0 4h6v2H8v-2z" fill="#4285F4"/> </svg> );

const allApps = [
    { name: "Calendar", href: "https://calendar.google.com/", icon: CalendarIcon },
    { name: "Chat", href: "https://chat.google.com/", icon: ChatIcon },
    { name: "Contacts", href: "https://contacts.google.com/", icon: ContactsIcon },
    { name: "Docs", href: "https://docs.google.com/", icon: DocsIcon },
    { name: "Drive", href: "https://drive.google.com/", icon: GoogleDriveIcon },
    { name: "Gemini", href: "https://gemini.google.com/app", icon: GeminiIcon },
    { name: "Gmail", href: "https://mail.google.com/", icon: GmailIcon },
    { name: "Keep", href: "https://keep.google.com/", icon: KeepIcon },
    { name: "Maps", href: "https://maps.google.com/", icon: MapsIcon },
    { name: "Meet", href: "https://meet.google.com/", icon: MeetIcon },
    { name: "Notebook LM", href: "https://notebooklm.google.com/", icon: NotebookIcon },
    { name: "Photos", href: "https://photos.google.com/", icon: PhotosIcon },
    { name: "Sheets", href: "https://sheets.google.com/", icon: SheetsIcon },
    { name: "Sites", href: "https://sites.google.com/", icon: SitesIcon },
    { name: "Slides", href: "https://slides.google.com/", icon: SlidesIcon },
];

export function GoogleIntegrationView() {
    const [apps, setApps] = useState(allApps);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        async function loadOrder() {
            if (user) {
                const profile = await getUserProfile(user.uid);
                const savedOrder = profile?.preferences?.googleAppsOrder;
                if (savedOrder && savedOrder.length > 0) {
                    const orderedApps = savedOrder
                        .map(name => allApps.find(app => app.name === name))
                        .filter(Boolean) as typeof allApps;
                    const remainingApps = allApps.filter(app => !savedOrder.includes(app.name));
                    setApps([...orderedApps, ...remainingApps]);
                }
            }
        }
        loadOrder();
    }, [user]);

    const handleSort = (direction: 'asc' | 'desc') => {
        setApps(prev => [...prev].sort((a, b) => {
            return direction === 'asc' 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
        }));
    };
    
    const handleSaveOrder = async () => {
        if (!user) return;
        try {
            const orderToSave = apps.map(app => app.name);
            await updateUserProfile(user.uid, user.email || '', {
                preferences: { googleAppsOrder: orderToSave }
            });
            toast({ title: "App Order Saved" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
    };

    const moveApp = useCallback((dragIndex: number, hoverIndex: number) => {
        setApps(prev => {
            const newApps = [...prev];
            const [draggedItem] = newApps.splice(dragIndex, 1);
            newApps.splice(hoverIndex, 0, draggedItem);
            return newApps;
        });
    }, []);

    return (
        <div className="p-4 sm:p-6 flex flex-col items-center h-full">
            <div className="w-full max-w-2xl space-y-6">
                <Card>
                    <CardHeader className="text-center relative">
                        <CardTitle>Google Workspace Apps</CardTitle>
                        <CardDescription>
                        Drag to reorder, or sort your Google Workspace apps.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                        <div className="flex justify-center gap-2 mb-4">
                            <Button variant="outline" size="sm" onClick={() => handleSort('asc')}><ArrowDownAZ className="mr-2 h-4 w-4" /> A-Z</Button>
                            <Button variant="outline" size="sm" onClick={() => handleSort('desc')}><ArrowUpZA className="mr-2 h-4 w-4" /> Z-A</Button>
                            <Button variant="outline" size="sm" onClick={handleSaveOrder}><Save className="mr-2 h-4 w-4" /> Save Order</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {apps.map((app, index) => (
                            <DraggableAppButton key={app.name} app={app} index={index} moveApp={moveApp} />
                            ))}
                        </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                            <li>This page provides quick shortcuts to your most-used Google Workspace applications.</li>
                            <li><strong>Drag &amp; Drop:</strong> Click and hold any app button to drag it to a new position in the list.</li>
                            <li><strong>Sort:</strong> Use the "A-Z" or "Z-A" buttons to automatically sort the list alphabetically.</li>
                            <li><strong>Save Your Order:</strong> Your custom order is not saved automatically. Click the "Save Order" button to make your changes permanent.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
