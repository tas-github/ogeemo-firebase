
"use client"

import * as React from "react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

type CalendarView = "hour" | "day" | "5days" | "week" | "month";

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [view, setView] = React.useState<CalendarView>("day");

  const viewOptions: { id: CalendarView; label: string }[] = [
    { id: "hour", label: "Hour" },
    { id: "day", label: "Day" },
    { id: "5days", label: "5 Days" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
  ];

  const renderViewContent = () => {
    switch (view) {
      case "day":
        return <p className="text-muted-foreground">No events for this day.</p>;
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
