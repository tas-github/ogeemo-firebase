
'use client';

import { useState, useRef, useEffect } from "react";
import { ReportsPageHeader } from "@/components/reports/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Info, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Link as LinkIcon, Save, Mic, Square, FilePenLine, Copy, Trash2, MoreVertical } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type FileItem, type FolderItem, mockFiles, mockFolders, REPORT_TEMPLATE_MIMETYPE } from "@/data/files";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const REPORT_TEMPLATES_FOLDER_ID = 'folder-reports';

export default function ReportTemplatesPage() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState('');
  const [notesBeforeSpeech, setNotesBeforeSpeech] = useState('');
  const { toast } = useToast();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('fileManagerFolders', JSON.stringify(folders));
      } catch (error) {
        console.error("Failed to save folders to localStorage", error);
      }
    }
  }, [folders, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('fileManagerFiles', JSON.stringify(files));
      } catch (error) {
        console.error("Failed to save files to localStorage", error);
      }
    }
  }, [files, isLoading]);

  const reportTemplates = files.filter(f => f.folderId === REPORT_TEMPLATES_FOLDER_ID);

  const {
    isListening,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechToText({
    onTranscript: (transcript) => {
      const newText = notesBeforeSpeech
        ? `${notesBeforeSpeech} ${transcript}`
        : transcript;
      if (editorRef.current) {
        editorRef.current.innerHTML = newText;
        // Move cursor to the end
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
      setNotesBeforeSpeech(editorRef.current?.innerHTML || '');
      startListening();
      editorRef.current?.focus();
    }
  };
  
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
        toast({
            variant: 'destructive',
            title: 'Template name is required.'
        });
        return;
    }
    const newFile: FileItem = {
        id: `template-${Date.now()}`,
        name: templateName.trim(),
        folderId: REPORT_TEMPLATES_FOLDER_ID,
        type: REPORT_TEMPLATE_MIMETYPE,
        content: body,
        size: body.length,
        modifiedAt: new Date(),
    };
    setFiles(prev => [...prev, newFile]);
    toast({
        title: 'Template Saved!',
        description: `"${templateName}" has been saved to your File Manager.`
    });
    setIsSaveDialogOpen(false);
    setTemplateName('');
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const preventDefault = (e: React.MouseEvent) => e.preventDefault();
  
  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isListening) {
        setBody(e.currentTarget.innerHTML);
    }
  };

  const handleCreateNew = () => {
    setBody('');
    if (editorRef.current) {
        editorRef.current.innerHTML = '';
    }
    editorRef.current?.focus();
    toast({ title: "New Template Started", description: "The editor has been cleared." });
  };
  
  const handleLoadTemplate = (template: FileItem) => {
    setBody(template.content || '');
    if (editorRef.current) {
      editorRef.current.innerHTML = template.content || '';
    }
    setIsManageTemplatesOpen(false);
    toast({ title: "Template Loaded", description: `Loaded "${template.name}" into the editor.` });
  };
  
  const handleRenameTemplate = (template: FileItem) => {
    const newName = window.prompt("Enter new name for the template:", template.name);
    if (newName && newName.trim() !== "") {
        setFiles(prev => prev.map(f => f.id === template.id ? {...f, name: newName.trim(), modifiedAt: new Date()} : f));
        toast({ title: "Template Renamed" });
    }
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

  const handleDeleteTemplate = (template: FileItem) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
        setFiles(prev => prev.filter(f => f.id !== template.id));
        toast({ title: "Template Deleted", variant: 'destructive' });
    }
  };

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
      
      <div className="flex justify-center gap-4">
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create a Report Template
        </Button>
        
        <Dialog open={isManageTemplatesOpen} onOpenChange={setIsManageTemplatesOpen}>
            <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Manage Templates
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Manage Report Templates</DialogTitle>
                    <DialogDescription>
                        Load, rename, copy, or delete your existing report templates.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                    {reportTemplates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent/50 group">
                            <Button variant="link" className="p-0 h-auto font-medium text-foreground text-base" onClick={() => handleLoadTemplate(template)}>
                                {template.name}
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => handleRenameTemplate(template)}>
                                        <FilePenLine className="mr-2 h-4 w-4" />
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleCopyTemplate(template)}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={() => handleDeleteTemplate(template)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsManageTemplatesOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Info className="mr-2 h-4 w-4" />
                    Information
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>About Report Templates</DialogTitle>
                    <DialogDescription>
                        An overview of how to create and use report templates effectively.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 prose prose-sm dark:prose-invert max-w-none">
                    <h4>What are Report Templates?</h4>
                    <p>Report templates are pre-designed structures for your reports. They allow you to define the layout, data fields, and filters once, and then reuse that structure to generate new reports quickly and consistently. This saves time and ensures a uniform look and feel across all your reporting.</p>
                    
                    <h4>Guidelines for Creating Reports</h4>
                    <ul>
                        <li><strong>Start with a clear objective:</strong> Know what question you are trying to answer or what information you want to convey.</li>
                        <li><strong>Identify your audience:</strong> Tailor the complexity and content of the report to who will be reading it (e.g., clients, internal team, executives).</li>
                        <li><strong>Choose the right data:</strong> Select only the relevant collections and fields needed for your report to keep it focused and performant.</li>
                        <li><strong>Use filters effectively:</strong> Apply date ranges and other conditions to narrow down the data to the most relevant information.</li>
                        <li><strong>Name templates descriptively:</strong> Use clear names like "Monthly Client Activity" or "Quarterly Financial Summary" so you can easily find them later.</li>
                    </ul>
                </div>
                <DialogFooter>
                    <Button onClick={() => setIsInfoOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 flex flex-col rounded-lg border min-h-0">
        <div className="p-2 border-b flex items-center gap-1 flex-wrap">
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
            <Button variant="ghost" size="icon" title="Insert Link" onMouseDown={preventDefault} onClick={() => { const url = prompt('Enter a URL:'); if (url) handleFormat('createLink', url); }}>
                <LinkIcon className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              title={isListening ? "Stop dictation" : "Dictate notes"}
              onMouseDown={preventDefault}
              onClick={handleMicClick}
              disabled={isSupported === false}
              className={cn(isListening && "text-destructive")}
            >
              {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
            <div
                ref={editorRef}
                className="prose dark:prose-invert max-w-none focus:outline-none min-h-full"
                contentEditable={true}
                onInput={handleEditorInput}
                dangerouslySetInnerHTML={{ __html: body }}
                placeholder="Start designing your report template here..."
            />
        </div>
        <div className="border-t p-3 flex justify-end">
            <Button onClick={() => setIsSaveDialogOpen(true)}>
                <Save className="mr-2 h-4 w-4" />
                Save Template
            </Button>
        </div>
      </div>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Report Template</DialogTitle>
            <DialogDescription>
              Give your new template a name. This will save it to the File Manager.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Monthly Client Summary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveTemplate();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
