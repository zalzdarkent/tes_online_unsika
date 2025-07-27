import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format-date';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';

interface JadwalData {
    id: number;
    nama_jadwal: string;
    tanggal_mulai: string;
    tanggal_berakhir: string;
    status: string;
    jadwal_sebelumnya?: {
        id: number;
        nama_jadwal: string;
    } | null;
}

interface Props {
    jadwal: JadwalData[];
}

export default function DaftarTes({ jadwal }: Props) {
    // is loading
    if (!jadwal) {
        return (
            <AppLayout>
                <Head title="Daftar Tes" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <h2 className="text-2xl font-bold">Daftar Tes</h2>
                    <div className="py-8 text-center">Loading...</div>
                </div>
            </AppLayout>
        );
    }

    const columns: ColumnDef<JadwalData>[] = [
        {
            accessorKey: 'nama_jadwal',
            header: 'Nama Jadwal',
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'tanggal_mulai',
            header: 'Tanggal Mulai',
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const tanggal = row.getValue('tanggal_mulai') as string;
                return formatDateTime(tanggal);
            },
        },
        {
            accessorKey: 'tanggal_berakhir',
            header: 'Tanggal Berakhir',
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const tanggal = row.getValue('tanggal_berakhir') as string;
                return formatDateTime(tanggal);
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                return (
                    <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                            status === 'Buka'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                    >
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: 'id_jadwal_sebelumnya',
            header: 'Jadwal Sebelumnya',
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const jadwalSebelumnya = row.original.jadwal_sebelumnya;
                return <div className="text-muted-foreground">{jadwalSebelumnya?.nama_jadwal ?? '-'}</div>;
            },
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const { id } = row.original;
                return (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="cursor-pointer">Mulai Tes</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Mulai Tes?</AlertDialogTitle>
                                <AlertDialogDescription>Apakah Anda yakin ingin memulai tes ini? Pastikan Anda sudah siap.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button onClick={() => router.visit(`/tes/${id}/soal`)}>Ya, Mulai</Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                );
            },
        },
    ];

    return (
        <AppLayout>
            <Head title="Daftar Tes" />
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold">Daftar Tes Tersedia</h1>

                <DataTable
                    columns={columns}
                    data={jadwal}
                    searchColumn="nama_jadwal"
                    searchPlaceholder="Cari tes..."
                    emptyMessage={<div className="w-full py-8 text-center text-gray-500">Tidak ada jadwal tes yang tersedia saat ini.</div>}
                />
            </div>
        </AppLayout>
    );
}
