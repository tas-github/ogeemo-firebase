
"use client";

import React, { useState } from 'react';
import { Archive, Star, Trash2, Search, MoreVertical, Reply, ReplyAll, Forward, ChevronDown, Inbox, Send, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    subject: 'Welcome to your OgeeMail Inbox!',
    text: `<p>Hi there,</p><p>This is your new OgeeMail inbox, built to be fast, intelligent, and integrated with the Ogeemo platform.</p><p>You can read, reply, and manage all your emails from this single interface.</p><p>Best,<br/>The Ogeemo Team</p>`,
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
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>('1');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive' | 'trash' | 'starred'>("inbox");


    const handleSelectEmail = (emailId: string) => {
        setSelectedEmailId(emailId);
        setEmails(prevEmails => prevEmails.map(e => e.id === emailId ? { ...e, read: true } : e));
    };

    const selectedEmail = emails.find((email) => email.id === selectedEmailId);

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
        const firstEmailInFolder = emails.find(e => {
            if (folder === "inbox") return e.folder === 'inbox';
            if (folder === "starred") return e.starred && e.folder !== 'trash';
            return e.folder === folder;
        });
        setSelectedEmailId(firstEmailInFolder ? firstEmailInFolder.id : null);
        setSelectedEmailIds([]);
    };


    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <TooltipProvider delayDuration={0}>
                <ResizablePanelGroup direction="horizontal" className="flex-1 items-stretch">
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                        <div className="flex h-full flex-col p-2">
                            <div className="p-2">
                                <Button className="w-full">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Compose
                                </Button>
                            </div>
                            <Separator className="my-2" />
                            <nav className="flex flex-col gap-1 p-2 pt-0">
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
                    <ResizablePanel defaultSize={35} minSize={30}>
                        <div className="flex flex-col h-full">
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

                                <div className="relative ml-auto w-full max-w-xs">
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
                            <div className="overflow-y-auto h-full">
                                {filteredEmails.length > 0 ? (
                                    filteredEmails.map((email) => (
                                        <div
                                            key={email.id}
                                            onClick={() => handleSelectEmail(email.id)}
                                            className={cn(
                                                'flex items-center gap-4 cursor-pointer border-b p-3 transition-colors',
                                                selectedEmailId === email.id ? 'bg-accent' : 'hover:bg-accent/50',
                                                !email.read && 'bg-primary/5'
                                            )}
                                        >
                                            <Checkbox
                                                checked={selectedEmailIds.includes(email.id)}
                                                onCheckedChange={() => handleToggleSelect(email.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                aria-label={`Select email from ${email.from}`}
                                            />
                                            <div className="flex-1 grid gap-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <p className={cn('font-semibold text-sm truncate', !email.read && 'font-bold text-primary')}>{email.from}</p>
                                                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(email.date).toLocaleDateString()}
                                                    </time>
                                                </div>
                                                <p className="font-medium truncate text-sm">{email.subject}</p>
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {email.text.replace(/<[^>]+>/g, '').substring(0, 100)}
                                                </p>
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
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={45} minSize={40}>
                        <div className="flex flex-col h-full">
                        {selectedEmail ? (
                            <>
                                <div className="flex items-center p-2 border-b">
                                    <div className="flex items-center gap-1">
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Archive className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Archive</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip>
                                    </div>
                                    <Separator orientation="vertical" className="mx-1 h-6" />
                                    <div className="flex items-center gap-1 ml-auto">
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Reply className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Reply</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><ReplyAll className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Reply All</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Forward className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Forward</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>More</p></TooltipContent></Tooltip>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 overflow-y-auto">
                                    <div className="flex items-start justify-between">
                                        <h2 className="text-xl font-bold mb-2">{selectedEmail.subject}</h2>
                                        <button><Star className={cn('h-5 w-5 text-muted-foreground transition-colors hover:text-yellow-500', selectedEmail.starred && 'fill-yellow-400 text-yellow-500')} /></button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10"><AvatarFallback>{selectedEmail.from.charAt(0)}</AvatarFallback></Avatar>
                                        <div className="grid gap-0.5">
                                            <p className="font-semibold">{selectedEmail.from}</p>
                                            <p className="text-xs text-muted-foreground">{`<${selectedEmail.fromEmail}>`}</p>

                                        </div>
                                        <div className="ml-auto text-xs text-muted-foreground">{new Date(selectedEmail.date).toLocaleString()}</div>
                                    </div>
                                    <Separator className="my-4" />
                                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.text }} />
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
                                <p>Select an email to read</p>
                            </div>
                        )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </TooltipProvider>
        </div>
    );
}
