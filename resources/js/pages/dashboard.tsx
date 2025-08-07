import { toast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Users, Signal, Calendar } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { props } = usePage<{ errors?: Record<string, string> }>();

    useEffect(() => {
        if (props.errors?.error) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: props.errors.error,
            });
        }
    }, [props.errors]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-sidebar-bg p-4">
                        <div className="flex h-full flex-col justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-6 w-6 text-blue-500" />
                                <span className="text-sm font-medium">Total Peserta</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold">1,234</span>
                                <span className="text-sm text-green-500">+12%</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-sidebar-bg p-4">
                        <div className="flex h-full flex-col justify-between">
                            <div className="flex items-center gap-2">
                                <Signal className="h-6 w-6 text-green-500" />
                                <span className="text-sm font-medium">Peserta Online</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold">42</span>
                                <span className="text-sm text-neutral-500">Saat ini</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-sidebar-bg p-4">
                        <div className="flex h-full flex-col justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-6 w-6 text-purple-500" />
                                <span className="text-sm font-medium">Tes Aktif</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold">5</span>
                                <span className="text-sm text-neutral-500">Sedang Berlangsung</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-sidebar-bg p-6 md:min-h-min">
                    <h2 className="mb-4 text-lg font-semibold">Aktivitas Terbaru</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Tes Matematika Dasar</p>
                                <p className="text-sm text-neutral-500">20 peserta terdaftar</p>
                            </div>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 dark:bg-blue-500/20">Akan Datang</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Tes Bahasa Inggris</p>
                                <p className="text-sm text-neutral-500">15 peserta sedang mengerjakan</p>
                            </div>
                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600 dark:bg-green-500/20">Sedang Berlangsung</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Tes Logika</p>
                                <p className="text-sm text-neutral-500">42 peserta selesai</p>
                            </div>
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-600 dark:bg-neutral-500/20">Selesai</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
