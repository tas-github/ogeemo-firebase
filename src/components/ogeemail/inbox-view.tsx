
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Archive, Star, Trash2, Search, MoreVertical, Reply, ReplyAll, Forward, Inbox, Send, Pencil, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { type Email, mockEmails } from '@/data/emails';
import { ScrollArea } from '../ui/scroll-area';


export function OgeeMailInboxView() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive' | 'trash' | 'starred'>("inbox");
    
    useEffect(() => {
        setEmails(mockEmails);
        if (mockEmails.length > 0) {
            const firstInboxEmail = mockEmails.find(e => e.folder === 'inbox');
            setSelectedEmailId(firstInboxEmail ? firstInboxEmail.id : null);
        }
    }, []);

    const handleSelectEmail = (emailId: string) => {
        setSelectedEmailId(emailId);
        setEmails(prevEmails => prevEmails.map(e => e.id === emailId ? { ...e, read: true } : e));
    };

    const filteredEmails = emails.filter((email) => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const matchesSearch = email.subject.toLowerCase().includes(lowerCaseQuery) ||
               email.from.toLowerCase().includes(lowerCaseQuery);

        if (!matchesSearch) return false;

        if (activeFolder === "inbox") return email.folder === 'inbox';
        if (activeFolder === "starred") return email.starred && email.folder !== 'trash';
        if (activeFolder === "sent") return email.folder === 'sent';
        if (activeFolder === "archive") return email.folder === 'archive';
        if (activeFolder === "trash") return email.folder === 'trash';
        return false;
    });
    
    const menuItems = [
        { id: "inbox", label: "Inbox", icon: Inbox },
        { id: "starred", label: "Starred", icon: Star },
        { id: "sent", label: "Sent", icon: Send },
        { id: "archive", label: "Archive", icon: Archive },
        { id: "trash", label: "Trash", icon: Trash2 },
    ];

    const tips = [
        "Use the left-hand menu to navigate between folders.",
        "Select multiple emails using the checkboxes to perform bulk actions.",
        "Resize the panels to customize your view.",
    ];

    const handleFolderChange = (folder: typeof activeFolder) => {
        setActiveFolder(folder);
        setSelectedEmailId(null);
    };

    const selectedEmail = emails.find(e => e.id === selectedEmailId);

    return (
        <div className="p-4 sm:p-6 flex flex-col h-full bg-background overflow-hidden">
            <header className="text-center pb-4">
                <h1 className="text-3xl font-bold font-headline text-primary">OgeeMail</h1>
                <p className="text-muted-foreground">
                    This is your new OgeeMail app, built to be fast, intelligent, and integrated with the Ogeemo platform.
                </p>
            </header>
            <div className="flex-1 min-h-0">
                <ResizablePanelGroup direction="horizontal" className="h-full max-h-full rounded-lg border">
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                        <div className="flex h-full flex-col p-2">
                            <div className="p-2">
                            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                                <Link href="/ogeemail/compose">
                                <Pencil className="mr-2 h-4 w-4" />
                                Compose
                                </Link>
                            </Button>
                            </div>
                            <Separator />
                            <nav className="flex flex-col gap-1 p-2">
                            {menuItems.map((item) => (
                                <Button
                                key={item.id}
                                variant={activeFolder === item.id ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3"
                                onClick={() => handleFolderChange(item.id as any)}
                                >
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                                </Button>
                            ))}
                            </nav>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={80} minSize={30}>
                    <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={45} minSize={30}>
                                <TooltipProvider delayDuration={0}>
                                    <div className="h-full flex flex-col">
                                        <div className="flex items-center gap-2 p-2 border-b">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="search"
                                                    placeholder="Search mail..."
                                                    className="w-full rounded-lg bg-muted pl-8"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Lightbulb className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuLabel>OgeeMail Tips</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    {tips.map((tip, index) => (
                                                        <DropdownMenuItem key={index} className="text-wrap">
                                                            {tip}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <ScrollArea className="flex-1">
                                            {filteredEmails.length > 0 ? (
                                                filteredEmails.map((email) => (
                                                    <div
                                                        key={email.id}
                                                        onClick={() => handleSelectEmail(email.id)}
                                                        className={cn(
                                                            'cursor-pointer border-b p-4 transition-colors',
                                                            selectedEmailId === email.id ? 'bg-accent' : 'hover:bg-accent/50',
                                                            !email.read && 'bg-primary/5'
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <p className={cn('font-semibold text-sm truncate', !email.read && 'text-primary')}>{email.from}</p>
                                                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                                                                {format(new Date(email.date), 'MM/dd/yyyy')}
                                                            </time>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <p className="font-medium truncate pr-4 text-sm">{email.subject}</p>
                                                            <button>
                                                                <Star
                                                                    className={cn('h-4 w-4 text-muted-foreground transition-colors shrink-0 hover:text-yellow-500', email.starred && 'fill-yellow-400 text-yellow-500')}
                                                                />
                                                            </button>
                                                        </div>
                                                        <p className="truncate text-sm text-muted-foreground mt-1">
                                                            {email.text.replace(/<[^>]+>/g, '')}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
                                                    <p>No emails in {activeFolder}.</p>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                </TooltipProvider>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={55} minSize={30}>
                            <div className="h-full flex flex-col">
                                {selectedEmail ? (
                                    <>
                                    <div className="flex items-center justify-between p-4 border-t">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={`https://i.pravatar.cc/40?u=${selectedEmail.fromEmail}`} />
                                            <AvatarFallback>{selectedEmail.from.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{selectedEmail.from}</p>
                                            <p className="text-xs text-muted-foreground">{selectedEmail.fromEmail}</p>
                                        </div>
                                    </div>
                                        <div className="flex items-center gap-1">
                                            <TooltipProvider>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Reply className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Reply</p></TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><ReplyAll className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Reply All</p></TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Forward className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Forward</p></TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Archive className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Archive</p></TooltipContent></Tooltip>
                                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip>
                                            </TooltipProvider>
                                    </div>
                                    </div>
                                    <div className="p-4 border-t">
                                        <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
                                        <p className="text-sm text-muted-foreground mt-1">Date: {format(new Date(selectedEmail.date), 'PPpp')}</p>
                                    </div>
                                    <ScrollArea className="flex-1 p-4 border-t">
                                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.text }} />
                                    </ScrollArea>
                                    </>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        <p>Select an email to read</p>
                                    </div>
                                )}
                                </div>
                            </ResizablePanel>
                    </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
