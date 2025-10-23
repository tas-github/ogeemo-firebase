'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function SandboxPage() {
  const [content, setContent] = useState('');

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Content Test Card</CardTitle>
          <CardDescription>
            This is an isolated area to test content creation and saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="content-input">Enter your content here:</Label>
            <Textarea
              id="content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Start typing..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
