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
import { toast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format-date';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect } from 'react';

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
    sudah_kerjakan_jadwal_sebelumnya: boolean;
}

interface Props {
    jadwal: JadwalData[];
    debug?: {
        total_jadwal_in_db: number;
        jadwal_status_buka: number;
        jadwal_belum_dikerjakan: number;
        total_jadwal_found: number;
        current_time: string;
        user_id: number;
        note: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Daftar Tes',
        href: '/daftar-tes',
    },
];

export default function DaftarTes({ jadwal }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();

    useEffect(() => {
        if (props.errors?.error) {
            toast({
                variant: 'destructive',
                title: 'Gagal memulai tes',
                description: props.errors.error,
            });
        }
    }, [props.errors]);

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
                const { id, sudah_kerjakan_jadwal_sebelumnya, tanggal_mulai } = row.original;

                if (!sudah_kerjakan_jadwal_sebelumnya) {
                    return <span className="text-sm text-muted-foreground italic">Anda belum mengerjakan tes sebelumnya</span>;
                }

                if (new Date(tanggal_mulai) > new Date()) {
                    return <span className="text-sm text-muted-foreground italic">Belum dimulai</span>;
                }

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
                                    <Button
                                        onClick={() => {
                                            router.post(
                                                route('peserta.start'),
                                                { id_jadwal: id },
                                                {
                                                    onSuccess: () => router.visit(`/tes/${id}/soal`),
                                                    onError: (errors) => {
                                                        toast({
                                                            variant: 'destructive',
                                                            title: 'Gagal memulai tes',
                                                            description: errors.error,
                                                        });
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        Ya, Mulai
                                    </Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Tes" />
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold">Daftar Tes Tersedia</h1>

                {/* Debug Info - Hapus setelah troubleshooting selesai */}
                {/* {debug && (
                    <div className="rounded-lg bg-yellow-50 p-4 text-sm">
                        <h3 className="font-semibold text-yellow-800">Debug Info:</h3>
                        <div className="mt-2 space-y-1 text-yellow-700">
                            <p>Total jadwal di database: {debug.total_jadwal_in_db}</p>
                            <p>Jadwal dengan status BUKA: {debug.jadwal_status_buka}</p>
                            <p>Jadwal belum dikerjakan: {debug.jadwal_belum_dikerjakan}</p>
                            <p>Total jadwal yang ditemukan: {debug.total_jadwal_found}</p>
                            <p>Waktu sekarang: {debug.current_time}</p>
                            <p>User ID: {debug.user_id}</p>
                            <p className="font-semibold">{debug.note}</p>
                        </div>
                    </div>
                )} */}

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
