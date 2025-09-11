
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, X, Pause, Play } from 'lucide-react';
import { StoredTimerState } from '@/components/time/time-manager-view';
import { formatTime } from '@/lib/utils';

const TIMER_STORAGE_KEY = 'activeTimeManagerEntry';

export function ActiveTimerIndicator() {
    const [timerState, setTimerState] = useState<StoredTimerState | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const router = useRouter();

    const updateTimerDisplay = useCallback(() => {
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
        updateTimerDisplay();
        
        const interval = setInterval(updateTimerDisplay, 1000);
        window.addEventListener('storage', updateTimerDisplay);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', updateTimerDisplay);
        };
    }, [updateTimerDisplay]);
    
    const handlePause = () => {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (savedStateRaw) {
            const savedState: StoredTimerState = JSON.parse(savedStateRaw);
            if(savedState.isActive && !savedState.isPaused) {
                const newState = { ...savedState, isPaused: true, pauseTime: Date.now() };
                localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(newState));
                window.dispatchEvent(new Event('storage'));
            }
        }
    };

    const handleResume = () => {
        const savedStateRaw = localStorage.getItem(TIMER_STORAGE_KEY);
        if (savedStateRaw) {
            const savedState: StoredTimerState = JSON.parse(savedStateRaw);
            if(savedState.isActive && savedState.isPaused) {
                const pausedDuration = Math.floor((Date.now() - savedState.pauseTime!) / 1000);
                const newState = {
                    ...savedState,
                    isPaused: false,
                    pauseTime: null,
                    totalPausedDuration: savedState.totalPausedDuration + pausedDuration,
                };
                localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(newState));
                window.dispatchEvent(new Event('storage'));
            }
        }
    };

    const handleStopTimer = () => {
        localStorage.removeItem(TIMER_STORAGE_KEY);
        window.dispatchEvent(new Event('storage'));
        // We don't log time here, we just cancel it. The main page handles logging.
    };

    if (!timerState || !timerState.isActive) {
        return null;
    }

    return (
        <Card className="fixed bottom-4 left-4 z-50 w-80 shadow-lg animate-in fade-in-50 slide-in-from-bottom-5 duration-300">
            <CardContent className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => router.push('/time')}>
                    <Clock className={`h-6 w-6 text-primary ${!timerState.isPaused ? 'animate-pulse' : ''}`} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{timerState.notes || 'Timer Active'}</p>
                        <p className="font-mono text-lg font-bold">{formatTime(elapsedSeconds)}</p>
                    </div>
                </div>
                <div className="flex items-center">
                    {timerState.isPaused ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleResume}>
                            <Play className="h-4 w-4" />
                            <span className="sr-only">Resume Timer</span>
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handlePause}>
                            <Pause className="h-4 w-4" />
                            <span className="sr-only">Pause Timer</span>
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleStopTimer}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel Timer</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
