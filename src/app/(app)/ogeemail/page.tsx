
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Archive, Bold, Italic, Underline, Strikethrough, List, Link2, AlignLeft, AlignCenter, AlignRight,
    Highlighter, Mic, Mail, Inbox, Star, Send, FileText, Trash2, RefreshCw,
    Search, Paperclip, X, Pencil, CornerUpLeft, CornerUpRight, LoaderCircle, Settings, MoreVertical
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db, auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Email {
  id: string; 
  subject: string;
  from: string;
  to: string;
  content: string;
  isRead: boolean;
  isStarred: boolean;
  receivedAt: string;
  folder: string;
  isArchived: boolean;
  hasAttachments: boolean;
  tags?: string[];
  cc?: string;
  bcc?: string;
}

const appId = process.env.NEXT_PUBLIC_OGEEMO_APP_ID || 'default-app-id';

export default function OgeeMailPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newEmail, setNewEmail] = useState({ to: '', subject: '', content: '', cc: '', bcc: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const mockDataAddedRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  const showAppToast = useCallback((title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
    });
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          showAppToast("Authentication Failed", "Could not connect to services.", "destructive");
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [showAppToast]);
  
  const addMockData = useCallback(async (uid: string) => {
    if (mockDataAddedRef.current) return;
    mockDataAddedRef.current = true;
    const emailsCollectionRef = collection(db, `artifacts/${appId}/users/${uid}/emails`);
    const mockEmails = [
      { subject: 'Welcome to Ogeemo Mail!', from: 'support@ogeemo.com', to: 'you@ogeemo.com', content: '<p>Hello!</p><p>Welcome to your new, intuitive email experience. We are excited to have you on board. Explore the features and let us know if you have any questions.</p><p>Best,<br>The Ogeemo Team</p>', isRead: false, isStarred: true, receivedAt: new Date(Date.now() - 3600000).toISOString(), folder: "inbox", isArchived: false, hasAttachments: false, tags: ['welcome', 'important'] },
      { subject: 'Your Weekly Digest', from: 'updates@ogeemo.com', to: 'you@ogeemo.com', content: 'Here are the latest updates from Ogeemo. This week, we launched a new feature that allows you to integrate your calendar directly into your workflow. Check it out now!', isRead: true, isStarred: false, receivedAt: new Date(Date.now() - 86400000 * 2).toISOString(), folder: "inbox", isArchived: false, hasAttachments: false, tags: ['update'] },
      { subject: 'Project Alpha Sync', from: 'calendar@ogeemo.com', to: 'you@ogeemo.com', content: 'Reminder: Project Alpha sync meeting today at 2 PM. Please find the agenda attached.', isRead: false, isStarred: false, receivedAt: new Date(Date.now() - 1800000).toISOString(), folder: "inbox", isArchived: false, hasAttachments: true, tags: ['meeting'] },
      { subject: "Re: Budget Approval", from: "you@ogeemo.com", to: "finance@corp.com", content: "Thanks, approved.", isRead: true, isStarred: false, receivedAt: new Date(Date.now() - 86400000).toISOString(), folder: "sent", isArchived: false, hasAttachments: false, tags: ['project'] },
      { subject: 'Archived Important Document', from: 'legal@ogeemo.com', to: 'you@ogeemo.com', content: 'This is an important document for your records.', isRead: true, isStarred: false, receivedAt: new Date(Date.now() - 86400000 * 5).toISOString(), folder: "inbox", isArchived: true, hasAttachments: true, tags: ['legal'] },
    ];
    for (const email of mockEmails) {
      try {
        await addDoc(emailsCollectionRef, email);
      } catch (error) {
        console.error("Error adding mock email:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      if(isAuthReady && !userId) setLoading(false);
      return;
    }
  
    const emailsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/emails`);
    const q = query(emailsCollectionRef, orderBy('receivedAt', 'desc'));
  
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      if (snapshot.empty && !mockDataAddedRef.current) {
        await addMockData(userId);
      } else {
        const fetchedEmails: Email[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Email, 'id'>
        }));
        setEmails(fetchedEmails);
        
        // Update selected email if it's still in the list, otherwise clear it
        if (selectedEmail) {
            const updatedSelected = fetchedEmails.find(e => e.id === selectedEmail.id);
            setSelectedEmail(updatedSelected || null);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching emails:", error);
      showAppToast("Loading Error", "Failed to load emails.", "destructive");
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [isAuthReady, userId, showAppToast, addMockData, selectedEmail]);


  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead && userId) {
      const emailRef = doc(db, `artifacts/${appId}/users/${userId}/emails`, email.id);
      await updateDoc(emailRef, { isRead: true });
    }
  }

  const toggleStarredStatus = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!db || !userId) return;
    const emailToUpdate = emails.find(e => e.id === id);
    if(emailToUpdate) {
        const emailRef = doc(db, `artifacts/${appId}/users/${userId}/emails`, id);
        await updateDoc(emailRef, { isStarred: !emailToUpdate.isStarred });
        showAppToast("Status Updated", `Email ${!emailToUpdate.isStarred ? 'starred' : 'unstarred'}`);
    }
  };
  
  const handleSendEmail = async () => {
    if (!db || !userId) return;
    if (!newEmail.to || !newEmail.subject || !newEmail.content) {
      showAppToast('Missing Fields', 'Please fill in To, Subject, and Content.', "destructive");
      return;
    }
    const emailsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/emails`);
    await addDoc(emailsCollectionRef, {
      ...newEmail,
      from: 'you@ogeemo.com',
      isRead: true, isStarred: false,
      receivedAt: new Date().toISOString(),
      folder: 'sent',
      isArchived: false, hasAttachments: false,
    });
    setNewEmail({ to: '', subject: '', content: '', cc: '', bcc: '' });
    if (contentRef.current) contentRef.current.innerHTML = '';
    setIsComposeOpen(false);
    showAppToast("Success", "Email sent successfully!");
  };

  const filteredEmails = emails.filter((email: Email) => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const matchesSearch = email.subject.toLowerCase().includes(lowerCaseQuery) ||
                          email.from.toLowerCase().includes(lowerCaseQuery) ||
                          email.content.toLowerCase().includes(lowerCaseQuery);
    
    if (activeFolder === "inbox") return matchesSearch && !email.isArchived && email.folder !== 'sent';
    if (activeFolder === "starred") return matchesSearch && email.isStarred;
    if (activeFolder === "sent") return matchesSearch && email.folder === 'sent';
    if (activeFolder === "archive") return matchesSearch && email.isArchived;
    if (activeFolder === "trash") return false; 
    return false;
  });

  const menuItems = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: emails.filter(e => !e.isRead && !e.isArchived && e.folder !== 'sent').length },
    { id: "starred", label: "Starred", icon: Star, count: emails.filter(e => e.isStarred).length },
    { id: "sent", label: "Sent", icon: Send, count: emails.filter(e => e.folder === 'sent').length },
    { id: "archive", label: "Archive", icon: Archive, count: emails.filter(e => e.isArchived).length },
    { id: "trash", label: "Trash", icon: Trash2, count: 0 }
  ];
  
  const getAvatarFallback = (from: string) => {
    return from?.charAt(0).toUpperCase() || 'U';
  }


  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
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

        <div className="grid min-h-0 flex-1 md:grid-cols-[260px_400px_1fr]">
            {/* Sidebar */}
            <div className="hidden flex-col border-r bg-muted/40 p-4 md:flex">
                <nav className="flex flex-col gap-1">
                    {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveFolder(item.id)}
                        className={cn(
                        'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        activeFolder === item.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                    >
                        <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        </div>
                        {item.count > 0 && (
                        <span className={cn('px-2 text-xs rounded-full', activeFolder === item.id ? "bg-primary-foreground text-primary" : "bg-muted-foreground/20")}>
                            {item.count}
                        </span>
                        )}
                    </button>
                    ))}
                </nav>
            </div>

            {/* Email List */}
            <div className="flex flex-col overflow-y-auto border-r">
                <div className="border-b p-4">
                    <h2 className="text-lg font-semibold capitalize">{activeFolder}</h2>
                    <p className="text-sm text-muted-foreground">{filteredEmails.length} emails</p>
                </div>
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredEmails.length > 0 ? (
                    filteredEmails.map((email) => (
                    <div
                        key={email.id}
                        onClick={() => handleSelectEmail(email)}
                        className={cn(
                        'cursor-pointer border-b p-4 transition-colors',
                        selectedEmail?.id === email.id ? 'bg-accent' : 'hover:bg-accent/50',
                        !email.isRead && 'bg-primary/5'
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <p className={cn('font-semibold text-sm', !email.isRead && 'text-primary')}>{email.from}</p>
                            <p className="text-xs text-muted-foreground">{new Date(email.receivedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center justify-between">
                             <p className="font-medium truncate pr-4">{email.subject}</p>
                             <Star
                                onClick={(e) => toggleStarredStatus(e, email.id)}
                                className={cn('h-4 w-4 text-muted-foreground transition-colors shrink-0 hover:text-yellow-500', email.isStarred && 'fill-yellow-400 text-yellow-500')}
                            />
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                        {email.content.replace(/<[^>]+>/g, '')}
                        </p>
                    </div>
                    ))
                ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
                        <p>No emails in {activeFolder}.</p>
                    </div>
                )}
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {selectedEmail ? (
                    <div>
                        <div className="flex items-start justify-between border-b pb-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{getAvatarFallback(selectedEmail.from)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold truncate">{selectedEmail.subject}</h2>
                                    <p className="text-sm text-muted-foreground">From: {selectedEmail.from}</p>
                                    <p className="text-sm text-muted-foreground">To: {selectedEmail.to}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(selectedEmail.receivedAt).toLocaleString()}</span>
                                <Button variant="ghost" size="icon" title="Reply"><CornerUpLeft className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" title="More"><MoreVertical className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <div className="prose dark:prose-invert max-w-none py-6" dangerouslySetInnerHTML={{ __html: selectedEmail.content }} />
                    </div>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                    <Mail className="h-16 w-16" />
                    <p className="mt-4 text-lg">Select an email to read</p>
                    <p className="text-sm">Nothing selected</p>
                    </div>
                )}
            </div>
        </div>

        {/* Compose Dialog */}
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>Compose New Mail</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Input placeholder="To" value={newEmail.to} onChange={(e) => setNewEmail(p => ({...p, to: e.target.value}))} />
                <Input placeholder="Subject" value={newEmail.subject} onChange={(e) => setNewEmail(p => ({...p, subject: e.target.value}))} />
                <div
                ref={contentRef}
                contentEditable
                onInput={(e) => setNewEmail(p => ({...p, content: e.currentTarget.innerHTML}))}
                className="min-h-[300px] rounded-md border p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
            </div>
            <DialogFooter>
                <Button onClick={() => setIsComposeOpen(false)} variant="outline">Cancel</Button>
                <Button onClick={handleSendEmail}>Send</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
