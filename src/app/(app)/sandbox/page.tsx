
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Archive, Star, Send, Trash2, Inbox, Pencil, Search
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db, auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { LoaderCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to?: string;
  subject: string;
  text: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'archive' | 'spam' | 'trash';
  labels: string[];
}

const appId = process.env.NEXT_PUBLIC_OGEEMO_APP_ID || 'sandbox-app-id';

export default function SandboxPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive' | 'trash' | 'starred'>("inbox");
  const mockDataAddedRef = useRef(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Please provide your Firebase project credentials in the .env file.",
      });
      setIsAuthReady(true);
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: "Could not connect to services.",
          });
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [toast]);

  const addMockData = useCallback(async (uid: string) => {
    if (mockDataAddedRef.current || !db) return;
    mockDataAddedRef.current = true;
    const emailsCollectionRef = collection(db, `artifacts/${appId}/users/${uid}/emails`);
    const mockEmails = [
      {
        from: 'The Ogeemo Team',
        fromEmail: 'team@ogeemo.com',
        to: 'you@ogeemo.com',
        subject: 'Welcome to your Sandbox!',
        text: `<p>Hi there,</p><p>This is your sandbox email client. Feel free to experiment here.</p><p>Best,<br/>The Ogeemo Team</p>`,
        date: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false,
        starred: true,
        folder: 'inbox',
        labels: ['welcome', 'important'],
      },
      {
        from: 'Dummy Email',
        fromEmail: 'dummy@example.com',
        to: 'you@ogeemo.com',
        subject: 'This is a test email',
        text: `<p>This email was generated for testing purposes.</p>`,
        date: new Date().toISOString(),
        read: false,
        starred: false,
        folder: 'inbox',
        labels: ['test'],
      },
      {
        from: 'John Doe',
        fromEmail: 'john.doe@example.com',
        to: 'you@ogeemo.com',
        subject: 'Project Phoenix - Weekly Update',
        text: `<p>Hello team,</p><p>Here is the weekly update for Project Phoenix.</p>`,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
        starred: false,
        folder: 'inbox',
        labels: ['project-phoenix'],
      },
      {
        from: 'You',
        fromEmail: 'you@ogeemo.com',
        to: 'jane.doe@example.com',
        subject: 'Re: Design Mockups',
        text: `<p>Hi Jane,</p><p>Thanks for sending these over.</p>`,
        date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        read: true,
        starred: false,
        folder: 'sent',
        labels: [],
      },
      {
        from: 'Important Docs',
        fromEmail: 'archive-bot@ogeemo.com',
        to: 'you@ogeemo.com',
        subject: 'Archived: 2023 Financial Report',
        text: '<p>This document has been automatically archived for your records.</p>',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        read: true,
        starred: false,
        folder: 'archive',
        labels: [],
      },
    ];

    for (const email of mockEmails) {
      try {
        await addDoc(emailsCollectionRef, email);
      } catch (error) {
        console.error("Error adding mock email:", error);
      }
    }
  }, [appId]);

  useEffect(() => {
    if (!isAuthReady || !userId || !db) {
      if(isAuthReady && !userId) setLoading(false);
      return;
    }

    const emailsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/emails`);
    const q = query(emailsCollectionRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      if (snapshot.empty && !mockDataAddedRef.current) {
        await addMockData(userId);
      } else {
        const fetchedEmails = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Email[];
        setEmails(fetchedEmails);
        
        if (!selectedEmailId && fetchedEmails.length > 0) {
          const firstVisibleEmail = fetchedEmails.find(e => {
              if (activeFolder === "inbox") return e.folder === 'inbox';
              if (activeFolder === "starred") return e.starred && e.folder !== 'trash';
              return e.folder === activeFolder;
          });
          if (firstVisibleEmail) {
            setSelectedEmailId(firstVisibleEmail.id);
          }
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching emails:", error);
      toast({
        variant: "destructive",
        title: "Loading Error",
        description: "Failed to load emails.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, addMockData, toast, activeFolder, selectedEmailId]);

  const handleSelectEmail = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    setSelectedEmailId(emailId);

    if (!email.read && userId && db) {
      const emailRef = doc(db, `artifacts/${appId}/users/${userId}/emails`, emailId);
      await updateDoc(emailRef, { read: true });
    }
  };

  const toggleStarredStatus = async (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    if (!userId || !db) return;
    const emailToUpdate = emails.find(e => e.id === emailId);
    if(emailToUpdate) {
        const emailRef = doc(db, `artifacts/${appId}/users/${userId}/emails`, emailId);
        await updateDoc(emailRef, { starred: !emailToUpdate.starred });
        toast({
          description: `Email ${!emailToUpdate.starred ? 'starred' : 'unstarred'}.`,
        });
    }
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
    { id: "inbox", label: "Inbox", icon: Inbox, count: emails.filter(e => e.folder === 'inbox' && !e.read).length },
    { id: "starred", label: "Starred", icon: Star, count: emails.filter(e => e.starred && e.folder !== 'trash').length },
    { id: "sent", label: "Sent", icon: Send, count: emails.filter(e => e.folder === 'sent').length },
    { id: "archive", label: "Archive", icon: Archive, count: emails.filter(e => e.folder === 'archive').length },
    { id: "trash", label: "Trash", icon: Trash2, count: emails.filter(e => e.folder === 'trash').length },
  ];

  const handleFolderChange = (folder: typeof activeFolder) => {
    setActiveFolder(folder);
    setSelectedEmailId(null);
  };

  return (
    <TooltipProvider delayDuration={0}>
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
                    {item.count > 0 && (
                      <span className="ml-auto text-xs font-normal bg-primary text-primary-foreground rounded-full px-2">
                        {item.count}
                      </span>
                    )}
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
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredEmails.length > 0 ? (
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
                        {new Date(email.date).toLocaleDateString()}
                      </time>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                         <p className="font-medium truncate pr-4 text-sm">{email.subject}</p>
                         <button onClick={(e) => toggleStarredStatus(e, email.id)}>
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
    </TooltipProvider>
  );
}

    