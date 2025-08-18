'use client';

import { ActionManagerView } from "@/components/dashboard/action-manager-view";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ActionManagerPage() {
  const { preferences } = useUserPreferences();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-6">
            {/* Page Header */}
            <header className="text-center">
                <h1 className="text-4xl font-bold font-headline text-[#3B2F4A]">
                    Action Manager
                </h1>
            </header>
            
            {/* Main Content Area */}
            <div>
                <ScrollArea className="h-full">
                    <ActionManagerView />
                </ScrollArea>
            </div>
        </div>
      </div>
    </div>
  );
}
