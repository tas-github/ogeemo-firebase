
"use client";

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  DialogTrigger,
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

const OgeemoChatDialog = dynamic(() => import('@/components/ogeemail/ogeemo-chat-dialog'), {
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
  const [unresolvedRecipient, setUnresolvedRecipient] = React.useState<string | null>(null);

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
  const [allContacts, setAllContacts] = React.useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = React.useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = React.useState('');
  const [selectedDialogContacts, setSelectedDialogContacts] = React.useState<string[]>([]);
  const [isNewContactDialogOpen, setIsNewContactDialogOpen] = React.useState(false);
  
  const newContactForm = useForm<z.infer<typeof newContactSchema>>({
    resolver: zodResolver(newContactSchema),
    defaultValues: { name: "", email: "", phone: "", folderId: "" },
  });
  
  React.useEffect(() => {
    // Simulate fetching contacts
    const contactsWithUserId = mockContacts.map(c => ({...c, userId: 'mock-user-id' }));
    setAllContacts(contactsWithUserId);
    setFilteredContacts(contactsWithUserId);
  }, []);

  const handleRecipientBlur = React.useCallback(() => {
    const input = recipient.trim();
    if (!input) {
      setUnresolvedRecipient(null);
      return;
    }

    // Don't re-format if it's already in "Name" <email> format
    if (input.match(/".*" <.+>/)) {
      setUnresolvedRecipient(null);
      return;
    }

    const lowerInput = input.toLowerCase();
    const contact = allContacts.find(c => c.email.toLowerCase() === lowerInput || c.name.toLowerCase() === lowerInput);

    if (contact) {
      setRecipient(`"${contact.name}" <${contact.email}>`);
      setUnresolvedRecipient(null);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(input)) {
        setUnresolvedRecipient(input);
      } else {
        setUnresolvedRecipient(null);
      }
    }
  }, [recipient, allContacts]);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };
  
  const handleOpenNewContactDialog = (email: string) => {
    newContactForm.reset({ email, name: '', phone: '', folderId: '' });
    setIsNewContactDialogOpen(true);
  };
  
  function handleCreateNewContact(values: z.infer<typeof newContactSchema>) {
    const newContact: Contact = {
      id: `c-${Date.now()}`,
      name: values.name,
      email: values.email,
      businessPhone: values.phone || '',
      folderId: values.folderId,
      userId: 'mock-user-id', 
    };
    
    const updatedContacts = [...allContacts, newContact];
    setAllContacts(updatedContacts);
    newContactForm.reset();
    setIsNewContactDialogOpen(false);
    
    // Auto-fill the recipient field with the newly created contact
    if (recipient === newContact.email) {
      setRecipient(`"${newContact.name}" <${newContact.email}>`);
      setUnresolvedRecipient(null);
    }

    toast({ title: 'Contact Created', description: `${newContact.name} has been added.` });
  }

  // Simplified functions from the original implementation
  const handleAttachmentClick = () => fileInputRef.current?.click();
  const handleTemplateSelect = (content: string) => {
    setBody(content);
    if (editorRef.current) {
      editorRef.current.innerHTML = content;
    }
  };
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    try {
      const result = await generateImage({ prompt: imagePrompt });
      setGeneratedImageUrl(result.imageUrl);
    } catch (error) {
      toast({ variant: "destructive", title: "Image Generation Failed" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleInsertGeneratedImage = () => {
    if (generatedImageUrl) {
      handleFormat('insertImage', generatedImageUrl);
    }
    setIsGenerateImageDialogOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
       <input type="file" ref={fileInputRef} className="hidden" multiple />
       
       <Dialog open={isNewContactDialogOpen} onOpenChange={setIsNewContactDialogOpen}>
         <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Contact</DialogTitle>
            </DialogHeader>
            <Form {...newContactForm}>
                <form onSubmit={newContactForm.handleSubmit(handleCreateNewContact)} className="space-y-4 py-4">
                     <FormField control={newContactForm.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                     <FormField control={newContactForm.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
                     <FormField control={newContactForm.control} name="folderId" render={({ field }) => ( <FormItem> <FormLabel>Folder</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a folder" /></SelectTrigger></FormControl><SelectContent>{mockFolders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                     <DialogFooter className="pt-4 !mt-0">
                         <Button type="button" variant="ghost" onClick={() => setIsNewContactDialogOpen(false)}>Cancel</Button>
                         <Button type="submit">Create Contact</Button>
                     </DialogFooter>
                </form>
            </Form>
         </DialogContent>
       </Dialog>
      
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Compose Email</h1>
      </header>
      
      <div className="flex-1 min-h-0">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <Label htmlFor="to" className="text-sm text-muted-foreground w-12 text-right">To</Label>
                <div className="flex-1">
                  <Input id="to" className="border-0 shadow-none focus-visible:ring-0" value={recipient} onChange={(e) => setRecipient(e.target.value)} onBlur={handleRecipientBlur} />
                   {unresolvedRecipient && (
                      <div className="pl-2 pt-1 text-xs text-muted-foreground">
                        <span className="mr-1">Contact not found.</span>
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => handleOpenNewContactDialog(unresolvedRecipient)}>Add contact?</Button>
                      </div>
                   )}
                </div>
                 <div className="flex gap-2 items-center">
                    <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground" onClick={() => setShowCc(!showCc)}>Cc</Button>
                    <Button variant="link" size="sm" className="p-0 h-auto text-muted-foreground" onClick={() => setShowBcc(!showBcc)}>Bcc</Button>
                </div>
              </div>
              <Separator />
               {showCc && (
                <>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="cc" className="text-sm text-muted-foreground w-12 text-right">Cc</Label>
                        <Input id="cc" className="border-0 shadow-none focus-visible:ring-0" value={cc} onChange={(e) => setCc(e.target.value)} />
                    </div>
                    <Separator />
                </>
              )}
              {showBcc && (
                  <>
                      <div className="flex items-center gap-4">
                          <Label htmlFor="bcc" className="text-sm text-muted-foreground w-12 text-right">Bcc</Label>
                          <Input id="bcc" className="border-0 shadow-none focus-visible:ring-0" value={bcc} onChange={(e) => setBcc(e.target.value)} />
                      </div>
                      <Separator />
                  </>
              )}
              <div className="flex items-center gap-4">
                <Label htmlFor="subject" className="text-sm text-muted-foreground w-12 text-right">Subject</Label>
                <Input id="subject" className="border-0 shadow-none focus-visible:ring-0" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <div className="p-2 border-b flex items-center gap-1 flex-wrap">
                <Button variant="ghost" size="icon" title="Bold" onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Italic" onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Underline" onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="icon" title="Unordered List" onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Ordered List" onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
                 <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="icon" title="Attach File" onClick={handleAttachmentClick}><Paperclip className="h-4 w-4" /></Button>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Generate Image" onClick={() => setIsGenerateImageDialogOpen(true)}><ImageIcon className="h-4 w-4" /></Button>
                </DialogTrigger>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div
                    ref={editorRef}
                    className="prose dark:prose-invert max-w-none focus:outline-none min-h-full"
                    contentEditable={true}
                    onInput={(e) => setBody(e.currentTarget.innerHTML)}
                    placeholder="Compose your message..."
                    dir="ltr"
                />
            </div>
          </CardContent>
          <CardFooter className="border-t p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsChatOpen(true)}><Bot className="mr-2 h-4 w-4" /> Ogeemo Assistant</Button>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Templates</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {templates.map(t => <DropdownMenuItem key={t.name} onSelect={() => handleTemplateSelect(t.content)}>{t.name}</DropdownMenuItem>)}
                            <DropdownMenuSeparator />
                            <DialogTrigger asChild><DropdownMenuItem><FilePlus className="mr-2 h-4 w-4" /> Save as Template</DropdownMenuItem></DialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Save as Template</DialogTitle></DialogHeader>
                        <div className="py-4"><Input placeholder="Template Name" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} /></div>
                        <DialogFooter><Button variant="ghost" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button><Button>Save</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Button><Send className="mr-2 h-4 w-4" /> Send</Button>
          </CardFooter>
        </Card>
      </div>

       <Dialog open={isGenerateImageDialogOpen} onOpenChange={setIsGenerateImageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Image with AI</DialogTitle>
              <DialogDescription>Describe the image you want to create.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea placeholder="A photorealistic cat..." value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} disabled={isGeneratingImage} />
              {isGeneratingImage && <div className="flex justify-center items-center h-48 w-full border-2 border-dashed rounded-lg"><LoaderCircle className="h-8 w-8 animate-spin" /></div>}
              {generatedImageUrl && !isGeneratingImage && <img src={generatedImageUrl} alt={imagePrompt} className="rounded-lg w-full h-auto object-contain max-h-96" />}
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button onClick={handleGenerateImage} disabled={!imagePrompt.trim() || isGeneratingImage}>{isGeneratingImage ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><Sparkles className="mr-2 h-4 w-4" />Generate</>}</Button>
              {generatedImageUrl && <Button onClick={handleInsertGeneratedImage} disabled={isGeneratingImage}>Insert Image</Button>}
            </DialogFooter>
          </DialogContent>
       </Dialog>
      {isChatOpen && <OgeemoChatDialog isOpen={isChatOpen} onOpenChange={setIsChatOpen} />}
    </div>
  );
}
