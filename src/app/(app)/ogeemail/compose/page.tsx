
"use client";

import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Mail,
  Bot,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function ComposeEmailPage() {
  const [recipient, setRecipient] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');

  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Compose Email
        </h1>
        <p className="text-muted-foreground">
          Draft your next message with the help of Ogeemo.
        </p>
      </header>
      <div className="flex-1 min-h-0">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <Label htmlFor="to" className="text-sm text-muted-foreground">
                  To
                </Label>
                <Input
                  id="to"
                  className="border-0 shadow-none focus-visible:ring-0"
                  placeholder="recipient@example.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <Label htmlFor="subject" className="text-sm text-muted-foreground">
                  Subject
                </Label>
                <Input
                  id="subject"
                  className="border-0 shadow-none focus-visible:ring-0"
                  placeholder="Your email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <div className="p-2 border-b flex items-center gap-1 flex-wrap">
              <Button variant="ghost" size="icon" title="Bold">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Italic">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Underline">
                <Underline className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon" title="Unordered List">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Ordered List">
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div
                    className="prose dark:prose-invert max-w-none focus:outline-none min-h-full"
                    contentEditable={true}
                    onInput={(e) => setBody(e.currentTarget.innerHTML)}
                    placeholder="Compose your message..."
                />
            </div>
          </CardContent>
          <CardFooter className="border-t p-3 flex justify-between items-center">
            <Button variant="outline">
              <Bot className="mr-2 h-4 w-4" />
              Ogeemo Assistant
            </Button>
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Send
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
