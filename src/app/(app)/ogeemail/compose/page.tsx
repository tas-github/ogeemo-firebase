
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
  FileText,
  FilePlus,
  Mic,
  Send,
  User,
  LoaderCircle,
  Square,
  Paperclip,
  X,
  Plus,
  Image as ImageIcon,
  Minus,
  Code2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { useToast } from '@/hooks/use-toast';
import { askOgeemo } from '@/ai/flows/ogeemo-chat';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const initialTemplates = [
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

type Message = {
  id: string;
  text: string;
  sender: "user" | "ogeemo";
};

export default function ComposeEmailPage() {
  const [recipient, setRecipient] = React.useState('');
  const [cc, setCc] = React.useState('');
  const [bcc, setBcc] = React.useState('');
  const [showCc, setShowCc] = React.useState(false);
  const [showBcc, setShowBcc] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const editorRef = React.useRef<HTMLDivElement>(null);

  const [templates, setTemplates] = React.useState(initialTemplates);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);
  const [newTemplateName, setNewTemplateName] = React.useState('');

  const [attachments, setAttachments] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [isChatLoading, setIsChatLoading] = React.useState(false);
  const chatScrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Speech-to-text for Chat
  const {
    isListening: isChatListening,
    startListening: startChatListening,
    stopListening: stopChatListening,
    isSupported: isChatSupported,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      setChatInput(transcript);
    },
  });

  const [bodyBeforeSpeech, setBodyBeforeSpeech] = React.useState('');
  // Speech-to-text for Editor
  const {
    isListening: isEditorListening,
    startListening: startEditorListening,
    stopListening: stopEditorListening,
    isSupported: isEditorSupported,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      if (editorRef.current) {
        const newContent = bodyBeforeSpeech ? `${bodyBeforeSpeech} ${transcript}` : transcript;
        editorRef.current.innerHTML = newContent;
        setBody(newContent);

        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    },
  });

  const handleEditorMicClick = () => {
    if (isEditorListening) {
      stopEditorListening();
    } else {
      setBodyBeforeSpeech(body);
      startEditorListening();
      editorRef.current?.focus();
    }
  };

  React.useEffect(() => {
    if (isChatSupported === false || isEditorSupported === false) {
      toast({
        variant: "destructive",
        title: "Voice Input Not Supported",
        description: "Your browser does not support the Web Speech API.",
      });
    }
  }, [isChatSupported, isEditorSupported, toast]);

  React.useEffect(() => {
    if (chatScrollAreaRef.current) {
      chatScrollAreaRef.current.scrollTo({
        top: chatScrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    if (isChatListening) {
      stopChatListening();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: chatInput,
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await askOgeemo({ message: chatInput });
      const ogeemoMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.reply,
        sender: "ogeemo",
      };
      setMessages((prev) => [...prev, ogeemoMessage]);
    } catch (error) {
      console.error("Error with Ogeemo:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ogeemo",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };


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
  
  const handleInsertImage = () => {
    const url = window.prompt("Enter the image URL:");
    if (url) {
      handleFormat('insertImage', url);
    }
  };

  const handleTemplateSelect = (content: string) => {
    setBody(content);
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      editorRef.current.focus();
    }
  };
  
  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || !body.trim()) {
        alert("Template name and body cannot be empty.");
        return;
    }
    setTemplates(prev => [...prev, { name: newTemplateName, content: body }]);
    setNewTemplateName("");
    setIsTemplateDialogOpen(false);
  };

  const preventDefault = (e: React.MouseEvent) => e.preventDefault();

  const handleChatOpenChange = (open: boolean) => {
    setIsChatOpen(open);
    if (!open && isChatListening) {
      stopChatListening();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = ''; // Reset file input
    }
  };
  
  const handleRemoveAttachment = (fileName: string) => {
      setAttachments(prev => prev.filter(file => file.name !== fileName));
  };


  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
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
                <Label htmlFor="to" className="text-sm text-muted-foreground w-12 text-right">
                  To
                </Label>
                <Input
                  id="to"
                  className="border-0 shadow-none focus-visible:ring-0 flex-1"
                  placeholder="recipient@example.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
                 <div className="flex gap-2">
                    <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground" onClick={() => setShowCc(!showCc)}>Cc</Button>
                    <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground" onClick={() => setShowBcc(!showBcc)}>Bcc</Button>
                </div>
              </div>
              <Separator />
               {showCc && (
                <>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="cc" className="text-sm text-muted-foreground w-12 text-right">Cc</Label>
                        <Input
                            id="cc"
                            className="border-0 shadow-none focus-visible:ring-0 flex-1"
                            placeholder="cc@example.com"
                            value={cc}
                            onChange={(e) => setCc(e.target.value)}
                        />
                    </div>
                    <Separator />
                </>
              )}
              {showBcc && (
                  <>
                      <div className="flex items-center gap-4">
                          <Label htmlFor="bcc" className="text-sm text-muted-foreground w-12 text-right">Bcc</Label>
                          <Input
                              id="bcc"
                              className="border-0 shadow-none focus-visible:ring-0 flex-1"
                              placeholder="bcc@example.com"
                              value={bcc}
                              onChange={(e) => setBcc(e.target.value)}
                          />
                      </div>
                      <Separator />
                  </>
              )}
              <div className="flex items-center gap-4">
                <Label htmlFor="subject" className="text-sm text-muted-foreground w-12 text-right">
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
                  <Button variant="ghost" className="justify-between">
                    Headings
                    <ChevronDown className="h-4 w-4" />
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
                  <Button variant="ghost" className="justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Templates
                    </span>
                    <ChevronDown className="h-4 w-4" />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="justify-between">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Insert
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onMouseDown={preventDefault} onSelect={handleInsertImage}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>Image</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onMouseDown={preventDefault} onSelect={() => handleFormat('insertHorizontalRule')}>
                    <Minus className="mr-2 h-4 w-4" />
                    <span>Horizontal Line</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onMouseDown={preventDefault} onSelect={() => handleFormat('formatBlock', 'pre')}>
                    <Code2 className="mr-2 h-4 w-4" />
                    <span>Code Block</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Separator orientation="vertical" className="h-6" />
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
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}>
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Blockquote" onMouseDown={preventDefault} onClick={() => handleFormat('formatBlock', 'blockquote')}>
                <Quote className="h-4 w-4" />
              </Button>
               <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="icon" title="Insert Link" onMouseDown={preventDefault} onClick={handleCreateLink}>
                <LinkIcon className="h-4 w-4" />
              </Button>
               <Button variant="ghost" size="icon" title="Attach File" onMouseDown={preventDefault} onClick={handleAttachmentClick}>
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="p-2 border-b">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <Badge key={file.name} variant="secondary" className="flex items-center gap-2">
                      <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                      <button
                        onClick={() => handleRemoveAttachment(file.name)}
                        className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
                <div
                    ref={editorRef}
                    className="prose dark:prose-invert max-w-none focus:outline-none min-h-full"
                    contentEditable={true}
                    onInput={(e) => setBody(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: body }}
                    placeholder="Compose your message..."
                />
            </div>
          </CardContent>
          <CardFooter className="border-t p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <Dialog open={isChatOpen} onOpenChange={handleChatOpenChange}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Bot className="mr-2 h-4 w-4" />
                    Ogeemo Assistant
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl flex flex-col h-[80vh] max-h-[600px]">
                    <DialogHeader>
                      <DialogTitle>Chat with Ogeemo</DialogTitle>
                      <DialogDescription>
                        Ask me anything or tell me what you would like to do.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden -mx-6 px-6">
                      <ScrollArea className="h-full pr-4" ref={chatScrollAreaRef}>
                        <div className="space-y-4">
                          {messages.length === 0 && (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              Start the conversation...
                            </div>
                          )}
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex items-start gap-3",
                                message.sender === "user" ? "justify-end" : "justify-start"
                              )}
                            >
                              {message.sender === "ogeemo" && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    <Bot />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={cn(
                                  "max-w-xs md:max-w-sm rounded-lg px-4 py-2 text-sm",
                                  message.sender === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                )}
                              >
                                {message.text}
                              </div>
                              {message.sender === "user" && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    <User />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          ))}
                          {isChatLoading && (
                            <div className="flex items-start gap-3 justify-start">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  <Bot />
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center">
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                    <DialogFooter className="pt-4 border-t">
                      <form
                        onSubmit={handleSendMessage}
                        className="flex w-full items-center space-x-2"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "flex-shrink-0",
                            isChatListening && "text-destructive"
                          )}
                          onClick={
                            isChatListening ? stopChatListening : startChatListening
                          }
                          disabled={!isChatSupported || isChatLoading}
                          title={
                            !isChatSupported
                              ? "Voice input not supported"
                              : isChatListening
                              ? "Stop listening"
                              : "Start listening"
                          }
                        >
                          {isChatListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                          <span className="sr-only">Use Voice</span>
                        </Button>
                        <Input
                          placeholder="Enter your message here..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          disabled={isChatLoading}
                          autoComplete="off"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={isChatLoading || !chatInput.trim()}
                        >
                          <Send className="h-5 w-5" />
                          <span className="sr-only">Send Message</span>
                        </Button>
                      </form>
                    </DialogFooter>
                  </DialogContent>
              </Dialog>
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Save as Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save as New Template</DialogTitle>
                    <DialogDescription>
                      Enter a name for your new email template. The current email body will be saved as the content.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="template-name"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g. 'Project Follow-up'"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveTemplate}>Save Template</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {isEditorListening ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleEditorMicClick}
                  className="w-28 animate-pulse"
                  title="Stop composing"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditorMicClick}
                  disabled={isEditorSupported === false}
                  className="w-28"
                  title={
                    isEditorSupported === false
                      ? "Voice input not supported"
                      : "Compose with voice"
                  }
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Dictate
                </Button>
              )}
            </div>
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
