import { Button } from "@/components/ui/button";
import { DollarSign, Share2, Clock, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

const benefits = [
    {
        icon: <DollarSign className="h-8 w-8 text-primary" />,
        title: "Unlock New Advisory Revenue",
        description: "Transition from compliance work to high-value consulting. With real-time access to your client's financial data, you can provide proactive advice, strategic planning, and ongoing advisory services—all tracked and billed through Ogeemo."
    },
    {
        icon: <Share2 className="h-8 w-8 text-primary" />,
        title: "Seamless Client Collaboration",
        description: "Work directly inside your client's Ogeemo workspace. No more chasing down files or reconciling spreadsheets. Access everything you need in one place, answer questions, and manage their books with unparalleled efficiency."
    },
    {
        icon: <Clock className="h-8 w-8 text-primary" />,
        title: "Track & Bill Every Minute",
        description: "Use Ogeemo's built-in time and client managers to track every second of your valuable consulting time. Generate detailed reports and create professional invoices directly from your logged hours, ensuring you're compensated for all your work."
    },
    {
        icon: <ShieldCheck className="h-8 w-8 text-primary" />,
        title: "Simplify Client Bookkeeping",
        description: "Empower your clients with a tool that makes bookkeeping intuitive. When your clients' books are clean and organized by default, you spend less time on tedious clean-up and more time on high-impact strategic work."
    },
    {
        icon: <Zap className="h-8 w-8 text-primary" />,
        title: "Modernize Your Practice",
        description: "Offer your clients a cutting-edge, all-in-one solution that sets your practice apart. Become an indispensable partner in their business growth by introducing them to a platform that simplifies their operations."
    },
    {
        icon: <ShieldCheck className="h-8 w-8 text-primary" />,
        title: "Be Audit Ready",
        description: "Take the stress out of CRA audits by having everything always ready for an audit. No more having CRA sit in your office for weeks on end wasting your time and stressing out your clients."
    }
]

export default function ForAccountantsPage() {
    return (
        <main>
            {/* Hero Section */}
            <section className="py-20 md:py-32 bg-slate-50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary">
                        Reinvent Your Practice. Redefine Your Value.
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                        Move beyond compliance and become an indispensable financial partner to your clients. Ogeemo is the collaborative platform that turns bookkeeping into a gateway for high-value advisory services.
                    </p>
                    <div className="mt-8">
                        <Button asChild size="lg">
                            <Link href="/register">Join the Beta Program</Link>
                        </Button>
                    </div>
                </div>
            </section>
            
            {/* Benefits Section */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                     <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">The Accountant's Advantage</h2>
                        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                            Ogeemo isn't just another bookkeeping tool—it's your platform for growth.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map(benefit => (
                             <div key={benefit.title} className="flex flex-col items-start text-left p-6 border rounded-lg hover:shadow-lg transition-shadow">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    {benefit.icon}
                                </div>
                                <h3 className="mt-4 text-xl font-bold">{benefit.title}</h3>
                                <p className="mt-2 text-muted-foreground flex-1">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

             {/* CTA Section */}
            <section className="py-20 md:py-28 bg-slate-50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Ready to Become a High-Value Advisor?</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Join our beta program and discover how Ogeemo can transform your client relationships and your bottom line.</p>
                    <div className="mt-8">
                        <Button asChild size="lg">
                            <Link href="/register">Start Your Free Beta Trial</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
