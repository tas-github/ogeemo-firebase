"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';

interface TimerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  elapsedTime: number;
  isActive: boolean;
  isPaused: boolean;
  selectedContactName?: string;
  handleStart: () => void;
  handlePauseResume: () => void;
  handleStop: () => void;
}

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function TimerDialog({
  isOpen,
  onOpenChange,
  elapsedTime,
  isActive,
  isPaused,
  selectedContactName,
  handleStart,
  handlePauseResume,
  handleStop,
}: TimerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Event Timer</DialogTitle>
          <DialogDescription>
            Track billable or non-billable time for the selected event.
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 text-center">
          <p className="text-6xl font-mono font-bold text-primary tracking-tight">
            {formatTime(elapsedTime)}
          </p>
          {isActive && selectedContactName && (
            <p className="text-muted-foreground mt-2">
              Timing for <span className="font-semibold text-primary">{selectedContactName}</span>
            </p>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-4 items-center">
          <div className="flex justify-center gap-4">
            {!isActive ? (
              <Button size="lg" onClick={handleStart} className="w-48">
                <Play className="mr-2 h-5 w-5" /> Start Timer
              </Button>
            ) : (
              <>
                <Button size="lg" variant="outline" onClick={handlePauseResume} className="w-48">
                  {isPaused ? <Play className="mr-2 h-5 w-5" /> : <Pause className="mr-2 h-5 w-5" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button size="lg" variant="destructive" onClick={handleStop} className="w-48">
                  <Square className="mr-2 h-5 w-5" /> Stop & Log
                </Button>
              </>
            )}
          </div>
           <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
