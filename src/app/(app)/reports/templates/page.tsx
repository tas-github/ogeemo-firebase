
'use client';

import { useState, useRef, useEffect } from "react";
import { format } from 'date-fns';
import { ReportsPageHeader } from "@/components/reports/page-header";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Mic,
  Square,
  Copy,
  Trash2,
  Save,
  FileText,
  Pencil,
  LoaderCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type FileItem, REPORT_TEMPLATE_MIMETYPE } from "@/data/files";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getFiles, addFile, updateFile, deleteFiles } from "@/services/file-service";

const REPORT_TEMPLATES_FOLDER_ID = 'folder-reports';

export default function ReportTemplatesPage() {
    const [allFiles, setAllFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [activeTemplate, setActiveTemplate] = useState<Partial<FileItem> | null>(null);
    
    const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");

    const editorRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [notesBeforeSpeech, setNotesBeforeSpeech] = useState('');

    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            try {
                const fetchedFiles = await getFiles();
                setAllFiles(fetchedFiles);
            } catch (error: any) {
                console.error("Failed to load templates:", error);
                toast({
                    variant: "destructive",
                    title: "Failed to load templates",
                    description: error.message || "Could not retrieve templates from the database.",
                });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [toast]);
    
    // Effect to update the active template when selection changes
    useEffect(() => {
      if (selectedTemplateId) {
        const foundTemplate = allFiles.find(f => f.id === selectedTemplateId);
        setActiveTemplate(foundTemplate || null);
      } else {
        setActiveTemplate(null);
      }
    }, [selectedTemplateId, allFiles]);

    // Update editor when active template changes
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = activeTemplate?.content || '';
        }
    }, [activeTemplate]);

    const reportTemplates = allFiles.filter(f => f.folderId === REPORT_TEMPLATES_FOLDER_ID);

    const {
        isListening,
        startListening,
        stopListening,
        isSupported,
    } = useSpeechToText({
        onTranscript: (transcript) => {
            const newText = notesBeforeSpeech ? `${notesBeforeSpeech} ${transcript}` : transcript;
            if (editorRef.current) {
                editorRef.current.innerHTML = newText;
                // update state
                setActiveTemplate(prev => prev ? { ...prev, content: newText } : null);
                // move cursor
                const range = document.createRange();
                const sel = window.getSelection();
                if (sel) {
                    range.selectNodeContents(editorRef.current);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        },
    });

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            setNotesBeforeSpeech(activeTemplate?.content || '');
            startListening();
            editorRef.current?.focus();
        }
    };
    
    const handleConfirmNewTemplate = async () => {
        if (!newTemplateName.trim()) {
            toast({ variant: 'destructive', title: 'Template name is required.' });
            return;
        }

        const newTemplateData: Omit<FileItem, 'id'> = {
            name: newTemplateName.trim(),
            folderId: REPORT_TEMPLATES_FOLDER_ID,
            type: REPORT_TEMPLATE_MIMETYPE,
            content: '', // Start with blank content
            size: 0,
            modifiedAt: new Date(),
        };

        try {
            const newTemplate = await addFile(newTemplateData);
            setAllFiles(prev => [...prev, newTemplate]);
            setSelectedTemplateId(newTemplate.id); // Select the new template
            setIsNewTemplateDialogOpen(false); // Close the dialog
            setNewTemplateName(""); // Reset the input
            
            toast({
                title: "Template Created",
                description: `"${newTemplate.name}" is ready for editing.`,
            });
        } catch (error: any) {
             console.error("Failed to create template:", error);
             toast({ variant: 'destructive', title: 'Create Failed', description: error.message });
        }
    };
  
    const handleSaveTemplate = async () => {
        if (!activeTemplate || !activeTemplate.name?.trim() || !activeTemplate.id) {
            toast({ variant: 'destructive', title: 'Cannot save template.', description: 'The template must have a name and ID.' });
            return;
        }

        const templateToSave: Partial<FileItem> = {
            name: activeTemplate.name.trim(),
            content: activeTemplate.content || '',
            size: (activeTemplate.content || '').length,
            modifiedAt: new Date(),
        };
        
        try {
            await updateFile(activeTemplate.id, templateToSave);
            setAllFiles(prev => prev.map(f => f.id === activeTemplate.id ? { ...f, ...templateToSave, modifiedAt: templateToSave.modifiedAt! } as FileItem : f));
            toast({ title: 'Template Saved!', description: `Changes to "${templateToSave.name}" have been saved.` });
        } catch (error: any) {
            console.error("Failed to save template:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        }
    };

    const handleCopyActiveTemplate = async () => {
        if (!activeTemplate) return;
        
        const templateToCopy = allFiles.find(f => f.id === activeTemplate.id);
        if (!templateToCopy) return;

        const newFileData: Omit<FileItem, 'id'> = {
            ...templateToCopy,
            name: `${templateToCopy.name} (Copy)`,
            modifiedAt: new Date(),
        };
        delete (newFileData as any).id;
        
        try {
            const newFile = await addFile(newFileData);
            setAllFiles(prev => [...prev, newFile]);
            setSelectedTemplateId(newFile.id);
            toast({ title: "Template Copied" });
        } catch (error: any) {
            console.error("Failed to copy template:", error);
            toast({ variant: 'destructive', title: 'Copy Failed', description: error.message });
        }
    };

    const handleDeleteActiveTemplate = async () => {
        if (!activeTemplate || !activeTemplate.id) return;
        const templateId = activeTemplate.id;

        const template = allFiles.find(f => f.id === templateId);
        if (template && window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
            try {
                await deleteFiles([templateId]);
                setAllFiles(prev => prev.filter(f => f.id !== templateId));
                if (selectedTemplateId === templateId) {
                    setSelectedTemplateId(null);
                }
                toast({ title: "Template Deleted", variant: 'destructive' });
            } catch (error: any) {
                console.error("Failed to delete template:", error);
                toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
            }
        }
    };

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
        if (!isListening) {
            const newContent = e.currentTarget.innerHTML;
            setActiveTemplate(prev => prev ? { ...prev, content: newContent } : null);
        }
    };

    const preventDefault = (e: React.MouseEvent) => e.preventDefault();
    
    if (isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    const renderTemplateList = () => (
      <div className="p-2">
        <Dialog open={isNewTemplateDialogOpen} onOpenChange={(open) => {
            setIsNewTemplateDialogOpen(open);
            if (!open) setNewTemplateName('');
        }}>
          <DialogTrigger asChild>
            <Button className="w-full mb-2">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Please enter a name for your new report template.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="new-template-name">Template Name</Label>
              <Input
                id="new-template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., 'Monthly Client Update'"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmNewTemplate();
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewTemplateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmNewTemplate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-1">
            {reportTemplates.map(template => (
                <Button
                    key={template.id}
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-left h-auto py-2 flex flex-col items-start",
                        selectedTemplateId === template.id && "bg-accent"
                    )}
                    onClick={() => setSelectedTemplateId(template.id)}
                >
                    <p className="font-semibold truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(template.modifiedAt), 'MMM d, yyyy')}</p>
                </Button>
            ))}
            </div>
        </ScrollArea>
      </div>
    );
    
    const renderEditor = () => (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2">
            <Input
                ref={nameInputRef}
                placeholder="Untitled Template"
                value={activeTemplate?.name || ''}
                onChange={(e) => setActiveTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 p-0 h-auto flex-1 min-w-[200px]"
            />
            <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveTemplate} className="bg-orange-500 hover:bg-orange-600 text-white"><Save className="mr-2 h-4 w-4" /> Save</Button>
                <Button size="sm" disabled className="bg-orange-500 hover:bg-orange-600 text-white"><FileText className="mr-2 h-4 w-4" /> Open</Button>
                <Button size="sm" onClick={() => nameInputRef.current?.focus()} className="bg-orange-500 hover:bg-orange-600 text-white"><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                <Button size="sm" onClick={handleCopyActiveTemplate} className="bg-orange-500 hover:bg-orange-600 text-white"><Copy className="mr-2 h-4 w-4" /> Copy</Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteActiveTemplate}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
            </div>
        </div>
        <div className="p-2 border-b flex items-center gap-1 flex-wrap">
            <Button variant="ghost" size="icon" title="Bold" onMouseDown={preventDefault} onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Italic" onMouseDown={preventDefault} onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Underline" onMouseDown={preventDefault} onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Strikethrough" onMouseDown={preventDefault} onClick={() => handleFormat('strikeThrough')}><Strikethrough className="h-4 w-4" /></Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" title="Unordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertUnorderedList')}><List className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Ordered List" onMouseDown={preventDefault} onClick={() => handleFormat('insertOrderedList')}><ListOrdered className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Blockquote" onMouseDown={preventDefault} onClick={() => handleFormat('formatBlock', 'blockquote')}><Quote className="h-4 w-4" /></Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" title="Insert Link" onMouseDown={preventDefault} onClick={() => { const url = prompt('Enter a URL:'); if (url) handleFormat('createLink', url); }}><LinkIcon className="h-4 w-4" /></Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" title={isListening ? "Stop dictation" : "Dictate notes"} onMouseDown={preventDefault} onClick={handleMicClick} disabled={isSupported === false} className={cn(isListening && "text-destructive")}>
                {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
        </div>
        <ScrollArea className="flex-1">
            <div
                ref={editorRef}
                className="prose dark:prose-invert max-w-none p-6 focus:outline-none h-full min-h-[400px]"
                contentEditable={true}
                onInput={handleEditorInput}
                placeholder="Start designing your report template here..."
                dir="ltr"
            />
        </ScrollArea>
      </div>
    );
    
    const renderPlaceholder = () => (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
        <FileText className="h-16 w-16 text-primary/30" strokeWidth={1.5} />
        <h3 className="text-xl font-semibold text-foreground">Report Template Editor</h3>
        <p className="text-muted-foreground">
          Select a template from the list to edit, or create a new one to get started.
        </p>
      </div>
    );

    return (
        <div className="p-4 sm:p-6 flex flex-col h-full space-y-6">
          <ReportsPageHeader pageTitle="Report Templates" />
          <header className="text-center">
            <h1 className="text-3xl font-bold font-headline text-primary">
              Report Templates
            </h1>
            <p className="text-muted-foreground">
              Create, manage, and utilize standardized report templates.
            </p>
          </header>
          
          <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              {renderTemplateList()}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75} minSize={60}>
              {activeTemplate ? renderEditor() : renderPlaceholder()}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
    );
}
