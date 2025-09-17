import ConfirmDialogWrapper from '@/components/modal/ConfirmDialogWrapper';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    durasi: number;
    jadwal_sebelumnya?: {
        id: number;
        nama_jadwal: string;
    } | null;
    sudah_kerjakan_jadwal_sebelumnya: boolean;
    // Tambahan untuk sistem pendaftaran
    status_pendaftaran?: 'menunggu' | 'disetujui' | 'ditolak' | null;
    sudah_daftar: boolean;
    bisa_mulai_tes: boolean;
}

interface Props {
    jadwal: JadwalData[];
    isProfileComplete: boolean;
    missingProfileFields: string[];
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

export default function DaftarTes({ jadwal, isProfileComplete, missingProfileFields }: Props) {
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

    const handleStart = (id_jadwal: number) => {
        router.post(
            route('peserta.start'),
            { id_jadwal },
            {
                onError: (errors) => {
                    toast({
                        variant: 'destructive',
                        title: 'Gagal memulai tes',
                        description: errors.error,
                    });
                },
            },
        );
    };

    const handleDaftar = (id_jadwal: number) => {
        router.post(
            route('peserta.daftar'),
            { id_jadwal },
            {
                onSuccess: () => {
                    toast({
                        title: 'Berhasil!',
                        description: 'Pendaftaran berhasil! Menunggu persetujuan dari penyelenggara tes.',
                    });
                },
                onError: (errors) => {
                    toast({
                        variant: 'destructive',
                        title: 'Gagal mendaftar',
                        description: errors.error,
                    });
                },
            },
        );
    };

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
            accessorKey: 'durasi',
            header: 'Durasi',
            enableSorting: false,
            cell: ({ row }) => {
                const durasi = row.original.durasi;
                return <div className="text-muted-foreground">{durasi} menit</div>;
            },
        },
        {
            accessorKey: 'status_pendaftaran',
            header: 'Status Pendaftaran',
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const statusPendaftaran = row.original.status_pendaftaran;
                const sudahDaftar = row.original.sudah_daftar;

                if (!sudahDaftar) {
                    return <span className="text-sm text-muted-foreground">Belum Daftar</span>;
                }

                const statusMap: Record<string, { text: string; color: string }> = {
                    'menunggu': { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
                    'disetujui': { text: 'Disetujui', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
                    'ditolak': { text: 'Ditolak', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
                };

                const statusConfig = statusPendaftaran && statusMap[statusPendaftaran]
                    ? statusMap[statusPendaftaran]
                    : { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };

                return (
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.text}
                    </span>
                );
            },
        },
        {
            accessorKey: 'id_jadwal_sebelumnya',
            header: 'Jadwal Sebelumnya',
            enableSorting: false,
            cell: ({ row }) => {
                const jadwalSebelumnya = row.original.jadwal_sebelumnya;
                return <div className="text-muted-foreground">{jadwalSebelumnya?.nama_jadwal ?? '-'}</div>;
            },
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const {
                    id,
                    sudah_kerjakan_jadwal_sebelumnya,
                    tanggal_mulai,
                    status_pendaftaran,
                    sudah_daftar,
                    bisa_mulai_tes
                } = row.original;

                // Jika belum mengerjakan tes sebelumnya
                if (!sudah_kerjakan_jadwal_sebelumnya) {
                    return <span className="text-sm text-muted-foreground italic">Anda belum mengerjakan tes sebelumnya</span>;
                }

                // Jika belum dimulai
                if (new Date(tanggal_mulai) > new Date()) {
                    return <span className="text-sm text-muted-foreground italic">Belum dimulai</span>;
                }

                // Jika belum daftar
                if (!sudah_daftar) {
                    return (
                        <ConfirmDialogWrapper
                            title="Daftar Tes?"
                            description="Apakah Anda yakin ingin mendaftar tes ini?"
                            confirmLabel="Daftar"
                            cancelLabel="Batal"
                            onConfirm={() => handleDaftar(id)}
                            trigger={<Button>Daftar</Button>}
                        />
                    );
                }

                // Jika sudah daftar tapi belum disetujui
                if (status_pendaftaran === 'menunggu') {
                    return <span className="text-sm text-yellow-600 italic">Menunggu Persetujuan</span>;
                }

                // Jika ditolak
                if (status_pendaftaran === 'ditolak') {
                    return <span className="text-sm text-red-600 italic">Pendaftaran Ditolak</span>;
                }

                // Jika disetujui, bisa mulai tes
                if (bisa_mulai_tes) {
                    return (
                        <ConfirmDialogWrapper
                            title="Mulai Tes?"
                            description="Apakah Anda yakin ingin memulai tes ini? Pastikan Anda sudah siap."
                            confirmLabel="Mulai"
                            cancelLabel="Batal"
                            onConfirm={() => handleStart(id)}
                            trigger={<Button>Mulai Tes</Button>}
                        />
                    );
                }

                return <span className="text-sm text-muted-foreground italic">Tidak dapat mengikuti tes</span>;
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Tes" />
            <TooltipProvider>
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
            </TooltipProvider>
        </AppLayout>
    );
}
