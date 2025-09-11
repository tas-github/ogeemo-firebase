
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timer, Play, Pause, Square, Trash2 } from 'lucide-react';
import { type Event as TaskEvent, type TimeSession } from '@/types/calendar-types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 0 || isNaN(totalSeconds)) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface DetailedTimeTrackerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  event: TaskEvent | null;
  onLogTime: (totalSeconds: number, sessions: TimeSession[]) => void;
}

export function DetailedTimeTracker({ isOpen, onOpenChange, event, onLogTime }: DetailedTimeTrackerProps) {
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);
    const [sessions, setSessions] = useState<TimeSession[]>([]);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionStartRef = useRef<number | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && event) {
            setSessions(event.sessions || []);
            setCurrentSessionSeconds(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsTimerRunning(false);
        };
    }, [event, isOpen]);

    const totalAccumulatedSeconds = useMemo(() => {
        return sessions.reduce((acc, session) => acc + session.durationSeconds, 0);
    }, [sessions]);

    const totalTime = useMemo(() => {
        return totalAccumulatedSeconds + currentSessionSeconds;
    }, [totalAccumulatedSeconds, currentSessionSeconds]);

    const startTimer = useCallback(() => {
        if (isTimerRunning) return;
        setIsTimerRunning(true);
        sessionStartRef.current = Date.now();
        
        timerRef.current = setInterval(() => {
            const newElapsed = Math.floor((Date.now() - sessionStartRef.current!) / 1000);
            setCurrentSessionSeconds(newElapsed);
        }, 1000);
    }, [isTimerRunning]);

    const pauseTimer = useCallback(() => {
        if (!isTimerRunning || !timerRef.current) return;
        setIsTimerRunning(false);
        clearInterval(timerRef.current);
        timerRef.current = null;
    }, [isTimerRunning]);
    
    const stopAndLogSession = useCallback(() => {
        pauseTimer();
        if (currentSessionSeconds > 0) {
            const newSession: TimeSession = {
                id: `session_${Date.now()}`,
                startTime: new Date(sessionStartRef.current!),
                endTime: new Date(),
                durationSeconds: currentSessionSeconds,
            };
            setSessions(prev => [...prev, newSession]);
            setCurrentSessionSeconds(0);
            toast({ title: "Session Logged", description: `Added a session of ${formatTime(currentSessionSeconds)}.` });
        }
    }, [pauseTimer, currentSessionSeconds, toast]);

    const handleDeleteSession = (sessionId: string) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
    };
    
    const handleLogTime = () => {
        let finalTotal = totalAccumulatedSeconds;
        let finalSessions = [...sessions];
        
        if (currentSessionSeconds > 0) {
            const newSession: TimeSession = {
                id: `session_${Date.now()}`,
                startTime: new Date(sessionStartRef.current!),
                endTime: new Date(),
                durationSeconds: currentSessionSeconds,
            };
            finalSessions = [...sessions, newSession];
            finalTotal += currentSessionSeconds;
        }

        onLogTime(finalTotal, finalSessions);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detailed Time Tracking</DialogTitle>
                    <DialogDescription>Track time in sessions for "{event?.title || 'this task'}".</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Current Session</CardTitle></CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div className="font-mono text-4xl font-bold">
                                {formatTime(currentSessionSeconds)}
                            </div>
                            <div className="flex gap-2">
                                {!isTimerRunning ? (
                                    <Button onClick={startTimer} size="lg"><Play className="mr-2 h-5 w-5"/> Start</Button>
                                ) : (
                                    <Button onClick={pauseTimer} variant="outline" size="lg"><Pause className="mr-2 h-5 w-5"/> Pause</Button>
                                )}
                                <Button onClick={stopAndLogSession} disabled={!isTimerRunning && currentSessionSeconds === 0} variant="secondary" size="lg"><Square className="mr-2 h-5 w-5"/> Stop</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-2">
                        <Label>Logged Sessions</Label>
                        <ScrollArea className="h-40 w-full rounded-md border">
                           <div className="p-2">
                                {sessions.length > 0 ? (
                                    sessions.map((session, index) => (
                                        <div key={session.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                            <div>
                                                <p className="font-medium text-sm">Session {index + 1}</p>
                                                <p className="text-xs text-muted-foreground">{format(session.startTime, 'PPp')}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-sm">{formatTime(session.durationSeconds)}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteSession(session.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground p-4">No sessions logged yet.</div>
                                )}
                           </div>
                        </ScrollArea>
                    </div>

                    <Card className="bg-muted">
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Total Cumulative Time</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="font-mono text-2xl font-bold text-primary">{formatTime(totalTime)}</p>
                            <p className="text-xs text-muted-foreground">Logged Sessions + Current Session</p>
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleLogTime}>Log Total Time & Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
