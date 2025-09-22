import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { FlashMessages } from '@/components/flash-messages';
import { Toaster } from '@/components/ui/toaster';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden flex flex-col">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1">
                    {children}
                </div>
                {/* Footer Copyright */}
                <footer className="mt-auto border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto px-4 py-3">
                        <div className="text-center text-xs text-muted-foreground">
                            © {new Date().getFullYear()} UPA TIK UNSIKA X{' '}
                            <Link 
                                href="/dev" 
                                className="hover:text-foreground transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
                            >
                                Asisten Laboratorium Komputer
                            </Link>
                            . All rights reserved. | Developed with ❤️ for Universitas Singaperbangsa Karawang
                        </div>
                    </div>
                </footer>
            </AppContent>
            <FlashMessages />
            <Toaster />
        </AppShell>
    );
}
