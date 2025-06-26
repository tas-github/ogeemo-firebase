
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
  MoreVertical,
  Save,
  FileText
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { type FileItem, type FolderItem, mockFiles, mockFolders, REPORT_TEMPLATE_MIMETYPE } from "@/data/files";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";

const REPORT_TEMPLATES_FOLDER_ID = 'folder-reports';

export default function ReportTemplatesPage() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [activeTemplate, setActiveTemplate] = useState<Partial<FileItem> | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [notesBeforeSpeech, setNotesBeforeSpeech] = useState('');

    // Load data from localStorage on mount
    useEffect(() => {
        let loadedFolders = mockFolders;
        let loadedFiles = mockFiles;
        try {
            const storedFolders = localStorage.getItem('fileManagerFolders');
            if (storedFolders) loadedFolders = JSON.parse(storedFolders);

            const storedFiles = localStorage.getItem('fileManagerFiles');
            if (storedFiles) {
                loadedFiles = JSON.parse(storedFiles).map((file: any) => ({
                ...file,
                modifiedAt: new Date(file.modifiedAt),
                }));
            }
            
            if (!loadedFolders.some(f => f.id === REPORT_TEMPLATES_FOLDER_ID)) {
                const reportsFolder = { id: REPORT_TEMPLATES_FOLDER_ID, name: 'Report Templates', parentId: null };
                loadedFolders = [reportsFolder, ...loadedFolders];
            }
        } catch (error) {
            console.error("Failed to parse from localStorage, using mock data.", error);
        } finally {
            setFolders(loadedFolders);
            setFiles(loadedFiles);
            setIsLoading(false);
        }
    }, []);

    // Save data to localStorage on change
    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem('fileManagerFolders', JSON.stringify(folders));
                localStorage.setItem('fileManagerFiles', JSON.stringify(files));
            } catch (error) {
                console.error("Failed to save to localStorage", error);
            }
        }
    }, [files, folders, isLoading]);
    
    // Effect to update the active template when selection changes
    useEffect(() => {
      if (selectedTemplateId) {
        if (selectedTemplateId.startsWith('new-')) {
            setActiveTemplate({
                id: selectedTemplateId,
                name: '',
                content: '',
                type: REPORT_TEMPLATE_MIMETYPE,
                folderId: REPORT_TEMPLATES_FOLDER_ID
            });
        } else {
            const foundTemplate = files.find(f => f.id === selectedTemplateId);
            setActiveTemplate(foundTemplate || null);
        }
      } else {
        setActiveTemplate(null);
      }
    }, [selectedTemplateId, files]);

    // Update editor when active template changes
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = activeTemplate?.content || '';
        }
    }, [activeTemplate]);

    const reportTemplates = files.filter(f => f.folderId === REPORT_TEMPLATES_FOLDER_ID);

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
  
    const handleSaveTemplate = () => {
        if (!activeTemplate || !activeTemplate.name?.trim()) {
            toast({ variant: 'destructive', title: 'Template name is required.' });
            return;
        }

        const templateToSave: FileItem = {
            id: activeTemplate.id?.startsWith('new-') ? `template-${Date.now()}` : activeTemplate.id!,
            name: activeTemplate.name.trim(),
            folderId: REPORT_TEMPLATES_FOLDER_ID,
            type: REPORT_TEMPLATE_MIMETYPE,
            content: activeTemplate.content || '',
            size: (activeTemplate.content || '').length,
            modifiedAt: new Date(),
        };

        let isNew = activeTemplate.id?.startsWith('new-');
        
        if (isNew) {
            setFiles(prev => [...prev, templateToSave]);
            setSelectedTemplateId(templateToSave.id); // Update selection to the new saved template
            toast({ title: 'Template Created!', description: `"${templateToSave.name}" has been saved.` });
        } else {
            setFiles(prev => prev.map(f => f.id === templateToSave.id ? templateToSave : f));
            toast({ title: 'Template Saved!', description: `Changes to "${templateToSave.name}" have been saved.` });
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

    const handleNewTemplate = () => {
        setSelectedTemplateId(`new-${Date.now()}`);
    };

    const handleCopyTemplate = (template: FileItem) => {
        const newFile: FileItem = {
            ...template,
            id: `template-${Date.now()}`,
            name: `${template.name} (Copy)`,
            modifiedAt: new Date(),
        };
        setFiles(prev => [...prev, newFile]);
        toast({ title: "Template Copied" });
    };

    const handleDeleteTemplate = (templateId: string) => {
        const template = files.find(f => f.id === templateId);
        if (template && window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
            setFiles(prev => prev.filter(f => f.id !== templateId));
            if (selectedTemplateId === templateId) {
                setSelectedTemplateId(null);
            }
            toast({ title: "Template Deleted", variant: 'destructive' });
        }
    };

    const preventDefault = (e: React.MouseEvent) => e.preventDefault();
    
    const renderTemplateList = () => (
      <div className="p-2">
        <Button onClick={handleNewTemplate} className="w-full mb-2">
            <Plus className="mr-2 h-4 w-4" />
            New Template
        </Button>
        <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-1">
            {reportTemplates.map(template => (
                <div key={template.id} className="group flex items-center rounded-md pr-1 hover:bg-accent">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start text-left h-auto py-2",
                            selectedTemplateId === template.id && "bg-accent"
                        )}
                        onClick={() => setSelectedTemplateId(template.id)}
                    >
                        <div className="truncate">
                            <p className="font-semibold truncate">{template.name}</p>
                            <p className="text-xs text-muted-foreground">{format(template.modifiedAt, 'MMM d, yyyy')}</p>
                        </div>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleCopyTemplate(template)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={() => handleDeleteTemplate(template.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ))}
            </div>
        </ScrollArea>
      </div>
    );
    
    const renderEditor = () => (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between">
            <Input
                placeholder="Untitled Template"
                value={activeTemplate?.name || ''}
                onChange={(e) => setActiveTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
            />
            <Button onClick={handleSaveTemplate}>
                <Save className="mr-2 h-4 w-4" />
                Save
            </Button>
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
