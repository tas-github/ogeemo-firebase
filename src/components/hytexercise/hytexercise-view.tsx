
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { HeartPulse, Timer, Settings, PlayCircle, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function HytexerciseView() {
  const [isActive, setIsActive] = useState(false);
  const [breakFrequency, setBreakFrequency] = useState(60);
  const [breakDuration, setBreakDuration] = useState(5);
  const { toast } = useToast();

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your Hytexercise preferences have been updated.",
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Hytexercise Wellness Manager</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Combat the effects of prolonged sitting and take charge of your well-being with guided, five-minute chair exercises every hour.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status & Controls Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5"/> Status & Controls</CardTitle>
            <CardDescription>Activate the app to start receiving break reminders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Hytexercise Active
                </p>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "You will receive break alerts." : "Alerts are currently disabled."}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="Activate Hytexercise"
              />
            </div>
            <div className="flex items-center text-lg">
              <Timer className="mr-3 h-6 w-6 text-primary"/>
              <div className="flex-1">
                <span>Next break in:</span>
                <span className="font-bold ml-2">
                  {isActive ? '59:23' : 'Paused'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/> Settings</CardTitle>
            <CardDescription>Customize your break schedule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Break Frequency (minutes)</Label>
              <Input id="frequency" type="number" value={breakFrequency} onChange={(e) => setBreakFrequency(Number(e.target.value))} placeholder="e.g., 60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Break Duration (minutes)</Label>
              <Input id="duration" type="number" value={breakDuration} onChange={(e) => setBreakDuration(Number(e.target.value))} placeholder="e.g., 5" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </CardFooter>
        </Card>
        
        {/* Today's Exercise Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5"/> Today's Exercise</CardTitle>
            <CardDescription>A preview of the next exercise routine.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                <Image src="https://placehold.co/600x400.png" alt="Exercise preview placeholder" layout="fill" objectFit="cover" data-ai-hint="chair exercise" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <p className="text-white font-semibold">Animation Placeholder</p>
                </div>
            </div>
          </CardContent>
        </Card>
        
        {/* My Progress Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5"/> My Progress</CardTitle>
            <CardDescription>Track your consistency and see how you're doing over time.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>Your activity report will be displayed here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
