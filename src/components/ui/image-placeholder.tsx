
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { UploadCloud, Save, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Button } from './button';
import ImageSaveDialog from '@/components/image-generator/image-save-dialog';
import { getImageUrlForHint } from '@/services/image-placeholder-service';
import { SITE_IMAGES_FOLDER_ID } from '@/services/file-service';
import { Skeleton } from './skeleton';

interface ImagePlaceholderProps {
  'data-ai-hint': string;
  className?: string;
}

const useImagePlaceholderState = (hint: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInitialImage = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = await getImageUrlForHint(hint);
      setImageUrl(url);
    } catch (error) {
      console.error(`Failed to load image for hint "${hint}":`, error);
    } finally {
      setIsLoading(false);
    }
  }, [hint]);

  useEffect(() => {
    loadInitialImage();
  }, [loadInitialImage]);

  const handlePlaceholderClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleOpenSaveDialog = () => {
    setIsSaveDialogOpen(true);
  };

  const onSaveSuccess = () => {
    handleCancel();
    loadInitialImage();
  };
  
  const convertFileToDataUrl = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }, []);

  useEffect(() => {
    const currentPreviewUrl = previewUrl;
    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [previewUrl]);

  return {
    imageUrl,
    previewUrl,
    selectedFile,
    isLoading,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    fileInputRef,
    handlePlaceholderClick,
    handleFileChange,
    handleOpenSaveDialog,
    handleCancel,
    onSaveSuccess,
    convertFileToDataUrl,
  };
};

export function ImagePlaceholder({ 'data-ai-hint': hint, className }: ImagePlaceholderProps) {
  const {
    imageUrl,
    previewUrl,
    selectedFile,
    isLoading,
    isSaveDialogOpen,
    setIsSaveDialogOpen,
    fileInputRef,
    handlePlaceholderClick,
    handleFileChange,
    handleOpenSaveDialog,
    handleCancel,
    onSaveSuccess,
    convertFileToDataUrl,
  } = useImagePlaceholderState(hint);
  
  const { user } = useAuth(); // Check for authenticated user

  if (isLoading) {
    return <Skeleton className={cn("w-full h-48 bg-muted rounded-lg", className)} />;
  }
  
  if (previewUrl && selectedFile) {
    return (
        <div className={cn("relative w-full h-48 group", className)}>
            <Image
                src={previewUrl}
                alt={`Preview for ${hint}`}
                fill
                className="rounded-lg object-cover"
                unoptimized
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button onClick={handleOpenSaveDialog} className="pointer-events-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                </Button>
                <Button variant="secondary" onClick={handleCancel} className="pointer-events-auto">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                </Button>
            </div>
            {isSaveDialogOpen && (
                <ImageSaveDialog
                    isOpen={isSaveDialogOpen}
                    onOpenChange={setIsSaveDialogOpen}
                    imageDataUrl={previewUrl}
                    defaultFileName={selectedFile.name}
                    convertFileToDataUrl={() => convertFileToDataUrl(selectedFile)}
                    onSaveSuccess={onSaveSuccess}
                    preselectedFolderId={SITE_IMAGES_FOLDER_ID}
                    hint={hint}
                />
            )}
        </div>
    );
  }

  if (imageUrl) {
    return (
      <div className={cn("relative w-full h-48 group", className)}>
        <Image
          src={imageUrl}
          alt={hint}
          fill
          className="rounded-lg object-cover"
        />
        {user && ( // Only show change functionality if user is logged in
          <>
            <div 
              onClick={handlePlaceholderClick}
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
                <p className="text-white font-semibold">Change Image</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={user ? handlePlaceholderClick : undefined} // Only allow click if user is logged in
      className={cn(
        "w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors",
        user && "cursor-pointer hover:border-primary hover:bg-muted/50",
        className
      )}
    >
      <UploadCloud className="h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">
        {user ? 'Upload Image Here' : 'Image Placeholder'}
      </p>
      <p className="text-xs text-muted-foreground">({hint})</p>
      {user && (
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      )}
    </div>
  );
}
