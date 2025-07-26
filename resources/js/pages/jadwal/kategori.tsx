import { Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import JadwalLayout from "@/layouts/jadwal/layout";
import { type BreadcrumbItem } from "@/types";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jadwal Tes',
        href: '/jadwal',
    },
    {
        title: 'Kategori',
        href: '/jadwal/kategori',
    },
];

export default function KategoriTes() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Tes" />
            <JadwalLayout>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl overflow-x-auto">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Kategori Tes</h2>
                    </div>
                    {/* Tambahkan konten kategori tes di sini */}
                    <div className="text-center py-8 text-gray-500">
                        Konten kategori tes akan ditampilkan di sini
                    </div>
                </div>
            </JadwalLayout>
        </AppLayout>
    );
}
