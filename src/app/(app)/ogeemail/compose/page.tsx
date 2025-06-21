import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default function ComposeEmailPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6 h-full flex flex-col">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Compose Email
        </h1>
        <p className="text-muted-foreground">
          Draft your next message with the help of AI.
        </p>
      </header>
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>New Message</CardTitle>
            <CardDescription>
              Fill in the details below to send an email.
            </CardDescription>
          </Header>
          <CardContent>
            <p className="text-muted-foreground">Compose form will be built here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
