import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OgeeMailPage() {
  return (
    <div className="flex flex-col flex-1 space-y-4 min-h-0">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-orange-500">Welcome to OgeeMail</h1>
        <p className="text-muted-foreground">
          Your intelligent email assistant.
        </p>
      </header>

      <div className="flex-1 min-h-0">
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>OgeeMail Inbox</CardTitle>
                <CardDescription>
                Ready for your instructions on building the email manager.
                </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">OgeeMail content will go here.</p>
               </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
