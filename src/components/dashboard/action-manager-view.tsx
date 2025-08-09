
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
    getActionChips,
    type ActionChipData 
} from '@/services/project-service';
import { ActionChip } from './ActionChip';
import { useUserPreferences } from '@/hooks/use-user-preferences';

export function ActionManagerView() {
  const [userChips, setUserChips] = React.useState<ActionChipData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences } = useUserPreferences();

  const loadChips = React.useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        const chips = await getActionChips(user.uid);
        setUserChips(chips);
      } catch (error) {
        console.error("Failed to load chips:", error);
        toast({ variant: "destructive", title: "Failed to load actions", description: error instanceof Error ? error.message : "An unknown error occurred." });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [user, toast]);
  
  React.useEffect(() => {
    loadChips();
  }, [loadChips]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
        {preferences?.showDashboardFrame && (
            <Card>
                <CardHeader className="text-center">
                    <div className="relative flex justify-center items-center">
                        <CardTitle className="text-2xl text-primary font-headline">Your Action Dashboard</CardTitle>
                        <div className="absolute right-0">
                            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                              <Link href="/action-manager/manage">Manage Dashboard</Link>
                            </Button>
                        </div>
                    </div>
                    <CardDescription>
                        Click an action to begin. You can customize these shortcuts in "Manage Dashboard".
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap justify-center gap-2 p-4">
                    {userChips.map((chip, index) => (
                        <ActionChip key={chip.id} chip={chip} index={index} />
                    ))}
                </CardContent>
            </Card>
        )}
    </div>
  );
}
