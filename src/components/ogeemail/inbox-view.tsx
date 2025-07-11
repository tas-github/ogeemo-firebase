
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Archive, Star, Trash2, Search, MoreVertical, Reply, ReplyAll, Forward, ChevronDown, Inbox, Send, Pencil, Mic, Folder, Users, Briefcase, Book, Lightbulb, ListTodo, Mail, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { useToast } from '@/hooks/use-toast';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { format } from 'date-fns';
import { type Email, mockEmails } from '@/data/emails';

export function OgeeMailInboxView() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive' | 'trash' | 'starred'>("inbox");
    const [aiCommand, setAiCommand] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        setEmails(mockEmails);
        if (mockEmails.length > 0) {
            const firstInboxEmail = mockEmails.find(e => e.folder === 'inbox');
            setSelectedEmailId(firstInboxEmail ? firstInboxEmail.id : null);
        }
    }, []);

    const { 
        isListening: isAiListening, 
        startListening: startAiListening, 
        stopListening: stopAiListening, 
        isSupported 
    } = useSpeechToText({
        onTranscript: (transcript) => {
            setAiCommand(transcript);
        },
    });

    const prevIsAiListeningRef = useRef<boolean>();
    useEffect(() => {
        if (prevIsAiListeningRef.current && !isAiListening && aiCommand.trim()) {
        toast({
            title: "AI Command",
            description: `Processing: "${aiCommand}"`,
        });
        console.log(`AI Command captured: ${aiCommand}`);
        setAiCommand('');
        }
        prevIsAiListeningRef.current = isAiListening;
    }, [isAiListening, aiCommand, toast]);

    useEffect(() => {
        if (isSupported === false) {
        toast({
            variant: "destructive",
            title: "Voice Input Not Supported",
            description: "Your browser does not support the Web Speech API.",
        });
        }
    }, [isSupported, toast]);

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

    const handleToggleSelect = (emailId: string) => {
        setSelectedEmailIds(prev =>
            prev.includes(emailId)
                ? prev.filter(id => id !== emailId)
                : [...prev, emailId]
        );
    };

    const handleSelectAllVisible = () => setSelectedEmailIds(filteredEmails.map(e => e.id));
    const handleSelectNone = () => setSelectedEmailIds([]);
    const handleSelectRead = () => setSelectedEmailIds(filteredEmails.filter(e => e.read).map(e => e.id));
    const handleSelectUnread = () => setSelectedEmailIds(filteredEmails.filter(e => !e.read).map(e => e.id));

    const allVisibleSelected = filteredEmails.length > 0 && selectedEmailIds.length === filteredEmails.length;
    const someVisibleSelected = selectedEmailIds.length > 0 && selectedEmailIds.length < filteredEmails.length;
    
    const menuItems = [
        { id: "inbox", label: "Inbox", icon: Inbox },
        { id: "starred", label: "Starred", icon: Star },
        { id: "sent", label: "Sent", icon: Send },
        { id: "archive", label: "Archive", icon: Archive },
        { id: "trash", label: "Trash", icon: Trash2 },
    ];

    const handleFolderChange = (folder: typeof activeFolder) => {
        setActiveFolder(folder);
        setSelectedEmailId(null);
        setSelectedEmailIds([]);
    };

    const selectedEmail = emails.find(e => e.id === selectedEmailId);

    return (
        <div className="p-4 sm:p-6 flex flex-col h-full bg-background overflow-hidden">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>Getting started with OgeeMail</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 p-4" align="end">
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                                <Avatar>
                                    <AvatarFallback>T</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">The Ogeemo Team</p>
                                    <p className="text-xs text-muted-foreground">&lt;team@ogeemo.com&gt;</p>
                                </div>
                                <p className="text-xs text-muted-foreground ml-auto">
                                    {new Date('6/21/2025, 9:27:19 AM').toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </p>
                             </div>
                             <Separator />
                             <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                <p>Hi there,</p>
                                <p>Welcome to your new inbox! Here are a few tips to get you started:</p>
                                <ul>
                                    <li>Use the left-hand menu to navigate between folders.</li>
                                    <li>Select multiple emails using the checkboxes to perform bulk actions.</li>
                                    <li>Resize the panels to customize your view.</li>
                                </ul>
                                <p>Enjoy!<br />The Ogeemo Team</p>
                             </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
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
                            <Button asChild className="w-full">
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
                    <ResizablePanel defaultSize={80}>
                        <TooltipProvider delayDuration={0}>
                            <div className="h-full flex flex-col">
                                <div className="flex items-center gap-4 p-2 border-b">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 pl-2 pr-1.5">
                                                <Checkbox
                                                    checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                                                    className="mr-2"
                                                    readOnly
                                                />
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={handleSelectAllVisible}>All</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={handleSelectNone}>None</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={handleSelectRead}>Read</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={handleSelectUnread}>Unread</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {selectedEmailIds.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Archive className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Archive</p></TooltipContent></Tooltip>
                                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip>
                                        </div>
                                    )}
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className={cn(
                                                    "h-8 w-8 flex-shrink-0",
                                                    isAiListening && "text-destructive"
                                                )}
                                                onClick={isAiListening ? stopAiListening : startAiListening}
                                                disabled={isSupported === false}
                                            >
                                                {isAiListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                                <span className="sr-only">Use AI Assistant</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{isSupported === false ? "Voice not supported" : (isAiListening ? "Stop listening" : "Ask AI Assistant")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <div className="ml-auto flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Search mail..."
                                                className="w-full rounded-lg bg-muted pl-8"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-y-auto h-full">
                                    {filteredEmails.length > 0 ? (
                                        filteredEmails.map((email) => (
                                            <div
                                                key={email.id}
                                                onClick={() => handleSelectEmail(email.id)}
                                                className={cn(
                                                    'flex items-start gap-4 cursor-pointer border-b p-3 transition-colors hover:bg-accent/50',
                                                    !email.read && 'bg-primary/5'
                                                )}
                                            >
                                                <Checkbox
                                                    checked={selectedEmailIds.includes(email.id)}
                                                    onCheckedChange={() => handleToggleSelect(email.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    aria-label={`Select email from ${email.from}`}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 grid gap-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <p className={cn('font-semibold text-sm truncate', !email.read && 'font-bold text-primary')}>{email.from}</p>
                                                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {format(new Date(email.date), 'MM/dd/yyyy')}
                                                        </time>
                                                    </div>
                                                    <p className="font-medium truncate text-sm">{email.subject}</p>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="truncate text-sm text-muted-foreground">
                                                            {email.text.replace(/<[^>]+>/g, '').substring(0, 80)}...
                                                        </p>
                                                        <div className="flex items-center shrink-0">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); console.log('Reply to', email.id); }}>
                                                                        <Reply className="h-4 w-4" />
                                                                        <span className="sr-only">Reply</span>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Reply</p></TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); console.log('Reply All to', email.id); }}>
                                                                        <ReplyAll className="h-4 w-4" />
                                                                        <span className="sr-only">Reply All</span>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Reply All</p></TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); console.log('Forward', email.id); }}>
                                                                        <Forward className="h-4 w-4" />
                                                                        <span className="sr-only">Forward</span>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Forward</p></TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
                                            <p>No emails in {activeFolder}.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TooltipProvider>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}
