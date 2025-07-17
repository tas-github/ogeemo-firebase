
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

const TIMER_STORAGE_KEY = 'timeClockDialogState';

interface StoredTimerState {
    isActive: boolean;
    isPaused: boolean;
}

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function ActiveTimerIndicator() {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [displayTime, setDisplayTime] = useState('00:00:00');

  useEffect(() => {
    const checkTimerState = () => {
      try {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (savedStateRaw) {
          const savedState: StoredTimerState & { elapsedSeconds: number; lastTickTimestamp: number } = JSON.parse(savedStateRaw);
          if (savedState.isActive) {
            setIsTimerActive(true);
            const timeSinceLastTick = !savedState.isPaused ? Math.floor((Date.now() - savedState.lastTickTimestamp) / 1000) : 0;
            const currentTotalSeconds = savedState.elapsedSeconds + timeSinceLastTick;
            setDisplayTime(formatTime(currentTotalSeconds));
          } else {
            setIsTimerActive(false);
          }
        } else {
          setIsTimerActive(false);
        }
      } catch (error) {
        console.error("Error reading timer state from localStorage:", error);
        setIsTimerActive(false);
      }
    };
    
    checkTimerState(); // Initial check
    const interval = setInterval(checkTimerState, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  if (!isTimerActive) {
    return null;
  }

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button asChild variant="secondary" className="fixed bottom-4 right-4 z-50 h-12 w-auto animate-pulse rounded-full shadow-lg border-2 border-primary">
                    <Link href="/client-manager/create">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="ml-2 font-mono text-base font-bold text-primary">{displayTime}</span>
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
                <p>An event timer is active. Click to manage.</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
