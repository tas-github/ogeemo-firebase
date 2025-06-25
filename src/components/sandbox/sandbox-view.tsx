
"use client";

import React, { useState } from 'react';
import {
    Archive, Star, Send, Trash2, Inbox, Pencil, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

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
        subject: 'Welcome to your Sandbox!',
        text: `<p>Hi there,</p><p>This is your sandbox email client. Feel free to experiment here.</p><p>Best,<br/>The Ogeemo Team</p>`,
        date: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false,
        starred: true,
        folder: 'inbox',
      },
       {
        id: 'd1',
        from: 'Dummy Email',
        fromEmail: 'dummy@example.com',
        subject: 'This is a test email',
        text: 'This email was generated for testing purposes.',
        date: new Date().toISOString(),
        read: false,
        starred: false,
        folder: 'inbox',
      },
      {
        id: '2',
        from: 'John Doe',
        fromEmail: 'john.doe@example.com',
        subject: 'Project Phoenix - Weekly Update',
        text: `<p>Hello team,</p><p>Here is the weekly update for Project Phoenix.</p>`,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
        starred: false,
        folder: 'inbox',
      },
      {
        id: '3',
        from: 'You',
        fromEmail: 'you@ogeemo.com',
        subject: 'Re: Design Mockups',
        text: `<p>Hi Jane,</p><p>Thanks for sending these over.</p>`,
        date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        read: true,
        starred: false,
        folder: 'sent',
      },
      {
        id: '4',
        from: 'Important Docs',
        fromEmail: 'archive-bot@ogeemo.com',
        subject: 'Archived: 2023 Financial Report',
        text: '<p>This document has been automatically archived for your records.</p>',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        read: true,
        starred: false,
        folder: 'archive',
      },
];

export function SandboxView() {
  const [emails] = useState<Email[]>(mockEmails);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive' | 'trash' | 'starred'>("inbox");

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
  };

  const filteredEmails = emails.filter((email) => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const matchesSearch =
      email.subject.toLowerCase().includes(lowerCaseQuery) ||
      email.from.toLowerCase().includes(lowerCaseQuery) ||
      email.text.toLowerCase().includes(lowerCaseQuery);

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

  const handleFolderChange = (folder: typeof activeFolder) => {
    setActiveFolder(folder);
    const firstEmailInFolder = emails.find(e => {
        if (folder === "inbox") return e.folder === 'inbox';
        if (folder === "starred") return e.starred && e.folder !== 'trash';
        return e.folder === folder;
    });
    setSelectedEmailId(firstEmailInFolder ? firstEmailInFolder.id : null);
  };

  return (
      <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
            <div className="flex h-full flex-col p-2">
              <div className="p-2">
                 <Button className="w-full" disabled>
                  <Pencil className="mr-2 h-4 w-4" />
                  Compose
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
          <ResizablePanel defaultSize={75} minSize={70}>
            <div className="flex flex-col h-full">
              <div className="p-2 border-b">
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
              <div className="flex-1 overflow-y-auto">
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
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
  );
}
