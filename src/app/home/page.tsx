import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Target } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const features = [
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: 'Audit-Ready Accounting',
    description: 'Simplify your finances with a system built for peace of mind, even for non-accountants.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: 'Intuitive Time & Task Management',
    description: 'Easily manage projects, track billable hours, and invoice clients without the complexity.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: 'Seamless Google Integration',
    description: 'Leverage the power of Google Workspace without the nuances. A Google account is all you need.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: 'Powerful Action Manager',
    description: 'Your central hub to begin your journey where you don’t need to know a lot to accomplish a lot.',
  },
];

const personas = [
    {
        title: "For Small Businesses",
        description: "Tired of confusing software and audit fears? Ogeemo simplifies your operations so you can focus on growth.",
        href: "/for-small-businesses",
        cta: "Learn More for Your Business"
    },
    {
        title: "For Accountants",
        description: "Ready to transform your practice? Ogeemo provides the tools for audit-ready clients and high-value consulting.",
        href: "#", // Placeholder for when the page is created
        cta: "Reinvent Your Practice"
    }
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-slate-50">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary">
              Simplify Your Business. Empower Your Growth.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              The intuitive cloud platform designed for your peace of mind, making business management, time tracking, and audit-ready accounting effortless.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/register">Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#">Request a Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Stop Juggling Apps. Start Running Your Business.</h2>
                    <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                        Are you tired of confusing software, complex accounting, and audit fears? Ogeemo is the simple, intuitive, all-in-one solution.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {personas.map((persona) => (
                        <Card key={persona.title} className="text-center">
                            <CardHeader>
                                <Target className="h-10 w-10 mx-auto text-primary" />
                                <CardTitle className="mt-4">{persona.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{persona.description}</p>
                            </CardContent>
                            <CardContent>
                                <Button asChild variant="outline">
                                    <Link href={persona.href}>{persona.cta} <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Features Overview Section */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-headline">Everything You Need, Nothing You Don't</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Ogeemo replaces multiple subscriptions with one simple, powerful platform.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex-shrink-0">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Ready to Simplify Your Business?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Join our beta program and experience the peace of mind Ogeemo provides.</p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/register">Start Your Free Beta Trial</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
