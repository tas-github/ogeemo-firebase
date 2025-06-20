
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
    Archive, Bold, Italic, Underline, Strikethrough, Code, Quote, List, Link2, AlignLeft, AlignCenter, AlignRight,
    Highlighter, CheckCircle2, AlertTriangle, Mic, Mail, ChevronDown, Inbox, Star, Send, FileText, Trash2, RefreshCw,
    Filter, Search, Paperclip, X, BrainCircuit, Pencil
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { db, auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';

interface Email {
  id: string; 
  subject: string;
  from: string;
  to: string;
  content: string;
  isRead: boolean;
  isStarred: boolean;
  priority: "low" | "medium" | "high";
  receivedAt: string;
  folder: string;
  isArchived: boolean;
  hasAttachments: boolean;
  category: "primary" | "social" | "promotions" | "updates" | "forums";
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
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const mockDataAddedRef = useRef(false);

  const [textFormatting, setTextFormatting] = useState({
    fontSize: 14,
    fontFamily: "Arial",
    textAlign: "left" as "left" | "center" | "right",
    textColor: "#000000",
    highlightColor: "#FFFF00"
  });
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

  useEffect(() => {
    if (!db || !isAuthReady || !userId) {
      if(isAuthReady && !userId) setLoading(false)
      return;
    }

    const emailsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/emails`);
    const q = query(emailsCollectionRef, orderBy('receivedAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedEmails: Email[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Email, 'id'>
      }));
      setEmails(fetchedEmails);
      setLoading(false);

      if (selectedEmail && !fetchedEmails.find(e => e.id === selectedEmail.id)) {
        setSelectedEmail(null);
      }
      
      if (fetchedEmails.length === 0 && !mockDataAddedRef.current) {
        mockDataAddedRef.current = true;
        const initialMockEmails = [
           {
            subject: 'Welcome to Ogeemo Mail!',
            from: 'support@ogeemo.com',
            to: 'you@ogeemo.com',
            content: 'Hello! Welcome to your new, intuitive email experience. We are here to simplify your communications.',
            isRead: false, isStarred: false, priority: "medium" as "medium",
            receivedAt: new Date(Date.now() - 3600000).toISOString(), tags: ['welcome', 'important'],
            folder: "inbox", isArchived: false, hasAttachments: false, category: "primary" as "primary"
          },
          {
            subject: 'Your Weekly Digest: Ogeemo Updates',
            from: 'updates@ogeemo.com',
            to: 'you@ogeemo.com',
            content: 'Here are the latest updates from Ogeemo. Stay productive!',
            isRead: true, isStarred: true, priority: "medium" as "medium",
            receivedAt: new Date(Date.now() - 86400000 * 2).toISOString(), tags: ['update'],
            folder: "inbox", isArchived: false, hasAttachments: false, category: "updates" as "updates"
          },
          {
            subject: 'Meeting Reminder: Project Alpha Sync',
            from: 'calendar@ogeemo.com',
            to: 'you@ogeemo.com',
            content: 'Reminder: Project Alpha sync meeting today at 2 PM in Conference Room B. See you there!',
            isRead: false, isStarred: false, priority: "high" as "high",
            receivedAt: new Date(Date.now() - 1800000).toISOString(), tags: ['meeting', 'reminder'],
            folder: "inbox", isArchived: false, hasAttachments: false, category: "primary" as "primary"
          },
          {
            subject: 'Invoice #20250619 from Vendor X',
            from: 'invoices@vendorx.com',
            to: 'you@ogeemo.com',
            content: 'Your invoice #20250619 is now available for review. Please process payment by end of week.',
            isRead: true, isStarred: false, priority: "high" as "high",
            receivedAt: new Date(Date.now() - 86400000 * 5).toISOString(), tags: ['finance', 'action-required'],
            folder: "inbox", isArchived: false, hasAttachments: true, category: "primary" as "primary"
          },
          {
            subject: "New Feature Alert: Ogeemo File Manager",
            from: "product@ogeemo.com",
            to: "you@ogeemo.com",
            content: "Exciting news! We've just launched the new Ogeemo File Manager. Check out how it simplifies Google Drive for you.",
            isRead: false, isStarred: true, priority: "medium" as "medium",
            receivedAt: new Date(Date.now() - 86400000).toISOString(), tags: ['feature', 'new'],
            folder: "inbox", isArchived: false, hasAttachments: false, category: "updates" as "updates"
          },
          {
            subject: 'Your Recent Support Request #12345',
            from: 'support@external.com',
            to: 'you@ogeemo.com',
            content: 'Thank you for reaching out. Your request #12345 has been received and is being processed. Expected resolution within 24 hours.',
            isRead: false, isStarred: false, priority: "low" as "low",
            receivedAt: new Date(Date.now() - 7200000).toISOString(), tags: ['support'],
            folder: "inbox", isArchived: false, hasAttachments: false, category: "forums" as "forums"
          },
          {
            subject: 'Project Zeus - Budget Approval Needed',
            from: 'finance@yourcompany.com',
            to: 'you@ogeemo.com',
            content: 'The budget for Project Zeus requires your final approval. Please review the attached document.',
            isRead: false, isStarred: false, priority: "high" as "high",
            receivedAt: new Date(Date.now() - 86400000 * 3).toISOString(), tags: ['project', 'finance', 'action-required'],
            folder: "inbox", isArchived: false, hasAttachments: true, category: "primary" as "primary"
          },
          {
            subject: 'Newsletter: Latest Industry Trends',
            from: 'newsletter@industry.com',
            to: 'you@ogeemo.com',
            content: "Stay updated with the latest trends in the industry. This month's edition covers AI and cloud computing.",
            isRead: true, isStarred: false, priority: "low" as "low",
            receivedAt: new Date(Date.now() - 86400000 * 7).toISOString(), tags: ['newsletter'],
            folder: "inbox", isArchived: false, hasAttachments: false, category: "promotions" as "promotions"
          },
          {
            subject: 'Client Feedback: Q2 Satisfaction Survey',
            from: 'feedback@clientcorp.com',
            to: 'you@ogeemo.com',
            content: 'Thank you for participating in our Q2 client satisfaction survey. Your feedback is valuable.',
            isRead: true, isStarred: false, priority: "medium" as "medium",
            receivedAt: new Date(Date.now() - 86400000 * 10).toISOString(), tags: ['feedback', 'survey'],
            folder: "inbox", isArchived: false, hasAttachments: false, category: "social" as "social"
          },
          {
            subject: 'Reminder: Friday Team Social',
            from: 'hr@yourcompany.com',
            to: 'you@ogeemo.com',
            content: "Don't forget our team social this Friday at 4 PM in the lounge. Snacks and drinks will be provided!",
            isRead: false, isStarred: false, priority: "low" as "low",
            receivedAt: new Date(Date.now() - 600000).toISOString(), tags: ['social', 'reminder'],
            folder: "inbox", isArchived: false, hasAttachments: false, category: "social" as "social"
          }
        ];
        for (const email of initialMockEmails) {
            try {
                await addDoc(emailsCollectionRef, email);
            } catch (error) {
                console.error("Error adding initial mock email:", error);
            }
        }
      }

    }, (error) => {
      console.error("Error fetching emails from Firestore:", error);
      showAppToast("Loading Error", "Failed to load emails.", "destructive");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, isAuthReady, userId, showAppToast]);

  const toggleReadStatus = async (id: string) => {
    if (!db || !userId) return;
    const emailRef = doc(db, `artifacts/${appId}/users/${userId}/emails`, id);
    const currentEmail = emails.find(e => e.id === id);
    if (currentEmail) {
      await updateDoc(emailRef, { isRead: !currentEmail.isRead });
      showAppToast("Status Updated", `Email marked as ${!currentEmail.isRead ? 'read' : 'unread'}`);
    }
  };

  const toggleStarredStatus = async (id: string) => {
    if (!db || !userId) return;
    const emailRef = doc(db, `artifacts/${appId}/users/${userId}/emails`, id);
    const currentEmail = emails.find(e => e.id === id);
    if (currentEmail) {
      await updateDoc(emailRef, { isStarred: !currentEmail.isStarred });
      showAppToast("Status Updated", `Email ${!currentEmail.isStarred ? 'starred' : 'unstarred'}`);
    }
  };

  const deleteEmail = async (id: string) => {
    if (!db || !userId) return;
    await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/emails`, id));
    showAppToast("Email Deleted", "The email has been removed successfully.");
    setSelectedEmail(null);
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
      isRead: true,
      isStarred: false,
      receivedAt: new Date().toISOString(),
      folder: 'sent',
      isArchived: false, hasAttachments: false, priority: "medium", category: "primary",
      tags: ['sent'],
    });
    setNewEmail({ to: '', subject: '', content: '', cc: '', bcc: '' });
    if (contentRef.current) contentRef.current.innerHTML = '';
    setIsComposeOpen(false);
    showAppToast("Success", "Email sent successfully!");
  };

  const hasUnsavedContent = () => {
    const contentHtml = contentRef.current ? contentRef.current.innerHTML.replace(/<br>/g, '').trim() : '';
    return newEmail.to.trim() !== "" || newEmail.subject.trim() !== "" || contentHtml !== "" || (newEmail.cc && newEmail.cc.trim() !== "") || (newEmail.bcc && newEmail.bcc.trim() !== "");
  };

  const handleCloseCompose = () => {
    if (hasUnsavedContent()) {
      setShowCloseConfirm(true);
    } else {
      setIsComposeOpen(false);
      setNewEmail({ to: '', subject: '', content: '', cc: '', bcc: '' });
      if (contentRef.current) contentRef.current.innerHTML = '';
    }
  };

  const confirmCloseCompose = () => {
    setIsComposeOpen(false);
    setNewEmail({ to: "", subject: "", content: "", cc: '', bcc: '' });
    if (contentRef.current) contentRef.current.innerHTML = '';
    setShowCloseConfirm(false);
  };
  
  const [activeVoiceInput, setActiveVoiceInput] = useState<string | null>(null);
  const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
      onTranscript: (transcript) => {
          if (activeVoiceInput) {
              handleVoiceInput(activeVoiceInput)(transcript);
              setActiveVoiceInput(null);
          }
      }
  });

  const handleMicClick = (field: string) => {
      if (isListening) {
          stopListening();
          setActiveVoiceInput(null);
      } else {
          setActiveVoiceInput(field);
          startListening();
      }
  };

  const handleVoiceInput = (field: string) => (text: string) => {
    if (field === 'search') setSearchQuery(text);
    else if (field === 'to') setNewEmail(prev => ({ ...prev, to: text }));
    else if (field === 'subject') setNewEmail(prev => ({ ...prev, subject: text }));
    else if (field === 'cc') setNewEmail(prev => ({ ...prev, cc: text }));
    else if (field === 'bcc') setNewEmail(prev => ({ ...prev, bcc: text }));
    else if (field === 'content' && contentRef.current) {
        const currentHtml = contentRef.current.innerHTML;
        const newHtml = currentHtml + (currentHtml ? ' ' : '') + text;
        contentRef.current.innerHTML = newHtml;
        setNewEmail(prev => ({ ...prev, content: newHtml }));
    }
  };
  
  const handleContentInput = () => {
    if (contentRef.current) {
      setNewEmail(prev => ({ ...prev, content: contentRef.current.innerHTML }));
    }
  };

  const applyTextFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentInput();
  };

  const highlightSelectedText = () => {
    applyTextFormatting('backColor', textFormatting.highlightColor);
    showAppToast("Text Highlighted", `Text highlighted with ${textFormatting.highlightColor}`);
  };

  const getWordCount = useCallback(() => (contentRef.current?.innerText || '').trim().split(/\s+/).filter(Boolean).length, [newEmail.content]);
  const getCharacterCount = useCallback(() => (contentRef.current?.innerText || '').length, [newEmail.content]);

  const filteredEmails = emails.filter((email: Email) => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const matchesSearch = email.subject.toLowerCase().includes(lowerCaseQuery) ||
                          email.from.toLowerCase().includes(lowerCaseQuery) ||
                          email.content.toLowerCase().includes(lowerCaseQuery) ||
                          (email.tags && email.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)));
    
    if (activeFolder === "inbox") return matchesSearch && !email.isArchived && email.folder !== 'sent';
    if (activeFolder === "starred") return matchesSearch && email.isStarred;
    if (activeFolder === "sent") return matchesSearch && email.folder === 'sent';
    if (activeFolder === "archive") return matchesSearch && email.isArchived;
    if (activeFolder === "trash") return false;
    return matchesSearch;
  });

  const menuItems = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: emails.filter(e => !e.isRead && !e.isArchived && e.folder !== 'sent').length },
    { id: "starred", label: "Starred", icon: Star, count: emails.filter(e => e.isStarred).length },
    { id: "sent", label: "Sent", icon: Send, count: emails.filter(e => e.folder === 'sent').length },
    { id: "drafts", label: "Drafts", icon: FileText, count: 0 },
    { id: "archive", label: "Archive", icon: Archive, count: emails.filter(e => e.isArchived).length },
    { id: "trash", label: "Trash", icon: Trash2, count: 0 }
  ];

  if (loading || !isAuthReady) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">Loading OgeeMail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <main className="flex flex-1 min-h-0 gap-6 p-6">
        <div className="w-[260px] flex-shrink-0 bg-card rounded-lg border flex flex-col">
          <div className="p-4">
            <button onClick={() => setIsComposeOpen(true)} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:bg-primary/90 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
              <Pencil className="h-4 w-4" />
              <span>Compose</span>
            </button>
          </div>
          <div className="p-4 border-t">
            <h3 className="text-xl font-bold text-foreground">Folders</h3>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeFolder === item.id;
              return (
                <button key={item.id} onClick={() => setActiveFolder(item.id)} className={cn('w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors', isActive ? 'bg-secondary text-secondary-foreground font-medium' : 'text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground')}>
                  <div className="flex items-center space-x-3"><IconComponent className="h-5 w-5" /><span>{item.label}</span></div>
                  {item.count > 0 && (<span className={cn('px-2 py-0.5 text-xs rounded-full', isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{item.count}</span>)}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 bg-card rounded-lg border flex flex-col min-w-0">
          <div className="p-4 border-b flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-foreground whitespace-nowrap">{activeFolder.charAt(0).toUpperCase() + activeFolder.slice(1)} ({filteredEmails.filter(e => !e.isRead).length})</h2>
            <div className="relative flex-grow max-w-md">
                <input type="text" placeholder="Search mail..." className="w-full pl-10 pr-4 py-2 border border-input rounded-full focus:ring-2 focus:ring-ring" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-secondary transition-colors duration-200" title="Refresh"><RefreshCw className="h-5 w-5 text-muted-foreground" /></button>
              <button className="p-2 rounded-full hover:bg-secondary transition-colors duration-200" title="Filter"><Filter className="h-5 w-5 text-muted-foreground" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground"><p>No emails found.</p></div>
            ) : (
              filteredEmails.map(email => (
                <div key={email.id} className={cn('p-4 border-b border-border/50 cursor-pointer transition-all duration-200', selectedEmail?.id === email.id ? 'bg-secondary border-l-4 border-primary' : 'hover:bg-secondary/50', !email.isRead ? 'font-semibold bg-primary/5' : 'text-foreground')} onClick={() => setSelectedEmail(email)}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn('text-sm truncate w-2/3', !email.isRead ? 'text-foreground' : 'text-muted-foreground')}>{email.from}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{new Date(email.receivedAt).toLocaleDateString()}</span>
                  </div>
                  <p className={cn('text-base truncate', !email.isRead ? 'text-foreground' : 'text-foreground/80')}>{email.subject}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {email.isStarred && (<Star className="h-4 w-4 text-yellow-500 fill-current" />)}
                    {email.hasAttachments && (<Paperclip className="h-4 w-4 text-muted-foreground" />)}
                    {email.tags && email.tags.map(tag => (<span key={tag} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{tag}</span>))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 lg:p-0" onClick={() => setSelectedEmail(null)}>
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-3xl h-[90vh] lg:h-[80vh] flex flex-col transform scale-100 opacity-100 transition-all duration-300 ease-out border" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b bg-muted/50 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold text-foreground break-words">{selectedEmail.subject}</h2>
              <button onClick={() => setSelectedEmail(null)} className="p-2 rounded-full hover:bg-secondary transition-colors duration-200"><X className="h-6 w-6 text-muted-foreground" /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-sm text-muted-foreground mb-1">From: <span className="font-semibold text-foreground">{selectedEmail.from}</span></p>
              <p className="text-sm text-muted-foreground">To: {selectedEmail.to}</p>
              {selectedEmail.cc && <p className="text-sm text-muted-foreground">Cc: {selectedEmail.cc}</p>}
              <div className="text-xs text-muted-foreground mt-1">{new Date(selectedEmail.receivedAt).toLocaleString()}</div>
              <hr className="my-4" />
              <div className="text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedEmail.content }} />
              {selectedEmail.tags?.includes('action-required') && (
                <div className="mt-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded-lg flex items-center space-x-2">
                  <BrainCircuit className="h-5 w-5" />
                  <p className="font-semibold">AI Insight: This email likely requires your urgent attention.</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-muted/50 flex justify-end space-x-3 rounded-b-xl">
                <button onClick={() => toggleReadStatus(selectedEmail.id)} className="px-5 py-2 bg-primary text-primary-foreground text-sm rounded-full shadow-md hover:bg-primary/90 transition-colors duration-200">{selectedEmail.isRead ? 'Mark as Unread' : 'Mark as Read'}</button>
                <button onClick={() => toggleStarredStatus(selectedEmail.id)} className="px-5 py-2 bg-yellow-400 text-black text-sm rounded-full shadow-md hover:bg-yellow-500 transition-colors duration-200">{selectedEmail.isStarred ? 'Unstar' : 'Star'}</button>
                <button onClick={() => deleteEmail(selectedEmail.id)} className="px-5 py-2 bg-destructive text-destructive-foreground text-sm rounded-full shadow-md hover:bg-destructive/90 transition-colors duration-200">Delete</button>
            </div>
          </div>
        </div>
      )}

      {isComposeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-3xl transform scale-100 opacity-100 transition-all duration-300 ease-out flex flex-col h-[90vh] md:h-[80vh] border">
            <div className="p-5 border-b bg-primary flex justify-between items-center rounded-t-xl">
              <h2 className="text-2xl font-bold text-primary-foreground">Compose New Mail</h2>
              <button onClick={handleCloseCompose} className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"><X className="h-6 w-6 text-primary-foreground" /></button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center space-x-3">
                  <label htmlFor="to" className="text-sm font-medium text-foreground w-16 shrink-0">To</label>
                  <input type="email" id="to" className="flex-1 w-full px-4 py-2 border border-input rounded-lg focus:ring-ring focus:border-transparent" placeholder="Recipients" value={newEmail.to} onChange={(e) => setNewEmail(prev => ({ ...prev, to: e.target.value }))} />
                  <button onClick={() => handleMicClick('to')} className={cn("p-2 rounded-full", activeVoiceInput === 'to' && isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "hover:bg-secondary")}><Mic className="h-5 w-5" /></button>
                  <button type="button" className="px-3 py-2 text-xs font-medium rounded-full text-primary hover:bg-secondary" onClick={() => setShowCcBcc(!showCcBcc)}>{showCcBcc ? 'Hide' : 'Cc/Bcc'}</button>
              </div>
              {showCcBcc && (
                  <>
                    <div className="flex items-center space-x-3">
                      <label htmlFor="cc" className="text-sm font-medium text-foreground w-16 shrink-0">CC</label>
                      <input type="email" id="cc" className="flex-1 w-full px-4 py-2 border border-input rounded-lg" placeholder="Carbon copy" value={newEmail.cc || ''} onChange={(e) => setNewEmail(prev => ({ ...prev, cc: e.target.value }))} />
                      <button onClick={() => handleMicClick('cc')} className={cn("p-2 rounded-full", activeVoiceInput === 'cc' && isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "hover:bg-secondary")}><Mic className="h-5 w-5" /></button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label htmlFor="bcc" className="text-sm font-medium text-foreground w-16 shrink-0">BCC</label>
                      <input type="email" id="bcc" className="flex-1 w-full px-4 py-2 border border-input rounded-lg" placeholder="Blind carbon copy" value={newEmail.bcc || ''} onChange={(e) => setNewEmail(prev => ({ ...prev, bcc: e.target.value }))} />
                      <button onClick={() => handleMicClick('bcc')} className={cn("p-2 rounded-full", activeVoiceInput === 'bcc' && isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "hover:bg-secondary")}><Mic className="h-5 w-5" /></button>
                    </div>
                  </>
                )}
              <div className="flex items-center space-x-3">
                <label htmlFor="subject" className="text-sm font-medium text-foreground w-16 shrink-0">Subject</label>
                <input type="text" id="subject" className="flex-1 w-full px-4 py-2 border border-input rounded-lg" placeholder="Subject" value={newEmail.subject} onChange={(e) => setNewEmail(prev => ({ ...prev, subject: e.target.value }))} />
                <button onClick={() => handleMicClick('subject')} className={cn("p-2 rounded-full", activeVoiceInput === 'subject' && isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "hover:bg-secondary")}><Mic className="h-5 w-5" /></button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <button onClick={() => handleMicClick('content')} className={cn("p-2 rounded-full", activeVoiceInput === 'content' && isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "hover:bg-secondary")}><Mic className="h-5 w-5" /></button>
                </div>
                <div className="bg-muted border rounded-lg p-2 overflow-x-auto">
                    <div className="flex items-center flex-nowrap gap-1">
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={() => applyTextFormatting('bold')} title="Bold"><Bold size={16}/></button>
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={() => applyTextFormatting('italic')} title="Italic"><Italic size={16}/></button>
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={() => applyTextFormatting('underline')} title="Underline"><Underline size={16}/></button>
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={() => applyTextFormatting('strikeThrough')} title="Strikethrough"><Strikethrough size={16}/></button>
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={() => applyTextFormatting('insertUnorderedList')} title="Bullet List"><List size={16}/></button>
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={() => { const url = prompt("Enter URL:"); if (url) applyTextFormatting('createLink', url); }} title="Insert Link"><Link2 size={16}/></button>
                        <div className="w-px h-5 bg-border mx-1"></div>
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={() => applyTextFormatting('justifyLeft')} title="Align Left"><AlignLeft size={16}/></button>
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={() => applyTextFormatting('justifyCenter')} title="Align Center"><AlignCenter size={16}/></button>
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={() => applyTextFormatting('justifyRight')} title="Align Right"><AlignRight size={16}/></button>
                        <div className="w-px h-5 bg-border mx-1"></div>
                        <input type="color" value={textFormatting.highlightColor} onChange={(e) => setTextFormatting(prev => ({ ...prev, highlightColor: e.target.value }))} className="w-6 h-6 border-none bg-transparent cursor-pointer" title="Highlight Color"/>
                        <button type="button" className="p-1.5 rounded hover:bg-secondary" onClick={highlightSelectedText} title="Highlight Selection"><Highlighter size={16}/></button>
                    </div>
                </div>
                <div ref={contentRef} contentEditable="true" className="w-full min-h-[300px] p-3 focus:outline-none focus:ring-2 focus:ring-ring rounded-md border bg-card" onInput={handleContentInput} dangerouslySetInnerHTML={{ __html: newEmail.content }} placeholder="Compose your message..." />
              </div>
            </div>
            <div className="p-5 border-t bg-muted/50 flex justify-between items-center rounded-b-xl">
                <div className="text-sm text-muted-foreground">{getWordCount()} words / {getCharacterCount()} chars</div>
                <div className="flex space-x-3">
                    <button onClick={handleCloseCompose} className="px-6 py-2 bg-muted text-muted-foreground font-semibold rounded-full shadow-md hover:bg-muted/80">Cancel</button>
                    <button onClick={handleSendEmail} className="px-6 py-2 bg-green-500 text-white font-semibold rounded-full shadow-lg hover:bg-green-600">Send</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[1001] flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl p-6 max-w-sm w-full text-center border">
            <h3 className="text-xl font-bold text-foreground mb-4">Discard Changes?</h3>
            <p className="text-muted-foreground mb-6">You have unsaved changes. Are you sure you want to close?</p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setShowCloseConfirm(false)} className="px-5 py-2 rounded-full border bg-background text-foreground font-semibold hover:bg-secondary">Keep Editing</button>
              <button onClick={confirmCloseCompose} className="px-5 py-2 rounded-full bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
