
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
  Strikethrough,
  Quote,
  Link as LinkIcon,
  ChevronDown,
  FileText
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const templates = [
  {
    name: 'General Inquiry',
    content: '<p>Hello,</p><p><br></p><p>I am writing to inquire about...</p><p><br></p><p>Thank you for your time.</p><p>Best regards,</p><p>[Your Name]</p>',
  },
  {
    name: 'Meeting Request',
    content: '<h3>Meeting Request: [Subject]</h3><p>Hello team,</p><p><br></p><p>I would like to schedule a meeting to discuss [Topic]. Please let me know what time works best for you in the coming days.</p><p><br></p><p>Best,</p><p>[Your Name]</p>',
  },
  {
    name: 'Thank You',
    content: '<p>Dear [Name],</p><p><br></p><p>Thank you so much for [Reason]. I really appreciate it.</p><p><br></p><p>All the best,</p><p>[Your Name]</p>',
  },
  {
    name: 'Follow-up',
    content: '<p>Hi [Name],</p><p><br></p><p>I am writing to follow up on our previous conversation about [Topic]. Do you have any updates?</p><p><br></p><p>Thanks,</p><p>[Your Name]</p>',
  },
];

export default function ComposeEmailPage() {
  const [recipient, setRecipient] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const editorRef = React.useRef<HTMLDivElement>(null);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleCreateLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      alert("Please select the text you want to hyperlink.");
      return;
    }
    const url = window.prompt("Enter the URL:");
    if (url) {
      handleFormat('createLink', url);
    }
  };

  const handleTemplateSelect = (content: string) => {
    setBody(content);
    if (editorRef.current) {
      editorRef.current.innerHTML = content;

      // Move cursor to end of content
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      editorRef.current.focus();
    }
  };

  const preventDefault = (e: React.MouseEvent) => e.preventDefault();

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-28 justify-start">
                    Headings
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => handleFormat('formatBlock', 'p')}>Paragraph</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleFormat('formatBlock', 'h1')} className="text-2xl font-bold">Heading 1</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleFormat('formatBlock', 'h2')} className="text-xl font-bold">Heading 2</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleFormat('formatBlock', 'h3')} className="text-lg font-bold">Heading 3</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-32 justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Templates
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {templates.map((template) => (
                    <DropdownMenuItem
                      key={template.name}
                      onSelect={() => handleTemplateSelect(template.content)}
                    >
                      {template.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}>
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}>
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}>
                <Underline className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Strikethrough" onMouseDown={preventDefault} onClick={() => handleFormat('strikeThrough')}>
                <Strikethrough className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}>
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Blockquote" onMouseDown={preventDefault} onClick={() => handleFormat('formatBlock', 'blockquote')}>
                <Quote className="h-4 w-4" />
              </Button>
               <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon" title="Insert Link" onMouseDown={preventDefault} onClick={handleCreateLink}>
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div
                    ref={editorRef}
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
