
"use client";

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from 'next/dynamic';
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
  Send,
  Paperclip,
  X,
  Plus,
  Image as ImageIcon,
  Minus,
  Code2,
  Sparkles,
  BookUser,
  LoaderCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
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
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { type Contact, type FolderData, mockContacts, mockFolders } from '@/data/contacts';

const OgeemoChatDialog = dynamic(() => import('./ogeemo-chat-dialog'), {
  loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-white" /></div>,
});


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

const newContactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().optional(),
  folderId: z.string({ required_error: "Please select a folder." }),
});

export function ComposeEmailView() {
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

  const [isGenerateImageDialogOpen, setIsGenerateImageDialogOpen] = React.useState(false);
  const [imagePrompt, setImagePrompt] = React.useState('');
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = React.useState<string | null>(null);

  const [isContactPickerOpen, setIsContactPickerOpen] = React.useState(false);
  const [contactPickerTarget, setContactPickerTarget] = React.useState<'recipient' | 'cc' | 'bcc' | null>(null);
  const [allContacts, setAllContacts] = React.useState<Contact[]>(mockContacts);
  const [filteredContacts, setFilteredContacts] = React.useState<Contact[]>(mockContacts);
  const [contactSearch, setContactSearch] = React.useState('');
  const [selectedDialogContacts, setSelectedDialogContacts] = React.useState<string[]>([]);
  const [isNewContactDialogOpen, setIsNewContactDialogOpen] = React.useState(false);
  
  const newContactForm = useForm<z.infer<typeof newContactSchema>>({
    resolver: zodResolver(newContactSchema),
    defaultValues: { name: "", email: "", phone: "", folderId: "" },
  });

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

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;

    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    try {
      const result = await generateImage({ prompt: imagePrompt });
      setGeneratedImageUrl(result.imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred. Please check the console for details.",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleInsertGeneratedImage = () => {
    if (generatedImageUrl) {
      handleFormat('insertImage', generatedImageUrl);
    }
    setIsGenerateImageDialogOpen(false);
    setImagePrompt('');
    setGeneratedImageUrl(null);
  };

  const openContactPicker = (target: 'recipient' | 'cc' | 'bcc') => {
      setContactPickerTarget(target);
      const getTargetState = () => {
          if (target === 'recipient') return recipient;
          if (target === 'cc') return cc;
          if (target === 'bcc') return bcc;
          return '';
      };
      const currentValues = getTargetState().split(',').map(e => e.trim()).filter(Boolean);
      setSelectedDialogContacts(currentValues);
      setContactSearch('');
      setFilteredContacts(allContacts);
      setIsContactPickerOpen(true);
  };

  const handleAddContacts = () => {
      if (!contactPickerTarget) return;
      const emailsString = selectedDialogContacts.join(', ');
      if (contactPickerTarget === 'recipient') setRecipient(emailsString);
      if (contactPickerTarget === 'cc') setCc(emailsString);
      if (contactPickerTarget === 'bcc') setBcc(emailsString);
      setIsContactPickerOpen(false);
  };

  React.useEffect(() => {
      setFilteredContacts(
          allContacts.filter(
              c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                   c.email.toLowerCase().includes(contactSearch.toLowerCase())
          )
      );
  }, [contactSearch, allContacts]);

  const handleToggleDialogContact = (email: string) => {
      setSelectedDialogContacts(prev =>
          prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
      );
  };

  function handleCreateNewContact(values: z.infer<typeof newContactSchema>) {
    const newContact: Contact = {
      id: `c-${Date.now()}`,
      name: values.name,
      email: values.email,
      businessPhone: values.phone || '',
      folderId: values.folderId,
    };
    
    setAllContacts(prev => [...prev, newContact]);
    newContactForm.reset();
    setIsNewContactDialogOpen(false);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
      <Dialog open={isNewContactDialogOpen} onOpenChange={(open) => { setIsNewContactDialogOpen(open); if (!open) newContactForm.reset(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Contact</DialogTitle>
            <DialogDescription>
              Add a new contact to your contact manager. It will be available immediately.
            </DialogDescription>
          </DialogHeader>
          <Form {...newContactForm}>
            <form onSubmit={newContactForm.handleSubmit(handleCreateNewContact)} className="space-y-4 py-4">
              <FormField
                control={newContactForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newContactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newContactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl><Input placeholder="123-456-7890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newContactForm.control}
                name="folderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockFolders.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsNewContactDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Contact</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Dialog open={isContactPickerOpen} onOpenChange={setIsContactPickerOpen}>
        <DialogContent className="sm:max-w-2xl flex flex-col h-[80vh] max-h-[600px]">
          <DialogHeader>
              <DialogTitle>Select Contacts</DialogTitle>
              <DialogDescription>
                  Search for contacts and add them to your email.
              </DialogDescription>
              <div className="flex items-center gap-2 pt-2">
                <Input 
                    placeholder="Search by name or email..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="flex-1"
                />
                <Button variant="outline" onClick={() => setIsNewContactDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Contact
                </Button>
              </div>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6 border-y">
              <div className="p-2">
                  {filteredContacts.length > 0 ? (
                      filteredContacts.map(contact => (
                          <div key={contact.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent">
                              <Checkbox
                                  id={`contact-${contact.id}`}
                                  checked={selectedDialogContacts.includes(contact.email)}
                                  onCheckedChange={() => handleToggleDialogContact(contact.email)}
                              />
                              <Label htmlFor={`contact-${contact.id}`} className="flex flex-col cursor-pointer flex-1">
                                  <span className="font-medium">{contact.name}</span>
                                  <span className="text-sm text-muted-foreground">{contact.email}</span>
                              </Label>
                          </div>
                      ))
                  ) : (
                      <p className="text-center text-muted-foreground py-10">No contacts found.</p>
                  )}
              </div>
          </ScrollArea>
          <DialogFooter>
              <Button variant="ghost" onClick={() => setIsContactPickerOpen(false)}>Cancel</Button>
              <Button onClick={handleAddContacts}>Add Selected ({selectedDialogContacts.length})</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isGenerateImageDialogOpen} onOpenChange={(open) => {
          setIsGenerateImageDialogOpen(open);
          if (!open) {
              setImagePrompt('');
              setGeneratedImageUrl(null);
              setIsGeneratingImage(false);
          }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Image with AI</DialogTitle>
            <DialogDescription>
              Describe the image you want to create. Be as specific as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-prompt">Prompt</Label>
              <Textarea
                id="image-prompt"
                placeholder="e.g., 'A photorealistic cat wearing a tiny wizard hat'"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                disabled={isGeneratingImage}
              />
            </div>
            {isGeneratingImage && (
              <div className="flex justify-center items-center h-48 w-full border-2 border-dashed rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <LoaderCircle className="h-8 w-8 animate-spin" />
                  <p className="text-muted-foreground">Generating image...</p>
                </div>
              </div>
            )}
            {generatedImageUrl && !isGeneratingImage && (
              <div className="relative">
                <img
                  src={generatedImageUrl}
                  alt={imagePrompt}
                  className="rounded-lg w-full h-auto object-contain max-h-96"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-between flex-wrap">
            <Button
              onClick={handleGenerateImage}
              disabled={!imagePrompt.trim() || isGeneratingImage}
            >
              {isGeneratingImage ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
            {generatedImageUrl && (
                <Button
                    onClick={handleInsertGeneratedImage}
                    disabled={isGeneratingImage}
                >
                    Insert Image
                </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                <div className="flex-1 relative">
                  <Input
                    id="to"
                    className="border-0 shadow-none focus-visible:ring-0 flex-1 pr-10"
                    placeholder="recipient@example.com"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                  <Button variant="ghost" size="icon" type="button" onClick={() => openContactPicker('recipient')} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                      <BookUser className="h-4 w-4" />
                      <span className="sr-only">Select from Contacts</span>
                  </Button>
                </div>
                 <div className="flex gap-2 items-center">
                    <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={() => setIsNewContactDialogOpen(true)}>
                        + New Contact
                    </Button>
                    <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground" onClick={() => setShowCc(!showCc)}>Cc</Button>
                    <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground" onClick={() => setShowBcc(!showBcc)}>Bcc</Button>
                </div>
              </div>
              <Separator />
               {showCc && (
                <>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="cc" className="text-sm text-muted-foreground w-12 text-right">Cc</Label>
                        <div className="flex-1 relative">
                          <Input
                              id="cc"
                              className="border-0 shadow-none focus-visible:ring-0 flex-1 pr-10"
                              placeholder="cc@example.com"
                              value={cc}
                              onChange={(e) => setCc(e.target.value)}
                          />
                          <Button variant="ghost" size="icon" type="button" onClick={() => openContactPicker('cc')} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                              <BookUser className="h-4 w-4" />
                              <span className="sr-only">Select from Contacts</span>
                          </Button>
                        </div>
                    </div>
                    <Separator />
                </>
              )}
              {showBcc && (
                  <>
                      <div className="flex items-center gap-4">
                          <Label htmlFor="bcc" className="text-sm text-muted-foreground w-12 text-right">Bcc</Label>
                          <div className="flex-1 relative">
                            <Input
                                id="bcc"
                                className="border-0 shadow-none focus-visible:ring-0 flex-1 pr-10"
                                placeholder="bcc@example.com"
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                            />
                            <Button variant="ghost" size="icon" type="button" onClick={() => openContactPicker('bcc')} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                <BookUser className="h-4 w-4" />
                                <span className="sr-only">Select from Contacts</span>
                            </Button>
                          </div>
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
                  <DropdownMenuItem onMouseDown={preventDefault} onSelect={() => setIsGenerateImageDialogOpen(true)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Generate Image</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onMouseDown={preventDefault} onSelect={handleInsertImage}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>Image from URL</span>
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
                <Button variant="outline" onClick={() => setIsChatOpen(true)}>
                    <Bot className="mr-2 h-4 w-4" />
                    Ogeemo Assistant
                </Button>
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FilePlus className="mr-2 h-4 w-4" />
                    Save as Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
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
            </div>
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Send
            </Button>
          </CardFooter>
        </Card>
      </div>
      {isChatOpen && <OgeemoChatDialog isOpen={isChatOpen} onOpenChange={setIsChatOpen} />}
    </div>
  );
}
