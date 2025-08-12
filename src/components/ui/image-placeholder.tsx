
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { UploadCloud, LoaderCircle, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { addFile } from '@/services/file-service';
import { getImageUrlForHint, setFileForHint } from '@/services/image-placeholder-service';

const SITE_IMAGES_FOLDER_ID = 'folder-site-images';

interface ImagePlaceholderProps {
  'data-ai-hint': string;
  className?: string;
}

// Custom hook to manage the state and logic for each placeholder independently
const useImagePlaceholderState = (hint: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

  const handleSave = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    toast({ title: "Uploading..." });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.uid);
      formData.append('folderId', SITE_IMAGES_FOLDER_ID);

      const newFile = await addFile(formData);
      await setFileForHint(hint, newFile.id);
      
      toast({ title: "Image Saved", description: "The new image is now active." });
      
      handleCancel();
      await loadInitialImage(); // Use await to ensure it reloads before finishing

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Effect to clean up the object URL on unmount or when previewUrl changes
  useEffect(() => {
    const currentPreviewUrl = previewUrl;
    return () => {
      if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [previewUrl]);

  return {
    imageUrl,
    previewUrl,
    isLoading,
    isUploading,
    fileInputRef,
    handlePlaceholderClick,
    handleFileChange,
    handleSave,
    handleCancel,
  };
};

export function ImagePlaceholder({ 'data-ai-hint': hint, className }: ImagePlaceholderProps) {
  const {
    imageUrl,
    previewUrl,
    isLoading,
    isUploading,
    fileInputRef,
    handlePlaceholderClick,
    handleFileChange,
    handleSave,
    handleCancel,
  } = useImagePlaceholderState(hint);

  if (isLoading) {
    return <div className={cn("w-full h-48 bg-muted rounded-lg animate-pulse", className)} />;
  }
  
  if (previewUrl) {
    return (
        <div className={cn("relative w-full h-48 group", className)}>
            <Image
                src={previewUrl}
                alt={`Preview for ${hint}`}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
                unoptimized
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button onClick={handleSave} disabled={isUploading}>
                    {isUploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Save
                </Button>
                <Button variant="secondary" onClick={handleCancel} disabled={isUploading}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                </Button>
            </div>
        </div>
    );
  }

  if (imageUrl) {
    return (
      <div className={cn("relative w-full h-48 group", className)}>
        <Image
          src={imageUrl}
          alt={hint}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />
        <div 
          onClick={handlePlaceholderClick}
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
            <p className="text-white font-semibold">Change Image</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </div>
    );
  }

  return (
    <div
      onClick={handlePlaceholderClick}
      className={cn(
        "w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors",
        className
      )}
    >
      <UploadCloud className="h-8 w-8 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">Upload Image Here</p>
      <p className="text-xs text-muted-foreground">({hint})</p>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
}
