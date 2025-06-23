
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FilePlus2 } from "lucide-react";

export default function OnboardingPage() {
    return (
        <div className="p-4 sm:p-6 space-y-6 flex flex-col items-center">
            <header className="text-center mb-6 max-w-4xl">
                <h1 className="text-3xl font-bold font-headline text-primary">
                Client Onboarding
                </h1>
                <p className="text-muted-foreground">
                A streamlined process to get your clients set up quickly and accurately.
                </p>
            </header>

            <Card className="w-full max-w-4xl bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle>AI-Powered Client Onboarding</CardTitle>
                    <CardDescription>
                        Get started instantly by uploading a recent tax return, or enter
                        your details manually.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4 p-8">
                    <Button size="lg" className="h-16 w-full sm:w-auto">
                        <UploadCloud className="mr-4 h-6 w-6" />
                        Upload Tax Return PDF
                    </Button>
                    <span className="text-muted-foreground font-semibold">OR</span>
                    <Button size="lg" variant="secondary" className="h-16 w-full sm:w-auto">
                        <FilePlus2 className="mr-4 h-6 w-6" />
                        Manual Data Entry
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
