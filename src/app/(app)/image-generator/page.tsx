
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, WandSparkles } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Prompt is required',
        description: 'Please describe the image you want to create.',
      });
      return;
    }

    setIsLoading(true);
    setGeneratedImageUrl(null);

    try {
      const response = await fetch('/api/genkit/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'The API returned an error.');
      }

      const result = await response.json();
      setGeneratedImageUrl(result.imageUrl);
      toast({
        title: 'Image Generated Successfully',
      });
    } catch (error: any) {
      console.error("Image generation failed:", error);
      toast({
        variant: 'destructive',
        title: 'Image Generation Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">AI Image Generation</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Describe the image you want to create, and let Ogeemo's AI bring it to life.
        </p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Image Prompt</CardTitle>
            <CardDescription>
              Be as descriptive as possible for the best results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., A photorealistic image of a majestic lion in the African savanna at sunset"
              rows={8}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerateImage} disabled={isLoading} className="w-full">
              {isLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Generating...' : 'Generate Image'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
            <CardDescription>
              Your generated image will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : generatedImageUrl ? (
                <Image
                  src={generatedImageUrl}
                  alt={prompt}
                  width={600}
                  height={600}
                  className="rounded-lg object-contain"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Waiting for prompt...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
