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
    start_time: string;
    total_nilai?: number | null;
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
            accessorKey: 'start_time',
            header: 'Waktu Mengerjakan',
            cell: ({ row }) => formatDateTime(row.original.start_time),
        },
        {
            accessorKey: 'total_nilai',
            header: 'Skor',
            cell: ({ row }) => {
                const total_nilai = row.original.total_nilai;
                return total_nilai !== null && total_nilai !== undefined ? `${total_nilai}` : 'Belum dikoreksi';
            },
        },
    ];

    return (
        <AppLayout>
            <Head title="Riwayat Tes" />
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold">Riwayat Tes</h1>

                {/* <div className="mx-auto md:max-w-3xl"> */}
                <DataTable
                    columns={columns}
                    data={riwayat}
                    searchColumn="nama_jadwal"
                    searchPlaceholder="Cari nama tes..."
                    emptyMessage={<div className="w-full py-8 text-center text-gray-500">Belum ada tes yang dikerjakan.</div>}
                />
                {/* </div> */}
            </div>
        </AppLayout>
    );
}
