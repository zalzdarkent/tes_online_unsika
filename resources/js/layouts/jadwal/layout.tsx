import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Kategori Tes',
        href: '/kategori',
        icon: null,
    },
    {
        title: 'Bank Soal',
        href: '/bank-soal',
        icon: null,
        roles: ['admin', 'teacher'], // Admin dan guru bisa akses bank soal
    },
    {
        title: 'Jadwal Tes',
        href: '/jadwal',
        icon: null,
    },
];

export default function JadwalLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const page = usePage<SharedData>();
    const user = page.props.auth.user;
    const appEnv = page.props.app_env;
    const currentPath = window.location.pathname;

    // Filter menu berdasarkan role dan environment
    const filteredNavItems = sidebarNavItems.filter(item => {
        // Jika item adalah Bank Soal
        if (item.href === '/bank-soal') {
            // Di production, admin dan guru bisa akses
            if (appEnv === 'production') {
                return user?.role === 'admin' || user?.role === 'teacher';
            }
            // Di development/local, admin dan guru bisa akses
            return user?.role === 'admin' || user?.role === 'teacher';
        }
        // Menu lain tetap ditampilkan
        return true;
    });

    return (
        <div className="px-4 py-6">
            <Heading title="Manajemen Jadwal" description="Kelola jadwal dan kategori tes" />

            <div className="flex w-full flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-12">
                {/* aside content */}
                <aside className="w-full shrink-0 lg:w-32">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {filteredNavItems.map((item, index) => (
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
                                    {item.href === '/bank-soal' && appEnv === 'production' && (
                                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">
                                            DEV
                                        </span>
                                    )}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />
                {/* main content */}
                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </div>
    );
}
