"use client";

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

interface EventEntry {
  id: string;
  contactId: string;
  contactName: string;
  subject: string;
  detailsHtml?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  billableRate: number;
}

interface EventDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  entry: EventEntry | null;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function EventDetailsDialog({ isOpen, onOpenChange, entry }: EventDetailsDialogProps) {
  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
          <DialogDescription>
            A detailed record of the logged event.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className='space-y-1'>
                <h3 className="font-semibold">{entry.subject}</h3>
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
            
            {entry.detailsHtml && (
                <div>
                    <Separator className="my-4" />
                    <h4 className="font-semibold mb-2">Description</h4>
                    <ScrollArea className="h-48 border rounded-md p-2">
                         <div
                            className="prose dark:prose-invert max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: entry.detailsHtml }}
                        />
                    </ScrollArea>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
