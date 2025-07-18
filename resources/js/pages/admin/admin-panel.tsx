import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Panel',
        href: '/admin',
    },
];

export default function AdminPanel() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Panel" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <h2 className="text-2xl font-bold">Admin Panel</h2>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border p-6">
                    <p className="text-lg">Halaman khusus untuk admin saja.</p>
                    <div className="mt-4 space-y-2">
                        <p>✅ Kelola semua user</p>
                        <p>✅ Kelola sistem</p>
                        <p>✅ Akses ke semua fitur</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
