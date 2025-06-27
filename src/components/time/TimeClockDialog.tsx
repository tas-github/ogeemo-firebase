
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useToast } from "@/hooks/use-toast";

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

const TIMER_STORAGE_KEY = 'timeClockDialogState';

interface StoredTimerState {
    elapsedSeconds: number;
    isActive: boolean;
    lastTickTimestamp: number;
}


export function TimeClockDialog({ isOpen, onOpenChange, onLogTime }: TimeClockDialogProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [keepRunning, setKeepRunning] = useState(false);
  const [saveToClientFile, setSaveToClientFile] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Main timer logic
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

  const resetTimerState = useCallback(() => {
      setIsActive(false);
      setElapsedSeconds(0);
      setKeepRunning(false);
      setSaveToClientFile(false);
      localStorage.removeItem(TIMER_STORAGE_KEY);
  }, []);
  
  // Load state from localStorage when dialog opens
  useEffect(() => {
    if (isOpen) {
        try {
            const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
            if (savedStateRaw) {
                const savedState: StoredTimerState = JSON.parse(savedStateRaw);
                const timeSinceLastTick = savedState.isActive ? Math.floor((Date.now() - savedState.lastTickTimestamp) / 1000) : 0;
                
                setElapsedSeconds(savedState.elapsedSeconds + timeSinceLastTick);
                setIsActive(savedState.isActive);
                setKeepRunning(true);
            }
        } catch (error) {
            console.error("Failed to parse timer state from localStorage", error);
            resetTimerState();
        }
    }
  }, [isOpen, resetTimerState]);
  
  const handleOpenChange = (open: boolean) => {
    if (!open) { // Dialog is closing
      if (keepRunning && (isActive || elapsedSeconds > 0)) {
        // Save state to localStorage
        const stateToStore: StoredTimerState = {
            elapsedSeconds,
            isActive,
            lastTickTimestamp: Date.now(),
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(stateToStore));
      } else {
        // Not keeping it running, so reset everything
        resetTimerState();
      }
    }
    onOpenChange(open);
  };

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleStop = () => {
    if (saveToClientFile) {
        // Simulate saving to client file
        toast({
            title: "Time Saved to Client File",
            description: `${formatTime(elapsedSeconds)} has been logged to the client file.`
        });
    }
    onLogTime(elapsedSeconds);
    resetTimerState();
    onOpenChange(false);
  };
  
  const handleKeepRunningChange = (checked: boolean | 'indeterminate') => {
    const isChecked = !!checked;
    setKeepRunning(isChecked);
    if (!isChecked) {
        // If user unchecks it, we should clear any persistent state
        localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Time Clock</DialogTitle>
          <DialogDescription>
            Track time for this task. The timer will reset if you close this dialog unless "Keep running" is checked.
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
                {saveToClientFile ? "Save time to client file" : "Stop & Log"}
            </Button>
        </div>
        <div className="flex flex-col items-center space-y-2 pt-4 justify-center">
            <div className="flex items-center space-x-2">
                <Checkbox
                id="keep-running"
                checked={keepRunning}
                onCheckedChange={handleKeepRunningChange}
                />
                <Label htmlFor="keep-running" className="cursor-pointer">Keep timer running until stopped</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="save-to-client"
                    checked={saveToClientFile}
                    onCheckedChange={(checked) => setSaveToClientFile(!!checked)}
                />
                <Label htmlFor="save-to-client" className="cursor-pointer">Log time to client's file</Label>
            </div>
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TimeClockDialog;
