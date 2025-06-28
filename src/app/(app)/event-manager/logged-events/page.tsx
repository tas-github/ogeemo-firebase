
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveRight } from 'lucide-react';

export default function LoggedEventsMovedPage() {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
        <Card className="max-w-lg text-center">
            <CardHeader>
                <CardTitle>This Page Has Moved</CardTitle>
                <CardDescription>
                    The comprehensive report of all logged events has been relocated to a more appropriate home in the Reports Manager.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">You can now find the full list of billable hours and logged events at:</p>
            </CardContent>
            <CardFooter className="justify-center">
                <Button asChild>
                    <Link href="/reports/billable-hours">
                        Go to Billable Hours Report
                        <MoveRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
