
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import OgeemoChatDialog from '@/components/ogeemail/ogeemo-chat-dialog';

export function CommandBar() {
    const { preferences } = useUserPreferences();
    const [isChatOpen, setIsChatOpen] = useState(false);

    if (!preferences?.showCommandFrame) {
        return null;
    }
    
    return (
        <>
            <div className="px-4 sm:px-6 pb-6">
                <Card>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="command-input" className="text-center block text-lg text-orange-600">Give a Command</Label>
                            <Textarea id="command-input" placeholder="e.g., 'Create an invoice for Client X for $500'" rows={3} />
                            <div className="text-center">
                                <Button className="bg-orange-500 hover:bg-orange-600 text-white">Execute Command</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="question-input" className="text-center block text-lg text-orange-600">Ask a Question</Label>
                            <Textarea id="question-input" placeholder="e.g., 'How do I add a new contact?'" rows={3} />
                            <div className="text-center">
                                <Button onClick={() => setIsChatOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">Ask Ogeemo</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {isChatOpen && <OgeemoChatDialog isOpen={isChatOpen} onOpenChange={setIsChatOpen} />}
        </>
    );
}
