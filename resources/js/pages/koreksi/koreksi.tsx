import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format-date';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ClipboardCheck, Eye, Trash2 } from 'lucide-react';

interface DataKoreksi {
    id_user: number;
    id_jadwal: number;
    nama_peserta: string;
    nama_jadwal: string;
    total_soal: number;
    total_skor: number | null;
    waktu_ujian: string;
}

interface Props {
    data: DataKoreksi[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Koreksi Peserta',
        href: '/koreksi',
    },
];

export default function Koreksi({ data }: Props) {
    const columns: ColumnDef<DataKoreksi>[] = [
        {
            accessorKey: 'nama_peserta',
            header: 'Nama Peserta',
        },
        {
            accessorKey: 'nama_jadwal',
            header: 'Jadwal Tes',
        },
        {
            accessorKey: 'total_soal',
            header: 'Total Soal',
        },
        {
            accessorKey: 'total_skor',
            header: 'Total Skor',
            cell: ({ row }) => {
                const skor = row.original.total_skor;
                return skor !== null ? skor : 'Belum dikoreksi';
            },
        },
        {
            accessorKey: 'waktu_ujian',
            header: 'Waktu Ujian',
            cell: ({ row }) => formatDateTime(row.original.waktu_ujian),
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const data = row.original;

                return (
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className={
                                            data.total_skor !== null
                                                ? 'cursor-pointer border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950'
                                                : 'cursor-pointer border-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950'
                                        }
                                        onClick={() => {
                                            router.visit(`/koreksi/${data.id_user}/${data.id_jadwal}`);
                                        }}
                                    >
                                        {data.total_skor !== null ? (
                                            <Eye className="h-4 w-4 text-blue-500" />
                                        ) : (
                                            <ClipboardCheck className="h-4 w-4 text-green-500" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{data.total_skor !== null ? 'Lihat Detail' : 'Koreksi'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="cursor-pointer border-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => {
                                            // TODO: Implementasi fungsi hapus
                                            console.log('Hapus:', data);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/90 dark:text-red-400 dark:hover:text-red-300" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Hapus</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Koreksi Peserta" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h2 className="text-2xl font-bold">Koreksi Peserta</h2>
                <div className="rounded-xl border p-6">
                    <DataTable
                        columns={columns}
                        data={data}
                        searchColumn="nama_peserta"
                        searchPlaceholder="Cari nama peserta..."
                        exportFilename="data-koreksi"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
