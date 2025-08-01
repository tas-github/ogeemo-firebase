
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Target } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useAuth } from '@/context/auth-context';

const features = [
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: 'Audit-Ready Accounting',
    description: 'Simplify your finances with a system built for peace of mind. Designed for non-accountants, Ogeemo ensures your books are audit-ready by default.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: 'Intuitive Time & Task Management',
    description: 'Easily manage projects, track billable hours, and invoice clients without the complexity. See exactly where your time goes and turn your efforts directly into revenue.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: 'Seamless Google Integration',
    description: 'Built on powerful Google technology, a Google account is all you need to get started. Ogeemo integrates with your workflow, removing friction.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: 'Powerful Action Manager',
    description: 'The heart of Ogeemo. The Action Manager is your central hub to begin any task, empowering you to accomplish a lot without needing to know a lot.',
  },
];

const personas = [
    {
        title: "For Small Businesses",
        description: "Tired of confusing software and audit fears? Ogeemo simplifies your operations so you can focus on growth. Share your workspace with your accountant to get ongoing support.",
        href: "/for-small-businesses",
        cta: "Learn More for Your Business"
    },
    {
        title: "For Accountants and Bookkeepers",
        description: "Unlock high-value consulting opportunities. By sharing your client's workspace, you can provide ongoing advisory services, all while using Ogeemo to track and bill for your time.",
        href: "/for-accountants",
        cta: "Reinvent Your Practice"
    }
]

export default function HomePage() {
  const { user } = useAuth();
  
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 md:py-20">
            <div className="container mx-auto px-4 text-center flex flex-col items-center">
              <div className="space-y-4 max-w-4xl">
                <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary">
                  Simplify Your Business.
                  <br />
                  Empower Your Growth.
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                  The intuitive cloud platform designed for your peace of mind, making business management, time tracking, and audit-ready accounting effortless.
                </p>
                <div className="pt-2">
                   <Button asChild size="lg">
                      <Link href="/register">
                        {user ? "Go to Your Dashboard" : "Join Beta Program"}
                      </Link>
                  </Button>
                </div>
                <div className="pt-12">
                     <h2 className="text-3xl md:text-4xl font-bold font-headline">Built for a New Way of Working</h2>
                      <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
                          Whether you're running your own business or advising others, Ogeemo is your collaborative platform for success.
                      </p>
                </div>
              </div>
            </div>
          </section>

          {/* Personas Section */}
          <section className="pb-12 md:pb-16">
              <div className="container mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                      {personas.map((persona) => (
                          <Card key={persona.title} className="text-center flex flex-col">
                              <CardHeader>
                                  <Target className="h-10 w-10 mx-auto text-primary" />
                                  <CardTitle className="mt-4 text-2xl">{persona.title}</CardTitle>
                              </CardHeader>
                              <CardContent className="flex-1">
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
          <section className="py-12 md:py-16 bg-slate-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12 space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">Everything You Need, Nothing You Don't</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Ogeemo replaces multiple subscriptions with one simple, powerful platform.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {features.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 md:py-20">
            <div className="container mx-auto px-4 text-center flex flex-col items-center">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold font-headline">Ready to Simplify Your Business?</h2>
                <p className="mt-2 text-lg text-muted-foreground">Join our beta program and experience the peace of mind Ogeemo provides.</p>
                <div className="pt-2">
                  <Button asChild size="lg">
                      <Link href="/register">Join Beta Program</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
