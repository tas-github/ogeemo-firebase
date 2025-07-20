
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

export function ProjectStepsView() {
  return (
    <div className="p-4 sm:p-6 flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-2xl text-center">
            <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <HardHat className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4 text-2xl font-bold font-headline text-primary">Define Project Steps</CardTitle>
                <CardDescription>
                    This page is under construction. Soon, you'll be able to define, template, and schedule all the tasks for your project right here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/projects">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Project Manager
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
