import Link from "next/link";
import { Logo } from "../logo";
import { navLinks } from "@/lib/constants";

export function SiteFooter() {
    return (
        <footer className="border-t">
            <div className="container py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4 md:col-span-1">
                        <Logo />
                        <p className="text-sm text-muted-foreground">Simplify Your Business. Empower Your Growth.</p>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="font-semibold mb-2">Product</h4>
                            <ul className="space-y-2">
                                {navLinks.map(link => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-2">Company</h4>
                            <ul className="space-y-2">
                                <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link></li>
                                <li><Link href="/news" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link></li>
                                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
                                <li><Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">Beta Program</Link></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-2">Legal</h4>
                            <ul className="space-y-2">
                                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Ogeemo Inc. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
