
"use client";

import React, { useState, useEffect } from 'react';
import { Archive, Star, Trash2, Search, MoreVertical, Reply, ReplyAll, Forward, ChevronDown, Inbox, Send, Pencil, Mic } from 'lucide-react';
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


interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  text: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'archive' | 'trash';
}

const mockEmails: Email[] = [
  {
    id: '1',
    from: 'The Ogeemo Team',
    fromEmail: 'team@ogeemo.com',
    subject: 'Tips for OgeeMail',
    text: `<p>Hi there,</p><p>Here are a few tips to get you started with OgeeMail:</p><ul><li>Use the left-hand menu to navigate between folders.</li><li>Select multiple emails using the checkboxes to perform bulk actions.</li><li>Resize the panels to customize your view.</li></ul><p>Enjoy!<br/>The Ogeemo Team</p>`,
    date: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    starred: true,
    folder: 'inbox',
  },
  {
    id: '2',
    from: 'John Doe',
    fromEmail: 'john.doe@example.com',
    subject: 'Project Phoenix - Weekly Update',
    text: `<p>Hello team,</p><p>Here is the weekly update for Project Phoenix. We have made significant progress on the frontend components and are on track to meet our Q3 goals.</p><p>Please review the attached documents and provide your feedback by EOD Friday.</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: '3',
    from: 'Jane Smith',
    fromEmail: 'jane.smith@designco.com',
    subject: 'New Design Mockups for Review',
    text: `<p>Hi team,</p><p>I've attached the latest design mockups for the new dashboard. I'm really excited about the direction this is heading. Looking forward to your thoughts!</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: false,
    starred: false,
    folder: 'inbox',
  },
  {
    id: '4',
    from: 'Cloud Services',
    fromEmail: 'no-reply@cloud.com',
    subject: 'Your monthly invoice is ready',
    text: `<p>Your invoice for the month of May is now available. Total amount due: $42.50.</p><p>Thank you for using our services.</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    read: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 'sent-1',
    from: 'You',
    fromEmail: 'you@ogeemo.com',
    subject: 'Re: Project Phoenix - Weekly Update',
    text: `<p>Thanks John, looks great.</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    read: true,
    starred: false,
    folder: 'sent',
  },
  {
    id: 'archive-1',
    from: 'Old Project Newsletter',
    fromEmail: 'newsletter@archive.com',
    subject: 'Final project report',
    text: `<p>This project is now archived.</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    read: true,
    starred: false,
    folder: 'archive',
  },
  {
    id: 'trash-1',
    from: 'Spam Co',
    fromEmail: 'spam@spam.com',
    subject: 'You have won!',
    text: `<p>Click here to claim your prize!</p>`,
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: true,
    starred: false,
    folder: 'trash',
  },
];


export default function OgeeMailInboxPage() {
    const [emails, setEmails] = useState<Email[]>(mockEmails);
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive' | 'trash' | 'starred'>("inbox");
    const { toast } = useToast();

    const { isListening, startListening, stopListening, isSupported } =
        useSpeechToText({
        onTranscript: (transcript) => {
            setSearchQuery(transcript);
        },
    });

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
        <div className="relative p-4 sm:p-6 flex flex-col h-full bg-background overflow-hidden space-y-4">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
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
             <header className="text-center">
                <h1 className="text-3xl font-bold font-headline text-primary">OgeeMail</h1>
                <p className="text-muted-foreground">
                    This is your new OgeeMail app, built to be fast, intelligent, and integrated with the Ogeemo platform.
                </p>
            </header>
            <div className="flex-1 min-h-0">
                <TooltipProvider delayDuration={0}>
                    <div className="h-full flex flex-col border rounded-lg overflow-hidden">
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
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className={cn(
                                        "h-8 w-8 flex-shrink-0",
                                        isListening && "text-destructive animate-pulse"
                                    )}
                                    onClick={isListening ? stopListening : startListening}
                                    disabled={isSupported === false}
                                    title={
                                        isSupported === false
                                        ? "Voice input not supported"
                                        : isListening
                                        ? "Stop listening"
                                        : "Search with voice"
                                    }
                                >
                                    <Mic className="h-4 w-4" />
                                    <span className="sr-only">Search with voice</span>
                                </Button>
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
                                                    {new Date(email.date).toLocaleDateString()}
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
            </div>
        </div>
    );
}
