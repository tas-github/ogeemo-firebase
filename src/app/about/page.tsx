import { Users, Target, Lightbulb } from "lucide-react";

export default function AboutUsPage() {
    return (
        <main>
            <section className="py-20 md:py-32 bg-slate-50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold font-headline text-primary">
                        Our Mission: Simplify Business
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                        We believe that the power to build a successful business should be in the hands of the creators, the builders, and the dreamers—not just those who can navigate complex software. Ogeemo was born from a simple idea: what if one platform could do it all, intuitively?
                    </p>
                </div>
            </section>
            
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                     <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">The Ogeemo Philosophy</h2>
                        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                            Our development is guided by three core principles.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                         <div className="flex flex-col items-center">
                            <div className="p-4 bg-primary/10 rounded-full mb-4">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="mt-4 text-xl font-bold">Human-Centric Design</h3>
                            <p className="mt-2 text-muted-foreground">We build for people, not for features. Every tool is designed to be intuitive and solve real-world problems, reducing the learning curve and empowering you to get back to work.</p>
                        </div>
                         <div className="flex flex-col items-center">
                             <div className="p-4 bg-primary/10 rounded-full mb-4">
                                <Target className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="mt-4 text-xl font-bold">Integration Over Isolation</h3>
                            <p className="mt-2 text-muted-foreground">Your business is a single, connected entity. Your software should be too. Ogeemo breaks down the silos between your finances, projects, and client relationships.</p>
                        </div>
                         <div className="flex flex-col items-center">
                             <div className="p-4 bg-primary/10 rounded-full mb-4">
                                <Lightbulb className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="mt-4 text-xl font-bold">AI as a Partner</h3>
                            <p className="mt-2 text-muted-foreground">We leverage artificial intelligence not to replace human intuition, but to augment it. Ogeemo is your smart assistant, automating the mundane so you can focus on the meaningful.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
