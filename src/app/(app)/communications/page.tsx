import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Mail, Phone, CreditCard, Bot, ZoomIn } from "lucide-react";

export default function CommunicationsManagerPage() {
  const futureFeatures = [
    {
      icon: Mail,
      title: "Email Integration",
      description: "Connect with OgeeMail or external providers like Gmail to send, receive, and manage all your business communications in one place.",
    },
    {
      icon: Phone,
      title: "Telephony Services (e.g., Zoom Phone)",
      description: "Initiate calls, manage call logs, and integrate your business phone system directly into your workflow for seamless client interaction.",
    },
    {
      icon: CreditCard,
      title: "Payment Processing (e.g., Stripe)",
      description: "Integrate with payment gateways to send invoices with payment links, track payment statuses, and manage subscriptions automatically.",
    },
    {
      icon: Bot,
      title: "AI-Powered Automation",
      description: "Leverage AI to automate follow-ups, schedule appointments, and respond to common inquiries across all communication channels.",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center justify-center gap-3">
          <MessageSquare className="h-8 w-8" />
          Communications Manager
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
          Your future hub for all client and team interactions. This manager will centralize email, phone, and payment communications.
        </p>
      </header>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Future Vision</CardTitle>
          <CardDescription>
            The Communications Manager is designed to be the central nervous system for all your business interactions. Below are the key integrations planned for this module.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {futureFeatures.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
                <feature.icon className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
