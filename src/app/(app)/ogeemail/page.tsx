"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Archive, Star, Send, Trash2, Inbox, FileText, Pencil, Search, MoreVertical, CornerUpLeft
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db, auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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

const appId = process.env.NEXT_PUBLIC_OGEEMO_APP_ID || 'default-app-id';

export default function OgeeMailPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newEmail, setNewEmail] = useState({ to: '', subject: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive' | 'trash' | 'starred'>("inbox");
  const mockDataAddedRef = useRef(false);

  const { toast } = useToast();

  useEffect(() => {
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
    if (mockDataAddedRef.current) return;
    mockDataAddedRef.current = true;
    const emailsCollectionRef = collection(db, `artifacts/${appId}/users/${uid}/emails`);
    const mockEmails = [
      {
        from: 'The Ogeemo Team',
        fromEmail: 'team@ogeemo.com',
        to: 'you@ogeemo.com',
        subject: 'Welcome to your new Inbox!',
        text: `<p>Hi there,</p><p>Welcome to OgeeMail, the most intuitive and powerful email client for modern teams. We're thrilled to have you on board.</p><p>You can start by exploring the interface, composing a new email, or organizing your inbox with labels. If you have any questions, feel free to reach out to our support team.</p><p>Best,<br/>The Ogeemo Team</p>`,
        date: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        read: false,
        starred: true,
        folder: 'inbox',
        labels: ['welcome', 'important'],
      },
      {
        from: 'John Doe',
        fromEmail: 'john.doe@example.com',
        to: 'you@ogeemo.com',
        subject: 'Project Phoenix - Weekly Update',
        text: `<p>Hello team,</p><p>Here is the weekly update for Project Phoenix:</p><ul><li>Frontend development is 80% complete.</li><li>Backend APIs are now fully integrated.</li><li>User testing is scheduled for next Wednesday.</li></ul><p>Please review the attached document for the full report. Let's sync up on Monday to discuss next steps.</p><p>Regards,<br/>John</p>`,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
        starred: false,
        folder: 'inbox',
        labels: ['project-phoenix'],
      },
      {
        from: 'Automated Calendar',
        fromEmail: 'calendar-noreply@ogeemo.com',
        to: 'you@ogeemo.com',
        subject: 'Reminder: Q3 Planning Session',
        text: `<p>This is a reminder for your upcoming meeting:</p><p><strong>Event:</strong> Q3 Planning Session<br/><strong>Date:</strong> Tomorrow, 10:00 AM<br/><strong>Location:</strong> Conference Room 4B</p><p>Please be prepared to discuss your department's goals for the next quarter.</p>`,
        date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        read: false,
        starred: false,
        folder: 'inbox',
        labels: ['meeting'],
      },
      {
        from: 'Ogeemo Newsletter',
        fromEmail: 'newsletter@ogeemo.com',
        to: 'you@ogeemo.com',
        subject: 'This Week in AI: The Latest Trends',
        text: `<p>Don't miss the latest edition of our newsletter, packed with insights on AI, productivity, and the future of work. This week, we explore the impact of generative models on creative industries.</p><p><a href="#">Read more here.</a></p>`,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        read: true,
        starred: false,
        folder: 'inbox',
        labels: ['newsletter'],
      },
      {
        from: 'You',
        fromEmail: 'you@ogeemo.com',
        to: 'jane.doe@example.com',
        subject: 'Re: Design Mockups',
        text: `<p>Hi Jane,</p><p>Thanks for sending these over. The new mockups look great! I've left a few comments on the Figma file.</p><p>Let's proceed with this direction.</p><p>Best,<br/>You</p>`,
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
    if (!isAuthReady || !userId) {
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

        // Update selected email if it's still in the list
        if (selectedEmailId) {
          const updatedSelected = fetchedEmails.find(e => e.id === selectedEmailId);
          setSelectedEmail(updatedSelected || null);
        } else if (fetchedEmails.length > 0) {
          // Default to selecting the first email if none is selected
          const firstEmail = fetchedEmails.find(e => e.folder === activeFolder) || fetchedEmails[0];
          if(firstEmail) {
            setSelectedEmail(firstEmail);
            setSelectedEmailId(firstEmail.id);
          }
        } else {
          // No emails, so clear selection
          setSelectedEmail(null);
          setSelectedEmailId(null);
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
  }, [isAuthReady, userId, addMockData, selectedEmailId, toast, activeFolder]);

  const handleSelectEmail = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    setSelectedEmailId(emailId);
    setSelectedEmail(email);

    if (!email.read && userId) {
      const emailRef = doc(db, `artifacts/${appId}/users/${userId}/emails`, emailId);
      await updateDoc(emailRef, { read: true });
    }
  };

  const toggleStarredStatus = async (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    if (!userId) return;
    const emailToUpdate = emails.find(e => e.id === emailId);
    if(emailToUpdate) {
        const emailRef = doc(db, `artifacts/${appId}/users/${userId}/emails`, emailId);
        await updateDoc(emailRef, { starred: !emailToUpdate.starred });
        toast({
          title: "Status Updated",
          description: `Email ${!emailToUpdate.starred ? 'starred' : 'unstarred'}`,
        });
    }
  };

  const handleSendEmail = async () => {
    if (!userId) return;
    if (!newEmail.to || !newEmail.subject || !newEmail.text) {
      toast({
        variant: "destructive",
        title: 'Missing Fields',
        description: 'Please fill in To, Subject, and Content.',
      });
      return;
    }
    const emailsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/emails`);
    try {
      await addDoc(emailsCollectionRef, {
        from: 'You',
        fromEmail: 'you@ogeemo.com',
        to: newEmail.to,
        subject: newEmail.subject,
        text: newEmail.text,
        date: new Date().toISOString(),
        read: true,
        starred: false,
        folder: 'sent',
        labels: [],
      });
      setNewEmail({ to: '', subject: '', text: '' });
      setIsComposeOpen(false);
      toast({
        title: "Success",
        description: "Email sent successfully!",
      });
    } catch (error) {
      console.error("Error sending email: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send email.",
      });
    }
  };

  const filteredEmails = emails.filter((email) => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const matchesSearch =
      email.subject.toLowerCase().includes(lowerCaseQuery) ||
      email.from.toLowerCase().includes(lowerCaseQuery) ||
      email.text.toLowerCase().includes(lowerCaseQuery);

    if (activeFolder === "inbox") return matchesSearch && email.folder === 'inbox';
    if (activeFolder === "starred") return matchesSearch && email.starred && email.folder !== 'trash';
    if (activeFolder === "sent") return matchesSearch && email.folder === 'sent';
    if (activeFolder === "archive") return matchesSearch && email.folder === 'archive';
    if (activeFolder === "trash") return matchesSearch && email.folder === 'trash';
    return false;
  });

  const getAvatarFallback = (from: string) => from?.charAt(0).toUpperCase() || 'U';

  const menuItems = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: emails.filter(e => e.folder === 'inbox' && !e.read).length },
    { id: "starred", label: "Starred", icon: Star, count: emails.filter(e => e.starred && e.folder !== 'trash').length },
    { id: "sent", label: "Sent", icon: Send, count: emails.filter(e => e.folder === 'sent').length },
    { id: "archive", label: "Archive", icon: Archive, count: emails.filter(e => e.folder === 'archive').length },
    { id: "trash", label: "Trash", icon: Trash2, count: emails.filter(e => e.folder === 'trash').length },
  ];

  const handleFolderChange = (folder: typeof activeFolder) => {
    setActiveFolder(folder);
    const firstEmailInFolder = emails.find(e => e.folder === folder);
    if(firstEmailInFolder){
        handleSelectEmail(firstEmailInFolder.id);
    } else {
        setSelectedEmailId(null);
        setSelectedEmail(null);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center border-b px-4 md:px-6">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-xl font-bold font-headline text-primary">OgeeMail</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search mail..."
                            className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[300px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => setIsComposeOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Compose
                    </Button>
                </div>
            </div>
        </header>

        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          {/* Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
            <div className="flex h-full flex-col p-2">
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
          
          {/* Email List */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="flex flex-col overflow-y-auto h-full">
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
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Email Content */}
          <ResizablePanel defaultSize={45}>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 h-full">
              {selectedEmail ? (
                <div>
                  <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                              <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedEmail.fromEmail}`} alt={selectedEmail.from} />
                              <AvatarFallback>{getAvatarFallback(selectedEmail.from)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                              <p className="font-semibold">{selectedEmail.from}</p>
                              <p className="text-sm text-muted-foreground">To: {selectedEmail.to || 'You <you@ogeemo.com>'}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <time>{new Date(selectedEmail.date).toLocaleString()}</time>
                          <Button variant="ghost" size="icon" title="Reply"><CornerUpLeft className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title="More"><MoreVertical className="h-4 w-4" /></Button>
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold my-4">{selectedEmail.subject}</h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.text }} />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Inbox className="h-16 w-16" />
                  <p className="mt-4 text-lg">Select an email to read</p>
                  <p className="text-sm">Nothing selected</p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Compose Dialog */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Compose New Mail</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="To" value={newEmail.to} onChange={(e) => setNewEmail(p => ({...p, to: e.target.value}))} />
                <Input placeholder="Subject" value={newEmail.subject} onChange={(e) => setNewEmail(p => ({...p, subject: e.target.value}))} />
                <Textarea
                  placeholder="Type your message here..."
                  className="min-h-[300px] resize-none"
                  value={newEmail.text}
                  onChange={(e) => setNewEmail(p => ({...p, text: e.target.value}))}
                />
            </div>
            <DialogFooter>
                <Button onClick={() => setIsComposeOpen(false)} variant="outline">Cancel</Button>
                <Button onClick={handleSendEmail}>Send</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
