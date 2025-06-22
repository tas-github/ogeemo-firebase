
"use client"

import * as React from "react"
import { format, addDays, setHours, isSameDay } from "date-fns"
import { Clock, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


type CalendarView = "hour" | "day" | "5days" | "week" | "month";

type Event = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  attendees: string[];
};

const today = new Date();
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Project Standup',
    description: 'Weekly sync for Project Phoenix.',
    start: setHours(today, 9),
    end: setHours(today, 9, 30),
    attendees: ['You', 'John Doe'],
  },
  {
    id: '2',
    title: 'Design Review',
    description: 'Review new mockups for the dashboard.',
    start: setHours(today, 14),
    end: setHours(today, 15),
    attendees: ['You', 'Jane Smith', 'John Doe'],
  },
  {
    id: '3',
    title: 'Client Call',
    description: 'Discuss Q3 goals with Acme Corp.',
    start: setHours(addDays(today, 1), 11),
    end: setHours(addDays(today, 1), 11, 45),
    attendees: ['You', 'Frank White'],
  },
  {
    id: '4',
    title: 'Frontend Team Sync',
    description: 'Discuss component library progress.',
    start: setHours(addDays(today, 2), 10),
    end: setHours(addDays(today, 2), 11),
    attendees: ['You', 'William Kim', 'Sofia Davis'],
  },
  {
    id: '5',
    title: '1:1 with Manager',
    description: 'Performance review.',
    start: setHours(addDays(today, 3), 16),
    end: setHours(addDays(today, 3), 16, 30),
    attendees: ['You', 'Alice Johnson'],
  },
  {
    id: '6',
    title: 'Finalize Marketing Plan',
    description: 'Finalize the marketing plan for the upcoming launch.',
    start: setHours(addDays(today, 4), 13),
    end: setHours(addDays(today, 4), 15),
    attendees: ['You', 'Charlie Brown'],
  },
];


export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [view, setView] = React.useState<CalendarView>("day");
  const [events] = React.useState<Event[]>(mockEvents);

  const viewOptions: { id: CalendarView; label: string }[] = [
    { id: "hour", label: "Hour" },
    { id: "day", label: "Day" },
    { id: "5days", label: "5 Days" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
  ];

  const dailyEvents = React.useMemo(() => {
    if (!date) return [];
    return events
      .filter((event) => isSameDay(event.start, date))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, date]);

  const renderViewContent = () => {
    switch (view) {
      case "day":
        if (dailyEvents.length === 0) {
            return <p className="text-muted-foreground">No events for this day.</p>;
        }
        return (
            <ScrollArea className="h-full w-full">
                <div className="space-y-4 pr-4">
                    {dailyEvents.map(event => (
                        <Card key={event.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">{event.title}</CardTitle>
                                <CardDescription>{event.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{format(event.start, 'p')} - {format(event.end, 'p')}</span>
                                </div>
                                 <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>{event.attendees.join(', ')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        );
      case "hour":
        return <p className="text-muted-foreground">Hour view coming soon.</p>;
      case "5days":
        return <p className="text-muted-foreground">5-day view coming soon.</p>;
      case "week":
        return <p className="text-muted-foreground">Week view coming soon.</p>;
      case "month":
        return <p className="text-muted-foreground">Month view coming soon.</p>;
      default:
        return null;
    }
  }


  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Calendar
        </h1>
        <p className="text-muted-foreground">
          Manage your schedule, events and appointments.
        </p>
      </header>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
          <ResizablePanel defaultSize={35} minSize={25} maxSize={40}>
            <div className="flex h-full items-center justify-center p-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65}>
            <div className="flex flex-col h-full p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                  <h2 className="text-xl font-semibold font-headline">
                      Schedule for {date ? format(date, "PPP") : "..."}
                  </h2>
                  <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                      {viewOptions.map((option) => (
                        <Button
                          key={option.id}
                          variant={view === option.id ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setView(option.id)}
                          className="h-8 px-3"
                        >
                          {option.label}
                        </Button>
                      ))}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center mt-4 border-t pt-4">
                    {renderViewContent()}
                </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
