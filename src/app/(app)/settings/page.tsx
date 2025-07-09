
import { UserNav } from "@/components/user-nav";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </header>
      <div className="max-w-md mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Your user profile information. Click to edit.</CardDescription>
            </CardHeader>
            <CardContent>
                <UserNav />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
