
"use client";

import {
  Inbox,
  Star,
  Send,
  Archive,
  Pencil,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function OgeeMailWelcomePage() {
  const router = useRouter();

  // We will add compose functionality later. For now, it can be a placeholder.
  const handleComposeClick = () => {
    // Later, this will open a comprehensive compose dialog.
    // For now, we can use a toast or console log to show it's a future feature.
    console.log("Compose button clicked. Feature coming soon!");
    // In the future, you might use: toast({ title: "Compose feature coming soon!" });
  };

  const quickNavItems = [
    { icon: Inbox, label: "Inbox", action: () => console.log("Navigate to Inbox") },
    { icon: Star, label: "Starred", action: () => console.log("Navigate to Starred") },
    { icon: Send, label: "Sent", action: () => console.log("Navigate to Sent") },
    { icon: Archive, label: "Archive", action: () => console.log("Navigate to Archive") },
  ];

  return (
    <div className="p-4 sm:p-6 flex flex-col flex-1 space-y-6 min-h-0">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Welcome to OgeeMail
        </h1>
        <p className="text-muted-foreground">
          Your intelligent, streamlined, and voice-powered email experience.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6 items-start flex-1">
        {/* Primary Action Card */}
        <Card className="flex flex-col h-full">
          <CardHeader className="text-center">
            <CardTitle>Ready to Write?</CardTitle>
            <CardDescription>
              Start drafting a new message with our powerful compose tool.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <Button size="lg" className="h-16 text-lg px-8" onClick={handleComposeClick}>
              <Pencil className="mr-4 h-6 w-6" />
              Compose Email
            </Button>
          </CardContent>
          <CardFooter className="text-center text-sm text-muted-foreground justify-center">
            <p>Click here to begin your next conversation.</p>
          </CardFooter>
        </Card>

        {/* Quick Navigation & Feature Spotlight */}
        <div className="space-y-6">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle>Quick Navigation</CardTitle>
                    <CardDescription>Jump to any folder instantly.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {quickNavItems.map((item) => (
                        <Button key={item.label} variant="outline" className="flex flex-col h-20 gap-2" onClick={item.action}>
                            <item.icon className="w-6 h-6" />
                            <span>{item.label}</span>
                        </Button>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="text-center">
                    <CardTitle>Feature Spotlight</CardTitle>
                    <CardDescription>Voice-Powered Communication</CardDescription>
                </CardHeader>
                <CardContent className="text-center flex flex-col items-center gap-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <Mic className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        OgeeMail integrates voice-to-text in every appropriate field. Just click the microphone icon and start talking to draft emails, search your inbox, and more—all hands-free.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
