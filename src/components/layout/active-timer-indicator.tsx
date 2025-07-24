
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';

const TIMER_STORAGE_KEY = 'activeTimeManagerEntry';

interface StoredTimerState {
    startTime: number;
    isActive: boolean;
    isPaused: boolean;
    pauseTime: number | null;
    totalPausedDuration: number;
    notes: string;
}

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function ActiveTimerIndicator() {
    const [timerState, setTimerState] = useState<StoredTimerState | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const router = useRouter();

    const updateTimer = useCallback(() => {
        try {
            const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
            if (savedStateRaw) {
                const savedState: StoredTimerState = JSON.parse(savedStateRaw);
                setTimerState(savedState);
                
                if (savedState.isActive && !savedState.isPaused) {
                    const elapsed = Math.floor((Date.now() - savedState.startTime) / 1000) - savedState.totalPausedDuration;
                    setElapsedSeconds(elapsed > 0 ? elapsed : 0);
                } else if (savedState.isActive && savedState.isPaused) {
                    const elapsed = Math.floor((savedState.pauseTime! - savedState.startTime) / 1000) - savedState.totalPausedDuration;
                    setElapsedSeconds(elapsed > 0 ? elapsed : 0);
                }

            } else {
                setTimerState(null);
                setElapsedSeconds(0);
            }
        } catch (e) {
            console.error("Error updating timer indicator:", e);
            setTimerState(null);
        }
    }, []);
    
    useEffect(() => {
        updateTimer(); // Initial check
        
        const interval = setInterval(updateTimer, 1000);
        
        // Listen for storage changes from other tabs/windows
        window.addEventListener('storage', updateTimer);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', updateTimer);
        };
    }, [updateTimer]);

    const handleStopTimer = () => {
        localStorage.removeItem(TIMER_STORAGE_KEY);
        // Dispatch event to notify other components (like the timer page if it's open)
        window.dispatchEvent(new Event('storage')); 
    };

    if (!timerState || !timerState.isActive) {
        return null;
    }

    return (
        <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
            <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => router.push('/time')}>
                    <Clock className={`h-6 w-6 text-primary ${!timerState.isPaused ? 'animate-pulse' : ''}`} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{timerState.notes || 'Timer Active'}</p>
                        <p className="font-mono text-lg font-bold">{formatTime(elapsedSeconds)}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleStopTimer}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Stop Timer</span>
                </Button>
            </CardContent>
        </Card>
    );
}
