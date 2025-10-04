import ConfirmDialogWrapper from '@/components/modal/ConfirmDialogWrapper';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { TooltipProvider } from '@/components/ui/tooltip';
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
    waktu_mulai_tes?: string | null;
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
    dapat_mulai_tes_sekarang: boolean; // Tambahan untuk cek waktu mulai tes
    menit_menuju_mulai_tes?: number; // Berapa menit lagi bisa mulai tes
    hasil_test?: {
        id: number;
        status_tes: 'sedang_mengerjakan' | 'terputus' | 'selesai' | 'tidak_dimulai';
        boleh_dilanjutkan: boolean;
        sisa_waktu_detik?: number;
        sisa_waktu_detik_realtime?: number;
        alasan_terputus?: string;
        total_nilai?: number;
    } | null;
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

    const handleLanjutkanTes = (id_jadwal: number) => {
        router.post(
            route('peserta.lanjutkan-tes'),
            { id_jadwal },
            {
                onError: (errors) => {
                    toast({
                        variant: 'destructive',
                        title: 'Gagal melanjutkan tes',
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
            accessorKey: 'waktu_mulai_tes',
            header: 'Waktu Mulai Tes',
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const waktuMulaiTes = row.original.waktu_mulai_tes;
                if (!waktuMulaiTes) {
                    return <div className="text-muted-foreground text-sm">Menggunakan tanggal mulai</div>;
                }
                return <div className="text-sm">{formatDateTime(waktuMulaiTes)}</div>;
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
                const hasilTest = row.original.hasil_test;

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
                    <div className="space-y-1">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.text}
                        </span>
                        {hasilTest && statusPendaftaran === 'disetujui' && (
                            <div className="text-xs">
                                {hasilTest.status_tes === 'sedang_mengerjakan' && (
                                    <span className="text-blue-600">Sedang Mengerjakan</span>
                                )}
                                {hasilTest.status_tes === 'terputus' && (
                                    <span className="text-orange-600">
                                        {hasilTest.boleh_dilanjutkan ? 'Dapat Dilanjutkan' : 'Terputus'}
                                    </span>
                                )}
                                {hasilTest.status_tes === 'selesai' && (
                                    <span className="text-green-600">Selesai ({hasilTest.total_nilai || '0'})</span>
                                )}
                            </div>
                        )}
                    </div>
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
                    bisa_mulai_tes,
                    dapat_mulai_tes_sekarang,
                    menit_menuju_mulai_tes
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

                // Jika disetujui, cek apakah sudah bisa mulai tes
                if (status_pendaftaran === 'disetujui') {
                    const hasilTest = row.original.hasil_test;

                    // Jika ada tes yang terputus dan diizinkan dilanjutkan
                    if (hasilTest?.status_tes === 'terputus' && hasilTest?.boleh_dilanjutkan) {
                        // Gunakan sisa waktu real-time jika tersedia, fallback ke sisa_waktu_detik
                        const sisaWaktuDetik = hasilTest.sisa_waktu_detik_realtime ?? hasilTest.sisa_waktu_detik ?? 0;
                        const sisaWaktuMenit = Math.ceil(sisaWaktuDetik / 60);

                        // Jika waktu sudah habis, jangan tampilkan tombol lanjutkan
                        if (sisaWaktuDetik <= 0) {
                            return (
                                <div className="text-sm text-center">
                                    <span className="text-red-600 font-medium">Waktu Habis</span>
                                    <div className="text-xs text-muted-foreground">
                                        Tidak dapat melanjutkan tes
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-2">
                                <ConfirmDialogWrapper
                                    title="Lanjutkan Tes?"
                                    description={`Anda bisa melanjutkan tes dengan sisa waktu ${sisaWaktuMenit} menit. Apakah ingin melanjutkan sekarang?`}
                                    confirmLabel="Lanjutkan"
                                    cancelLabel="Batal"
                                    onConfirm={() => handleLanjutkanTes(id)}
                                    trigger={<Button className="w-full">Lanjutkan Tes</Button>}
                                />
                                <div className="text-xs text-amber-600 text-center">
                                    Sisa waktu: {sisaWaktuMenit} menit
                                </div>
                            </div>
                        );
                    }

                    // Jika tes selesai
                    if (hasilTest?.status_tes === 'selesai') {
                        return (
                            <div className="text-sm text-center">
                                <span className="text-green-600 font-medium">Tes Selesai</span>
                                {hasilTest.total_nilai !== undefined && (
                                    <div className="text-xs text-muted-foreground">
                                        Nilai: {hasilTest.total_nilai}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Jika tes terputus tapi belum diizinkan melanjutkan
                    if (hasilTest?.status_tes === 'terputus' && !hasilTest?.boleh_dilanjutkan) {
                        return (
                            <div className="text-sm text-center">
                                <span className="text-orange-600 font-medium">Tes Terputus</span>
                                <div className="text-xs text-muted-foreground">
                                    Menunggu izin dari pengawas
                                </div>
                                {hasilTest.alasan_terputus && (
                                    <div className="text-xs text-amber-600">
                                        {hasilTest.alasan_terputus}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Jika sedang mengerjakan
                    if (hasilTest?.status_tes === 'sedang_mengerjakan') {
                        return (
                            <ConfirmDialogWrapper
                                title="Lanjutkan Tes?"
                                description="Anda memiliki tes yang sedang berlangsung. Apakah ingin melanjutkan?"
                                confirmLabel="Lanjutkan"
                                cancelLabel="Batal"
                                onConfirm={() => handleStart(id)}
                                trigger={<Button>Lanjutkan Tes</Button>}
                            />
                        );
                    }

                    // Jika belum bisa mulai tes karena waktu mulai tes belum tiba
                    if (!dapat_mulai_tes_sekarang && menit_menuju_mulai_tes !== undefined && menit_menuju_mulai_tes > 0) {
                        const totalMenit = Math.ceil(menit_menuju_mulai_tes); // Bulatkan ke atas
                        const jam = Math.floor(totalMenit / 60);
                        const menit = totalMenit % 60;

                        let waktuText = '';
                        if (jam > 0 && menit > 0) {
                            waktuText = `${jam} jam ${menit} menit`;
                        } else if (jam > 0) {
                            waktuText = `${jam} jam`;
                        } else {
                            waktuText = `${menit} menit`;
                        }

                        return (
                            <div className="text-sm">
                                <span className="text-blue-600 font-medium">Disetujui</span>
                                <br />
                                <span className="text-amber-600 italic">Tes dimulai dalam {waktuText}</span>
                            </div>
                        );
                    }

                    // Jika sudah bisa mulai tes
                    if (bisa_mulai_tes && dapat_mulai_tes_sekarang) {
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
                }                return <span className="text-sm text-muted-foreground italic">Tidak dapat mengikuti tes</span>;
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
                        enableResponsiveHiding={false}
                    />
                </div>
            </TooltipProvider>
        </AppLayout>
    );
}
