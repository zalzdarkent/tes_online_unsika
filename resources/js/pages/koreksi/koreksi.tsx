import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format-date';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ClipboardCheck, BarChart3 } from 'lucide-react';

interface DataJadwal {
    id: number;
    nama_jadwal: string;
    total_peserta: number;
    total_sudah_dikoreksi: number;
    total_draft: number;
    total_belum_dikoreksi: number;
    created_at: string;
}

interface Props {
    data: DataJadwal[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Koreksi Peserta',
        href: '/koreksi',
    },
];

export default function Koreksi({ data }: Props) {

    const columns: ColumnDef<DataJadwal>[] = [
        {
            accessorKey: 'nama_jadwal',
            header: 'Nama Jadwal Tes',
        },
        {
            accessorKey: 'total_peserta',
            header: 'Total Peserta',
            cell: ({ row }) => {
                const total = row.original.total_peserta;
                return (
                    <div className="text-center">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {total} Peserta
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status_koreksi',
            header: 'Status Koreksi',
            cell: ({ row }) => {
                const data = row.original;
                const { total_sudah_dikoreksi, total_draft, total_belum_dikoreksi } = data;

                return (
                    <div className="space-y-1">
                        {total_sudah_dikoreksi > 0 && (
                            <span className="mr-2 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                {total_sudah_dikoreksi} Final
                            </span>
                        )}
                        {total_draft > 0 && (
                            <span className="mr-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                {total_draft} Draft
                            </span>
                        )}
                        {total_belum_dikoreksi > 0 && (
                            <span className="mr-2 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {total_belum_dikoreksi} Belum Dikoreksi
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'progress',
            header: 'Progress Koreksi',
            cell: ({ row }) => {
                const data = row.original;
                const { total_peserta, total_sudah_dikoreksi } = data;
                const percentage = total_peserta > 0 ? Math.round((total_sudah_dikoreksi / total_peserta) * 100) : 0;

                return (
                    <div className="flex items-center space-x-2">
                        <div className="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                                className="h-2 rounded-full bg-green-500 transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Dibuat',
            cell: ({ row }) => formatDateTime(row.original.created_at),
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const data = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="cursor-pointer border-green-500 text-green-600 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
                            onClick={() => {
                                router.visit(`/koreksi/jadwal/${data.id}/peserta`);
                            }}
                        >
                            <ClipboardCheck className="mr-2 h-4 w-4 text-green-500" />
                            Koreksi Peserta
                        </Button>

                        <Button
                            variant="outline"
                            className="cursor-pointer border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                            onClick={() => {
                                router.visit(`/koreksi/jadwal/${data.id}/statistik`);
                            }}
                        >
                            <BarChart3 className="mr-2 h-4 w-4 text-blue-500" />
                            Statistik
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Koreksi Peserta" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Koreksi Peserta</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Pilih jadwal tes yang ingin Anda koreksi. Anda dapat melihat progress koreksi dan mengakses detail peserta dari setiap jadwal.
                    </p>
                </div>

                <DataTable
                    columns={columns}
                    data={data}
                    searchColumn="nama_jadwal"
                    searchPlaceholder="Cari nama jadwal tes..."
                    exportFilename="data-jadwal-koreksi"
                    showExportButton
                    emptyMessage={
                        <div className="w-full py-8 text-center text-gray-500">
                            <ClipboardCheck className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <p className="text-lg font-medium">Tidak ada jadwal tes untuk dikoreksi</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Jadwal tes akan muncul di sini setelah ada peserta yang mengikuti tes.
                            </p>
                        </div>
                    }
                    enableResponsiveHiding={false}
                />
            </div>
        </AppLayout>
    );
}
