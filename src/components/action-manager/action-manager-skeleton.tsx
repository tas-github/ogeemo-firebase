
import {
  Send,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export function ActionManagerSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Welcome to your Ogeemo Action Manager</h1>
        <p className="text-muted-foreground">
          Your intelligent assistant for navigating the Ogeemo platform.
        </p>
      </header>

      <Card className="h-[65vh] flex flex-col">
          <CardHeader className="text-center">
              <CardTitle>Tell me what you would like to do</CardTitle>
              <CardDescription>
              Ask me anything about Ogeemo or describe what you'd like to accomplish.
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                In order to start and stop voice to text, click the mic icon.
              </p>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col justify-end">
              <div className="space-y-4 p-4">
                  <div className="flex items-start gap-3 justify-start">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-10 w-48 rounded-lg" />
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                       <Skeleton className="h-10 w-32 rounded-lg" />
                       <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
              </div>
          </CardContent>
          <CardFooter>
              <div className="flex w-full items-center space-x-2">
                  <Button type="button" variant="ghost" size="icon" disabled>
                      <Mic className="h-5 w-5" />
                  </Button>
                  <Input placeholder="Enter your message here..." disabled />
                  <Button type="submit" size="icon" disabled>
                      <Send className="h-5 w-5" />
                  </Button>
              </div>
          </CardFooter>
      </Card>
    </div>
  );
}
