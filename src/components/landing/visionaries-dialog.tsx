
"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Braces, BrainCircuit, UploadCloud, LoaderCircle, X, Save } from "lucide-react";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { addFile } from '@/services/file-service';
import { getVisionariesDialogImageUrl, setVisionariesDialogImage } from '@/services/dialog-settings-service';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface VisionariesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function VisionariesDialog({ isOpen, onOpenChange }: VisionariesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadSavedImage = useCallback(async () => {
    if (user) {
        setIsLoadingImage(true);
        try {
            const imageUrl = await getVisionariesDialogImageUrl(user.uid);
            setImagePreview(imageUrl);
        } catch (error) {
            console.error("Failed to load saved image:", error);
        } finally {
            setIsLoadingImage(false);
        }
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
        loadSavedImage();
    }
  }, [isOpen, loadSavedImage]);


  const handlePlaceholderClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    setSelectedFile(file);

    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleSaveAndClose = async () => {
    if (selectedFile && user) {
        setIsUploading(true);
        toast({ title: 'Uploading...', description: `"${selectedFile.name}" is being uploaded.` });
        
        try {
            const folderId = "dialog-uploads";

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('userId', user.uid);
            formData.append('folderId', folderId);

            const newFile = await addFile(formData);

            await setVisionariesDialogImage(user.uid, newFile.id);

            toast({ title: 'Upload Successful', description: `"${selectedFile.name}" has been saved.` });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error.message || 'Could not upload the image.',
            });
        } finally {
            setIsUploading(false);
        }
    }
    onOpenChange(false);
  };
  
  // Effect to clean up the object URL
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setSelectedFile(null);
      setIsUploading(false);
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none top-0 left-0 translate-x-0 translate-y-0 rounded-none sm:rounded-none flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b flex-row items-center justify-between text-center relative">
            <div className="flex-1">
                <DialogTitle className="text-3xl font-headline text-primary">
                    The Ogeemo Difference: Why We Embraced Complexity
                </DialogTitle>
                <DialogDescription>
                    Building a true all-in-one platform is a monumental task. Here’s why we believe it’s worth it.
                </DialogDescription>
            </div>
             <div className="flex items-center gap-2">
                 <Button onClick={handleSaveAndClose} disabled={isUploading}>
                    {isUploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isUploading ? "Saving..." : "Save and Close"}
                </Button>
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </Button>
                </DialogClose>
            </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 flex flex-col">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50}>
              <div 
                className="relative h-full w-full flex flex-col items-center justify-center border-r border-dashed border-muted bg-muted/50 cursor-pointer hover:border-primary hover:bg-primary/10 transition-colors overflow-hidden"
                onClick={handlePlaceholderClick}
              >
                  {isLoadingImage || isUploading ? (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                          <LoaderCircle className="h-10 w-10 animate-spin text-white" />
                          <p className="text-white mt-2">{isUploading ? 'Uploading...' : 'Loading Image...'}</p>
                      </div>
                  ) : imagePreview ? (
                      <Image
                          src={imagePreview}
                          alt="Selected image preview"
                          layout="fill"
                          objectFit="cover"
                          unoptimized // Necessary for blob URLs or external URLs without configuration
                      />
                  ) : (
                      <>
                          <UploadCloud className="h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">Upload Image</p>
                      </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isUploading}
                  />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50}>
              <ScrollArea className="h-full">
                <div className="space-y-6 p-6 pt-32">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg mt-1">
                            <BarChart className="h-5 w-5 text-primary"/>
                        </div>
                        <div>
                            <h4 className="font-semibold">A High Barrier to Entry</h4>
                            <p className="text-sm text-muted-foreground">
                                Many development efforts focus on solving one problem well. Creating a unified platform where accounting, project management, and CRM work together seamlessly requires a much greater investment in architecture and data modeling. It's a marathon, not a sprint, and we are dedicated to running that marathon so our users don't have to.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg mt-1">
                            <Braces className="h-5 w-5 text-primary"/>
                        </div>
                        <div>
                            <h4 className="font-semibold">Deep Google Integration</h4>
                            <p className="text-sm text-muted-foreground">
                                While many apps offer a simple Google login, Ogeemo is built for deep integration with Google Workspace. This isn't just for convenience; it's about power. Seamlessly weaving your Drive, Calendar, and Contacts into your business operations provides a single source of truth and is a significant technical advantage that few platforms achieve.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg mt-1">
                            <BrainCircuit className="h-5 w-5 text-primary"/>
                        </div>
                        <div>
                            <h4 className="font-semibold">A Truly Intelligent AI Core</h4>
                            <p className="text-sm text-muted-foreground">
                                In an era of simple chatbots, Ogeemo's AI acts as a central nervous system. It connects the dots across all modules—linking a client email to a project task, which then automatically informs an invoice. This is true intelligence that understands the context of your work to automate workflows and empower your decisions.
                            </p>
                        </div>
                    </div>
                </div>
              </ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
