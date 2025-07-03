
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const exercises = [
  { name: 'Neck Tilts', description: 'Slowly tilt your head from side to side, holding for 15 seconds on each side.', duration: 30 },
  { name: 'Wrist Circles', description: 'Extend your arms and gently rotate your wrists clockwise, then counter-clockwise.', duration: 30 },
  { name: 'Shoulder Shrugs', description: 'Raise your shoulders towards your ears, hold for a few seconds, and then relax.', duration: 30 },
  { name: 'Seated Spinal Twist', description: 'Turn your upper body to one side, using your chair for support. Hold, then switch sides.', duration: 60 },
  { name: 'Leg Extensions', description: 'While seated, extend one leg straight out and hold. Lower it and switch to the other leg.', duration: 30 },
  { name: 'Ankle Rotations', description: 'Lift one foot slightly off the ground and rotate your ankle in both directions. Switch feet.', duration: 30 },
];

interface ExercisePlayerProps {
  breakDurationMinutes: number;
  onFinish: () => void;
}

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function ExercisePlayer({ breakDurationMinutes, onFinish }: ExercisePlayerProps) {
  const totalDurationSeconds = breakDurationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeInCurrentExercise, setTimeInCurrentExercise] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(true);
  const { toast } = useToast();

  const currentExercise = exercises[currentExerciseIndex % exercises.length];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
      setTimeInCurrentExercise(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [onFinish]);

  useEffect(() => {
    if (timeInCurrentExercise >= currentExercise.duration) {
      setCurrentExerciseIndex(prev => prev + 1);
      setTimeInCurrentExercise(0);
    }
  }, [timeInCurrentExercise, currentExercise.duration]);

  useEffect(() => {
    let isCancelled = false;

    const fetchImage = async () => {
      if (!currentExercise) return;

      setIsGeneratingImage(true);
      setImageUrl(null);
      try {
        const prompt = `A clear, simple, animated-style illustration of a person doing the following office chair exercise: ${currentExercise.name}. The person should be in a modern office setting. The focus should be on the correct posture for the exercise.`;
        const result = await generateImage({ prompt });
        if (!isCancelled) {
          setImageUrl(result.imageUrl);
        }
      } catch (error: any) {
        if (!isCancelled) {
          console.error("Failed to generate exercise image:", error);
          toast({
            variant: "destructive",
            title: "Could not load exercise image.",
            description: error.message || "The AI failed to generate an image for this exercise.",
          });
        }
      } finally {
        if (!isCancelled) {
          setIsGeneratingImage(false);
        }
      }
    };

    fetchImage();

    return () => {
      isCancelled = true;
    };
  }, [currentExerciseIndex, currentExercise, toast]);

  const progress = ((totalDurationSeconds - timeLeft) / totalDurationSeconds) * 100;

  return (
    <div className="p-4 sm:p-6 flex items-center justify-center h-full">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{currentExercise.name}</CardTitle>
          <CardDescription>{currentExercise.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            {isGeneratingImage ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                    <p>Generating exercise image...</p>
                </div>
            ) : imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={currentExercise.name}
                    layout="fill"
                    objectFit="cover"
                />
            ) : (
                <div className="text-center text-destructive-foreground bg-destructive/80 p-4 rounded-md">
                    <p>Could not load exercise image.</p>
                </div>
            )}
          </div>
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Time left: {formatTime(timeLeft)}</span>
              <span>Total Break Time: {formatTime(totalDurationSeconds)}</span>
            </div>
          </div>
        </CardContent>
        <div className="p-6 pt-0 flex justify-center">
            <Button onClick={onFinish}>End Break Early</Button>
        </div>
      </Card>
    </div>
  );
}
