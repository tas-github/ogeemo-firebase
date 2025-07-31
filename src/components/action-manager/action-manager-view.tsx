
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mic, Send, Bot, User, LoaderCircle, Briefcase, ListTodo, UserPlus, Clock, FileDigit, Mail, StickyNote, Landmark, Contact } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { useLoading } from '@/context/loading-context';
import { getContacts, getFolders as getContactFolders, type Contact, type FolderData as ContactFolderData } from '@/services/contact-service';
import { useAuth } from '@/context/auth-context';
import { NewTaskDialog, type EventFormData } from '../tasks/NewTaskDialog';
import ContactFormDialog from '../contacts/contact-form-dialog';

const ActionChip = ({ icon: Icon, label, onClick, className, href }: { icon: React.ElementType, label: string, onClick?: () => void, className?: string, href?: string }) => {
    const { showLoading } = useLoading();
    
    const chipContent = (
        <>
            <Icon className="h-4 w-4" />
            <span className="truncate">{label}</span>
        </>
    );

    const chipClasses = cn(
        "flex items-center justify-center gap-2 text-sm text-primary-foreground p-2 rounded-lg border border-transparent transition-colors bg-primary hover:bg-primary/90",
        className
    );

    if (href) {
        return (
            <Link href={href} onClick={() => showLoading()} className={chipClasses}>
                {chipContent}
            </Link>
        )
    }

    return (
        <button onClick={onClick} className={chipClasses}>
            {chipContent}
        </button>
    );
};


export function ActionManagerView() {
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  const [dialogDefaultValues, setDialogDefaultValues] = useState<Partial<EventFormData>>({});
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactFolders, setContactFolders] = useState<ContactFolderData[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
        getContacts(user.uid).then(setContacts);
        getContactFolders(user.uid).then(setContactFolders);
    }
  }, [user]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleOpenDialog = (defaults: Partial<EventFormData>) => {
    setDialogDefaultValues(defaults);
    setIsNewItemDialogOpen(true);
  };

  const actions = [
      { onClick: () => handleOpenDialog({ isProject: true }), label: 'Start a Project', icon: Briefcase },
      { onClick: () => setIsContactFormOpen(true), label: 'Add a new contact', icon: UserPlus },
      { href: '/time', label: 'Log my time', icon: Clock },
      { href: '/accounting/transactions', label: 'Enter a transaction', icon: FileDigit },
      { href: '/ogeemail/compose', label: 'Compose an email', icon: Mail },
      { href: '/ideas', label: 'Create a note', icon: StickyNote },
      { href: '/google', label: 'Use a Google Action', icon: Contact },
      { href: '/tasks', label: 'Manage Tasks', icon: ListTodo },
  ];

  return (
    <>
      <div className="p-4 sm:p-6 flex flex-col h-full items-center">
        <header className="text-center mb-6">
            <h1 className="text-3xl font-bold font-headline text-primary">
            Ogeemo Action Manager
            </h1>
        </header>
        
        <Card className="w-full max-w-4xl flex-1 flex flex-col">
          <CardHeader>
             <CardDescription className="text-center">
              Ask me anything about Ogeemo, or tell me what you would like to do.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex w-full items-start space-x-2">
                <Button type="button" variant="ghost" size="icon" disabled className="flex-shrink-0 mt-2">
                <Mic className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                <Textarea 
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full resize-none pr-12 border-2 border-primary/20 focus-visible:ring-primary/50"
                />
                <Button type="submit" size="icon" className="absolute right-2 bottom-2 h-8 w-8">
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                </Button>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 w-full">
                {actions.map(action => (
                    <ActionChip 
                        key={action.label} 
                        icon={action.icon} 
                        label={action.label} 
                        onClick={action.onClick}
                        href={action.href}
                    />
                ))}
            </div>
            <div className="mt-4 p-4 border rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">
                    Welcome to your command center. Simply tell the assistant what you want to do by typing or using your voice. The chips above are shortcuts for common actions—click one to see how it works!
                </p>
            </div>
          </CardContent>
           <CardFooter className="flex-1 flex flex-col items-start gap-4 p-4 border-t">
            <ScrollArea className="w-full h-full pr-4 -mr-4">
              <div className="space-y-4">
                 {/* Chat messages would render here */}
              </div>
            </ScrollArea>
           </CardFooter>
        </Card>
      </div>
      
      {isContactFormOpen && (
        <ContactFormDialog
          isOpen={isContactFormOpen}
          onOpenChange={setIsContactFormOpen}
          contactToEdit={null}
          folders={contactFolders}
          onSave={(newContact, isEditing) => {
            if (!isEditing) setContacts(prev => [...prev, newContact]);
            setIsContactFormOpen(false);
          }}
        />
      )}
      
      <NewTaskDialog 
        isOpen={isNewItemDialogOpen}
        onOpenChange={setIsNewItemDialogOpen}
        contacts={contacts}
        defaultValues={dialogDefaultValues}
      />
    </>
  );
}
