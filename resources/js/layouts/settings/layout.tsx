import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profil',
        href: '/settings/profile',
        icon: null,
    },
    {
        title: 'Info Akademik',
        href: '/settings/academic',
        icon: null,
    },
    {
        title: 'Password',
        href: '/settings/password',
        icon: null,
    },
    {
        title: 'Tampilan',
        href: '/settings/appearance',
        icon: null,
    },
];

const adminOnlyNavItems: NavItem[] = [
    {
        title: 'System Settings',
        href: '/settings/system',
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const page = usePage();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth = (page.props as any)?.auth;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    // Combine nav items - add admin items only if user is admin
    const allNavItems = [...sidebarNavItems];
    if (auth?.user?.role === 'admin') {
        allNavItems.push(...adminOnlyNavItems);
    }

    return (
        <div className="px-4 py-6">
            <Heading title="Settings" description="Manage your profile and account settings" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {allNavItems.map((item, index) => (
                            <Button
                                key={`${item.href}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': currentPath === item.href,
                                })}
                            >
                                <Link href={item.href} prefetch>
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="w-full flex-1 md:max-w-2xl">
                    <section className="space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
