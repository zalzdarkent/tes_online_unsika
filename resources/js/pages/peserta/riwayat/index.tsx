import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format-date';
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';

interface RiwayatTes {
    id: number;
    jadwal: {
        id: number;
        nama_jadwal: string;
    };
    waktu_ujian: string;
    total_skor?: number | null;
}

interface Props {
    riwayat: RiwayatTes[];
}

export default function RiwayatTes({ riwayat }: Props) {
    const columns: ColumnDef<RiwayatTes>[] = [
        {
            accessorKey: 'nama_jadwal',
            header: 'Nama Tes',
            cell: ({ row }) => row.original.jadwal?.nama_jadwal ?? '-',
        },
        {
            accessorKey: 'waktu_ujian',
            header: 'Waktu Ujian',
            cell: ({ row }) => formatDateTime(row.original.waktu_ujian),
        },
        // {
        //     accessorKey: 'total_skor',
        //     header: 'Total Skor',
        //     cell: ({ row }) => {
        //         const total_skor = row.original.total_skor;
        //         return total_skor !== null && total_skor !== undefined ? `${total_skor}` : 'Belum dikoreksi';
        //     },
        // },
    ];

    return (
        <AppLayout>
            <Head title="Riwayat Tes" />
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold">Riwayat Tes</h1>

                <DataTable
                    columns={columns}
                    data={riwayat}
                    searchColumn="nama_jadwal"
                    searchPlaceholder="Cari nama tes..."
                    emptyMessage={<div className="w-full py-8 text-center text-gray-500">Belum ada tes yang dikerjakan.</div>}
                />
            </div>
        </AppLayout>
    );
}
