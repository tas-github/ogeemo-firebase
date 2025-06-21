import { Card, CardContent } from "@/components/ui/card";

export default function ContactsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6 flex flex-col h-full">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Ogeemo Contact Manager
        </h1>
        <p className="text-muted-foreground">
          Manage your contacts and client relationships
        </p>
      </header>
      <div className="flex-1 min-h-0">
        <Card className="h-full">
          <CardContent className="p-6">
            {/* Content will go here */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
