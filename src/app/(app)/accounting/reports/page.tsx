
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Landmark,
  ShieldCheck,
  FileText,
} from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="p-4 sm:p-6 space-y-6 flex flex-col items-center">
            <header className="text-center mb-6 max-w-4xl">
                <h1 className="text-3xl font-bold font-headline text-primary">
                Reporting Hub
                </h1>
                <p className="text-muted-foreground">
                Generate and view reports tailored for any audience.
                </p>
            </header>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Reporting Hub</CardTitle>
                    <CardDescription>
                        Generate reports tailored for any audience.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <Button variant="outline" className="justify-start">
                        <User className="mr-2 h-4 w-4" /> Owner's View
                    </Button>
                    <Button variant="outline" className="justify-start">
                        <Landmark className="mr-2 h-4 w-4" /> Banker's View
                    </Button>
                    <Button variant="outline" className="justify-start">
                        <ShieldCheck className="mr-2 h-4 w-4" /> Tax Auditor's View
                    </Button>
                    <Button variant="outline" className="justify-start">
                        <FileText className="mr-2 h-4 w-4" /> All Reports
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
