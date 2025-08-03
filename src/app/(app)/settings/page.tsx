
"use client";

import { ProfileCard } from "@/components/settings/profile-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function PreferencesCard() {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();

  const handleTogglePreference = (key: keyof typeof preferences, checked: boolean) => {
    updatePreferences({ [key]: checked });
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Manage your application preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Manage your application preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label htmlFor="dictation-switch" className="text-base">Show Voice Dictation Buttons</Label>
                <p className="text-sm text-muted-foreground">
                    Display the microphone icon for voice-to-text input in forms and chat.
                </p>
            </div>
            <Switch
                id="dictation-switch"
                checked={preferences?.showDictationButton}
                onCheckedChange={(checked) => handleTogglePreference('showDictationButton', checked)}
            />
        </div>
         <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label htmlFor="command-frame-switch" className="text-base">Show Command Frame</Label>
                <p className="text-sm text-muted-foreground">
                    Display the "Give a Command" and "Ask a Question" frame on the Action Manager.
                </p>
            </div>
            <Switch
                id="command-frame-switch"
                checked={preferences?.showCommandFrame}
                onCheckedChange={(checked) => handleTogglePreference('showCommandFrame', checked)}
            />
        </div>
         <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
                <Label htmlFor="dashboard-frame-switch" className="text-base">Show Dashboard Frame</Label>
                <p className="text-sm text-muted-foreground">
                    Display the "Your Action Dashboard" frame with custom shortcuts.
                </p>
            </div>
            <Switch
                id="dashboard-frame-switch"
                checked={preferences?.showDashboardFrame}
                onCheckedChange={(checked) => handleTogglePreference('showDashboardFrame', checked)}
            />
        </div>
      </CardContent>
    </Card>
  );
}


export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </header>
      <div className="max-w-md mx-auto space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Your user profile information.</CardDescription>
            </CardHeader>
            <CardContent>
                <ProfileCard />
            </CardContent>
        </Card>
        <PreferencesCard />
      </div>
    </div>
  );
}
