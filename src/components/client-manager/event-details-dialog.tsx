
"use client";

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
} from 'lucide-react';
import { type EventEntry } from '@/services/client-manager-service';

interface EventDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  entry: EventEntry | null;
  onSave: (updatedEntry: Pick<EventEntry, 'id' | 'subject' | 'detailsHtml'>) => void;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function EventDetailsDialog({ isOpen, onOpenChange, entry, onSave }: EventDetailsDialogProps) {
  const [subject, setSubject] = useState('');
  const [detailsHtml, setDetailsHtml] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (entry && isOpen) {
      setSubject(entry.subject);
      setDetailsHtml(entry.detailsHtml || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = entry.detailsHtml || '';
      }
    }
  }, [entry, isOpen]);

  if (!entry) return null;

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setDetailsHtml(editorRef.current?.innerHTML || '');
  };

  const preventDefault = (e: React.MouseEvent) => e.preventDefault();

  const handleSaveChanges = () => {
    onSave({
      id: entry.id,
      subject,
      detailsHtml,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Event Details</DialogTitle>
          <DialogDescription>
            Modify the details for this logged event.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className='space-y-2'>
                <Label htmlFor="event-subject">Subject</Label>
                <Input id="event-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                 <p className="text-sm text-muted-foreground">For: {entry.contactName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                    <p className="text-muted-foreground">Start Time</p>
                    <p>{format(entry.startTime, 'PPpp')}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">End Time</p>
                    <p>{format(entry.endTime, 'PPpp')}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-mono">{formatTime(entry.duration)}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Billable Amount</p>
                    <p className="font-mono font-semibold text-primary">${((entry.duration / 3600) * entry.billableRate).toFixed(2)}</p>
                </div>
            </div>
            
            <div>
                <Separator className="my-4" />
                <h4 className="font-semibold mb-2">Description</h4>
                <div className="border rounded-md">
                    <div className="p-2 border-b flex items-center gap-1 flex-wrap">
                        <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Strikethrough" onMouseDown={preventDefault} onClick={() => handleFormat('strikeThrough')}><Strikethrough className="h-4 w-4" /></Button>
                        <Separator orientation="vertical" className="h-6 mx-1" />
                        <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Blockquote" onMouseDown={preventDefault} onClick={() => handleFormat('formatBlock', 'blockquote')}><Quote className="h-4 w-4" /></Button>
                        <Separator orientation="vertical" className="h-6 mx-1" />
                        <Button variant="ghost" size="icon" title="Insert Link" onMouseDown={preventDefault} onClick={() => { const url = prompt('Enter a URL:'); if (url) handleFormat('createLink', url); }}><LinkIcon className="h-4 w-4" /></Button>
                    </div>
                    <ScrollArea className="h-48">
                         <div
                            ref={editorRef}
                            className="prose dark:prose-invert max-w-none text-sm p-4 focus:outline-none min-h-[10rem]"
                            contentEditable
                            onInput={(e) => setDetailsHtml(e.currentTarget.innerHTML)}
                            dangerouslySetInnerHTML={{ __html: detailsHtml }}
                        />
                    </ScrollArea>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
