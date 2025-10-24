'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addTextFileClient } from '@/services/file-service';

export default function SandboxPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testFileName, setTestFileName] = useState('');
  const [testContent, setTestContent] = useState('');

  const handleTestSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in.' });
      return;
    }
    if (!testFileName.trim()) {
      toast({ variant: 'destructive', title: 'File Name Required', description: 'Please enter a name for the file.' });
      return;
    }
    if (!testContent.trim()) {
      toast({ variant: 'destructive', title: 'Content is empty.' });
      return;
    }

    try {
      // For this test, we'll save to an "unfiled" location by passing an empty string for folderId.
      const newFile = await addTextFileClient(user.uid, '', testFileName, testContent);
      toast({ title: 'Test Save Successful', description: `File "${newFile.name}" saved.` });
      setTestContent('');
      setTestFileName('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Test Save Failed', description: error.message });
    }
  };


  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Content Test Card</CardTitle>
          <CardDescription>
            This is an isolated area to test content creation and saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-file-name">File Name</Label>
            <Input
              id="test-file-name"
              value={testFileName}
              onChange={(e) => setTestFileName(e.target.value)}
              placeholder="Enter a file name..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-input">Enter your content here:</Label>
            <Textarea
              id="content-input"
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              rows={10}
              placeholder="Start typing..."
            />
          </div>
          <Button onClick={handleTestSave}>Save Document</Button>
        </CardContent>
      </Card>
    </div>
  );
}
