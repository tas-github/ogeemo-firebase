
"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square } from 'lucide-react';

interface TimeClockDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogTime: (seconds: number) => void;
}

const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


export function TimeClockDialog({ isOpen, onOpenChange, onLogTime }: TimeClockDialogProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);
  
  // Reset timer when dialog is closed/reopened without logging
  useEffect(() => {
    if (!isOpen) {
        setIsActive(false);
        setElapsedSeconds(0);
    }
  }, [isOpen])

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleStop = () => {
    onLogTime(elapsedSeconds);
    setIsActive(false);
    setElapsedSeconds(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Time Clock</DialogTitle>
          <DialogDescription>
            Track time for this task. The timer will reset if you close this dialog.
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 text-center">
          <p className="text-6xl font-mono font-bold text-primary tracking-tight">
            {formatTime(elapsedSeconds)}
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2">
            <Button onClick={handleStartPause} variant="outline" size="lg">
                {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button onClick={handleStop} variant="destructive" size="lg" disabled={!isActive && elapsedSeconds === 0}>
                <Square className="mr-2 h-5 w-5" />
                Stop & Log
            </Button>
        </div>
        <div className="flex items-center space-x-2 pt-4 justify-center">
            <Checkbox id="keep-running" disabled />
            <Label htmlFor="keep-running" className="text-muted-foreground">Keep timer running until stopped (Feature coming soon)</Label>
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TimeClockDialog;
