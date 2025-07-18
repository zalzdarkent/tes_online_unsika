import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Koreksi Peserta',
        href: '/koreksi',
    },
];

export default function Koreksi() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Koreksi Peserta" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <h2 className="text-2xl font-bold">Koreksi Peserta</h2>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border p-6">
                    <p className="text-lg">Halaman untuk mengoreksi jawaban peserta tes online.</p>
                </div>
            </div>
        </AppLayout>
    );
}
