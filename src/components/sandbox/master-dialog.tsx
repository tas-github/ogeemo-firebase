
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, ListTodo, Calendar, User, Clock, FileDigit, Mail, StickyNote, MessageSquare } from 'lucide-react';

// Extend DialogMode to include the new modes
export type DialogMode = 'project' | 'task' | 'event' | 'contact' | 'log' | 'invoice' | 'accounting' | 'email' | 'notes' | 'google';

const DIALOG_CONFIG: Record<DialogMode, { title: string; icon: React.ElementType; description: string; }> = {
    project: { title: 'Create New Project', icon: Briefcase, description: "Start a new project and define its scope." },
    task: { title: 'Create New Task', icon: ListTodo, description: "Add a new task to your to-do list." },
    event: { title: 'Create New Event', icon: Calendar, description: "Schedule a new event in your calendar." },
    contact: { title: 'Create New Contact', icon: User, description: "Add a new person to your contacts." },
    log: { title: 'Log Time Entry', icon: Clock, description: "Log time against a project or client." },
    invoice: { title: 'Create New Invoice', icon: FileDigit, description: "Generate a new invoice for a client." },
    accounting: { title: 'New Accounting Entry', icon: FileDigit, description: "Record a new transaction." },
    email: { title: 'Compose Email', icon: Mail, description: "Draft a new email." },
    notes: { title: 'Create Note', icon: StickyNote, description: "Jot down a new note or idea." },
    google: { title: 'Google Action', icon: MessageSquare, description: "Interact with Google services." },
};


interface MasterDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialMode: DialogMode;
}

export function MasterDialog({ isOpen, onOpenChange, initialMode }: MasterDialogProps) {
  const [mode, setMode] = useState<DialogMode>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const handleSubmit = () => {
    setIsSubmitting(true);
    console.log(`Submitting form in mode: ${mode}`);
    setTimeout(() => {
      toast({
        title: `${DIALOG_CONFIG[mode].title} Submitted (Prototype)`,
        description: 'In a real app, this data would now be saved to the database.',
      });
      setIsSubmitting(false);
      onOpenChange(false);
    }, 1000);
  };

  const renderFieldsForMode = () => {
    // This is a simplified version. A real implementation would have more dynamic fields.
    const config = DIALOG_CONFIG[mode];
    return (
        <div className="space-y-4">
             <div className="flex items-center gap-3 text-lg font-semibold">
                <config.icon className="h-5 w-5 text-primary" />
                <span>{config.title}</span>
            </div>
            <div>
                <Label htmlFor="title">Title / Subject</Label>
                <Input id="title" placeholder="What is this about?" />
            </div>
             <div>
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea id="description" placeholder="Add more details..." />
            </div>
        </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Master Action Dialog</DialogTitle>
          <DialogDescription>
            A single, unified dialog for creating entries. All fields are for demonstration purposes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {renderFieldsForMode()}
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
