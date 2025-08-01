
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Beaker } from "lucide-react";

export function SandboxView() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Beaker className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4">Sandbox</CardTitle>
          <CardDescription>
            This is a development area for testing new components and features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Feel free to experiment here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
