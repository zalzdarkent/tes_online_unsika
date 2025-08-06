import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
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
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
            ),
            enableSorting: false,
            enableHiding: false,
        },
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
                        <Button
                            variant="outline"
                            className={
                                data.total_skor !== null
                                    ? 'cursor-pointer border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950'
                                    : 'cursor-pointer border-green-500 text-green-600 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950'
                            }
                            onClick={() => {
                                router.visit(`/koreksi/${data.id_user}/${data.id_jadwal}`);
                            }}
                        >
                            {data.total_skor !== null ? (
                                <>
                                    <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                    Lihat Detail
                                </>
                            ) : (
                                <>
                                    <ClipboardCheck className="mr-2 h-4 w-4 text-green-500" />
                                    Koreksi
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                            onClick={() => {
                                console.log('Hapus:', data);
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                        </Button>
                    </div>
                );
            },
        },
    ];

    const handleBulkDelete = (selectedData: DataKoreksi[]) => {
        const selectedIds = selectedData.map((item) => item.id_jadwal);
        console.log('Bulk delete for IDs:', selectedIds);

        // router.post(
        //     route('koreksi.bulk-destroy'),
        //     { ids: selectedIds },
        //     {
        //         onSuccess: () => {
        //             toast({
        //                 variant: 'success',
        //                 title: 'Berhasil!',
        //                 description: `${selectedData.length} data jawaban berhasil dihapus.`,
        //             });
        //         },
        //         onError: (errors: Record<string, string>) => {
        //             console.log('Delete errors:', errors);
        //             if (errors.error) {
        //                 toast({
        //                     variant: 'destructive',
        //                     title: 'Error!',
        //                     description: errors.error,
        //                 });
        //             } else {
        //                 toast({
        //                     variant: 'destructive',
        //                     title: 'Error!',
        //                     description: 'Terjadi kesalahan saat menghapus jawaban.',
        //                 });
        //             }
        //         },
        //     },
        // );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Koreksi Peserta" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h2 className="text-2xl font-bold">Koreksi Peserta</h2>
                <DataTable
                    columns={columns}
                    data={data}
                    searchColumn="nama_peserta"
                    searchPlaceholder="Cari nama peserta..."
                    exportFilename="data-koreksi"
                    showExportButton
                    onBulkDelete={handleBulkDelete}
                    emptyMessage={<div className="w-full py-8 text-center text-gray-500">Tidak ada daftar koreksi yang tersedia saat ini.</div>}
                />
            </div>
        </AppLayout>
    );
}
