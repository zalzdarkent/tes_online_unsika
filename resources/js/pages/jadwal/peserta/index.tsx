import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import JadwalLayout from '@/layouts/jadwal/layout';
import { formatDateTime } from '@/lib/format-date';
import { type BreadcrumbItem } from '@/types';
import ViolationAlert from '@/components/violation-alert';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Check, MoreHorizontal, Play, Trash2, UserPlus, X, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Echo from '@/lib/echo';

interface JadwalData {
    id: number;
    nama_jadwal: string;
    tanggal_mulai: string;
    tanggal_berakhir: string;
    status: string;
    durasi: number;
    kategori?: {
        id: number;
        nama: string;
    };
    user?: {
        id: number;
        nama: string;
    };
}

interface PesertaData {
    id: number;
    nama: string;
    email: string;
    npm?: string;
    prodi?: string;
    fakultas?: string;
    universitas?: string;
}

interface PesertaTerdaftarData {
    id: number;
    id_jadwal: number;
    id_peserta: number;
    status: 'menunggu' | 'disetujui' | 'ditolak';
    cara_daftar: 'mandiri' | 'teacher';
    tanggal_daftar: string;
    tanggal_approval?: string;
    keterangan?: string;
    peserta: PesertaData;
    approver?: {
        id: number;
        nama: string;
    };
    hasil_test?: {
        id: number;
        status_tes: 'sedang_mengerjakan' | 'terputus' | 'selesai' | 'tidak_dimulai';
        boleh_dilanjutkan: boolean;
        sisa_waktu_detik?: number;
        alasan_terputus?: string;
        diizinkan_lanjut_pada?: string;
        diizinkan_oleh?: number;
        total_skor?: number;
        total_nilai?: number;
    } | null;
}

interface Props {
    jadwal: JadwalData;
    pesertaTerdaftar: PesertaTerdaftarData[];
    allPeserta: PesertaData[];
}

export default function JadwalPesertaPage({ jadwal, pesertaTerdaftar, allPeserta }: Props) {
    const { toast } = useToast();
    const [selectedPeserta, setSelectedPeserta] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pesertaList, setPesertaList] = useState<PesertaTerdaftarData[]>(pesertaTerdaftar);

    // Setup real-time listeners
    useEffect(() => {
        console.log('📡 [Peserta Terdaftar] Subscribing to real-time channels for jadwal:', jadwal.id);

        // Listen untuk peserta baru mendaftar
        const pesertaChannel = Echo.channel(`jadwal.${jadwal.id}.peserta`);

        pesertaChannel.listen('.peserta.registered', (event: any) => {
            console.log('✅ [Peserta Terdaftar] New registration event received:', event);
            console.log('   - Peserta:', event.registration?.peserta?.nama);

            // Tambahkan peserta baru ke list
            setPesertaList(prev => [event.registration, ...prev]);

            toast({
                title: 'Pendaftaran Baru!',
                description: `${event.registration.peserta.nama} telah mendaftar ke tes ini.`,
            });
        });

        // Listen untuk update status registrasi
        pesertaChannel.listen('.registration.status.updated', (event: any) => {
            console.log('✅ [Peserta Terdaftar] Registration status updated:', event);
            console.log('   - Peserta:', event.registration?.peserta?.nama);
            console.log('   - Status:', event.status);

            // Update status peserta di list
            setPesertaList(prev =>
                prev.map(p =>
                    p.id === event.registration.id ? event.registration : p
                )
            );
        });

        // Listen untuk izin melanjutkan tes
        pesertaChannel.listen('.test.continue.allowed', (event: any) => {
            console.log('✅ [Peserta Terdaftar] Continue test allowed:', event);
            console.log('   - Peserta:', event.registration?.peserta?.nama);

            // Update data peserta yang diizinkan lanjut
            setPesertaList(prev =>
                prev.map(p =>
                    p.id === event.registration.id ? event.registration : p
                )
            );

            toast({
                title: 'Izin Diberikan',
                description: `${event.registration.peserta.nama} diizinkan melanjutkan tes.`,
            });
        });

        // Listen untuk violation
        const violationChannel = Echo.channel(`jadwal.${jadwal.id}.violations`);

        violationChannel.listen('.violation.detected', (event: any) => {
            console.log('⚠️ [Peserta Terdaftar] Violation detected:', event);
            console.log('   - Peserta ID:', event.peserta_id);

            // Tampilkan notifikasi tanpa reload
            toast({
                variant: 'destructive',
                title: 'Pelanggaran Terdeteksi!',
                description: `Pelanggaran terdeteksi pada peserta ID ${event.peserta_id}`,
            });
        });        console.log('✅ [Peserta Terdaftar] Successfully subscribed to channels:');
        console.log('   - jadwal.' + jadwal.id + '.peserta');
        console.log('   - jadwal.' + jadwal.id + '.violations');

        // Cleanup on unmount
        return () => {
            console.log('🔌 [Peserta Terdaftar] Unsubscribing from channels for jadwal:', jadwal.id);
            Echo.leaveChannel(`jadwal.${jadwal.id}.peserta`);
            Echo.leaveChannel(`jadwal.${jadwal.id}.violations`);
        };
    }, [jadwal.id, toast]);

    // Update pesertaList when prop changes
    useEffect(() => {
        setPesertaList(pesertaTerdaftar);
    }, [pesertaTerdaftar]);

    // Alert Dialog States
    const [alertDialog, setAlertDialog] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        confirmText?: string;
        variant?: 'default' | 'destructive';
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => {},
        confirmText: 'Ya',
        variant: 'default',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Jadwal Tes', href: '/jadwal' },
        { title: jadwal.nama_jadwal, href: `/jadwal/${jadwal.id}/soal` },
        { title: 'Peserta', href: `/jadwal/${jadwal.id}/peserta` },
    ];

    const showAlert = (
        title: string,
        description: string,
        onConfirm: () => void,
        confirmText: string = 'Ya',
        variant: 'default' | 'destructive' = 'default',
    ) => {
        setAlertDialog({
            isOpen: true,
            title,
            description,
            onConfirm,
            confirmText,
            variant,
        });
    };

    const handleRefresh = () => {
        router.reload();
    };

    const handleDaftarkanPeserta = () => {
        if (selectedPeserta.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Pilih minimal satu peserta untuk didaftarkan.',
            });
            return;
        }

        setIsSubmitting(true);

        router.post(
            route('jadwal.peserta.daftarkan', jadwal.id),
            { id_peserta: selectedPeserta },
            {
                onSuccess: () => {
                    toast({
                        title: 'Berhasil!',
                        description: `${selectedPeserta.length} peserta berhasil didaftarkan.`,
                    });
                    setSelectedPeserta([]);
                    setIsModalOpen(false);
                },
                onError: (errors) => {
                    console.log('Error response:', errors);
                    toast({
                        variant: 'destructive',
                        title: 'Error!',
                        description: errors.error || errors.message || 'Terjadi kesalahan.',
                    });
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleBulkApprove = (selectedData: PesertaTerdaftarData[]) => {
        const menungguIds = selectedData.filter((item) => item.status === 'menunggu').map((item) => item.id);

        if (menungguIds.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Tidak ada peserta yang bisa disetujui (status menunggu).',
            });
            return;
        }

        showAlert(
            'Konfirmasi Persetujuan',
            `Yakin ingin menyetujui ${menungguIds.length} peserta yang dipilih?`,
            () => {
                router.post(
                    route('jadwal.peserta.bulk-approve', jadwal.id),
                    { ids: menungguIds },
                    {
                        onSuccess: () => {
                            toast({
                                title: 'Berhasil!',
                                description: `${menungguIds.length} peserta berhasil disetujui.`,
                            });
                        },
                        onError: (errors) => {
                            toast({
                                variant: 'destructive',
                                title: 'Error!',
                                description: errors.error || 'Terjadi kesalahan.',
                            });
                        },
                    },
                );
            },
            'Setujui',
            'default',
        );
    };

    const handleBulkReject = (selectedData: PesertaTerdaftarData[]) => {
        const menungguIds = selectedData.filter((item) => item.status === 'menunggu').map((item) => item.id);

        if (menungguIds.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Tidak ada peserta yang bisa ditolak (status menunggu).',
            });
            return;
        }

        showAlert(
            'Konfirmasi Penolakan',
            `Yakin ingin menolak ${menungguIds.length} peserta yang dipilih?`,
            () => {
                router.post(
                    route('jadwal.peserta.bulk-reject', jadwal.id),
                    { ids: menungguIds },
                    {
                        onSuccess: () => {
                            toast({
                                title: 'Berhasil!',
                                description: `${menungguIds.length} peserta ditolak.`,
                            });
                        },
                        onError: (errors) => {
                            toast({
                                variant: 'destructive',
                                title: 'Error!',
                                description: errors.error || 'Terjadi kesalahan.',
                            });
                        },
                    },
                );
            },
            'Tolak',
            'destructive',
        );
    };

    const handleApprove = (registrationId: number) => {
        showAlert(
            'Konfirmasi Persetujuan',
            'Yakin ingin menyetujui peserta ini?',
            () => {
                router.post(
                    route('jadwal.peserta.approve', [jadwal.id, registrationId]),
                    {},
                    {
                        onSuccess: () => {
                            toast({
                                title: 'Berhasil!',
                                description: 'Peserta berhasil disetujui.',
                            });
                        },
                        onError: (errors) => {
                            toast({
                                variant: 'destructive',
                                title: 'Error!',
                                description: errors.error || 'Terjadi kesalahan.',
                            });
                        },
                    },
                );
            },
            'Setujui',
            'default',
        );
    };

    const handleReject = (registrationId: number) => {
        showAlert(
            'Konfirmasi Penolakan',
            'Yakin ingin menolak peserta ini?',
            () => {
                router.post(
                    route('jadwal.peserta.reject', [jadwal.id, registrationId]),
                    {},
                    {
                        onSuccess: () => {
                            toast({
                                title: 'Berhasil!',
                                description: 'Peserta ditolak.',
                            });
                        },
                        onError: (errors) => {
                            toast({
                                variant: 'destructive',
                                title: 'Error!',
                                description: errors.error || 'Terjadi kesalahan.',
                            });
                        },
                    },
                );
            },
            'Tolak',
            'destructive',
        );
    };

    const handleIzinkanLanjut = (registrationId: number) => {
        showAlert(
            'Izinkan Melanjutkan Tes',
            'Yakin ingin mengizinkan peserta ini melanjutkan tes dengan sisa waktu yang tersisa?',
            () => {
                router.post(
                    route('jadwal.peserta.izinkan-lanjut', [jadwal.id, registrationId]),
                    {},
                    {
                        onSuccess: () => {
                            toast({
                                title: 'Berhasil!',
                                description: 'Peserta diizinkan melanjutkan tes.',
                            });
                        },
                        onError: (errors) => {
                            toast({
                                variant: 'destructive',
                                title: 'Error!',
                                description: errors.error || 'Terjadi kesalahan.',
                            });
                        },
                    },
                );
            },
            'Izinkan',
            'default',
        );
    };

    const handleDelete = (registrationId: number) => {
        showAlert(
            'Konfirmasi Hapus',
            'Yakin ingin menghapus peserta ini dari jadwal?',
            () => {
                router.delete(route('jadwal.peserta.destroy', [jadwal.id, registrationId]), {
                    onSuccess: () => {
                        toast({
                            title: 'Berhasil!',
                            description: 'Peserta berhasil dihapus dari jadwal.',
                        });
                    },
                    onError: (errors) => {
                        toast({
                            variant: 'destructive',
                            title: 'Error!',
                            description: errors.error || 'Terjadi kesalahan.',
                        });
                    },
                });
            },
            'Hapus',
            'destructive',
        );
    };

    const columns: ColumnDef<PesertaTerdaftarData>[] = [
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
            id: 'peserta_nama',
            header: 'Nama Peserta',
            enableSorting: true,
            accessorFn: (row) => row.peserta.nama,
            cell: ({ row }) => {
                const peserta = row.original.peserta;
                return (
                    <div>
                        <div className="font-medium">{peserta.nama}</div>
                        <div className="text-sm text-muted-foreground">{peserta.npm}</div>
                    </div>
                );
            },
        },
        {
            id: 'peserta_email',
            header: 'Email',
            enableSorting: true,
            accessorFn: (row) => row.peserta.email,
        },
        {
            id: 'peserta_prodi',
            header: 'Program Studi',
            enableSorting: true,
            accessorFn: (row) => row.peserta.prodi,
            cell: ({ row }) => {
                const peserta = row.original.peserta;
                return (
                    <div>
                        <div>{peserta.prodi}</div>
                        <div className="text-sm text-muted-foreground">{peserta.fakultas}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            enableSorting: true,
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                const statusMap: Record<string, { text: string; color: string }> = {
                    menunggu: { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
                    disetujui: { text: 'Disetujui', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
                    ditolak: { text: 'Ditolak', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
                };
                const statusConfig = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };

                return <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}>{statusConfig.text}</span>;
            },
        },
        {
            accessorKey: 'cara_daftar',
            header: 'Cara Daftar',
            enableSorting: true,
            cell: ({ row }) => {
                const cara = row.getValue('cara_daftar') as string;
                return cara === 'mandiri' ? 'Mandiri' : 'Didaftarkan Teacher';
            },
        },
        {
            accessorKey: 'tanggal_daftar',
            header: 'Tanggal Daftar',
            enableSorting: true,
            cell: ({ row }) => {
                const tanggal = row.getValue('tanggal_daftar') as string;
                return formatDateTime(tanggal);
            },
        },
        {
            id: 'status_tes',
            header: 'Status Tes',
            enableSorting: true,
            accessorFn: (row) => row.hasil_test?.status_tes || 'tidak_dimulai',
            cell: ({ row }) => {
                const hasilTest = row.original.hasil_test;
                if (!hasilTest) {
                    return <span className="text-xs text-muted-foreground">Belum Mulai</span>;
                }

                const statusMap: Record<string, { text: string; color: string }> = {
                    tidak_dimulai: { text: 'Belum Mulai', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
                    sedang_mengerjakan: { text: 'Sedang Mengerjakan', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
                    terputus: { text: 'Terputus', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
                    selesai: { text: 'Selesai', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
                };

                const statusConfig = statusMap[hasilTest.status_tes] || statusMap.tidak_dimulai;

                return (
                    <div className="space-y-1">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.text}
                        </span>
                        {hasilTest.status_tes === 'terputus' && hasilTest.alasan_terputus && (
                            <div className="text-xs text-muted-foreground">
                                {hasilTest.alasan_terputus}
                            </div>
                        )}
                        {hasilTest.status_tes === 'selesai' && hasilTest.total_nilai !== undefined && (
                            <div className="text-xs text-muted-foreground">
                                Nilai: {hasilTest.total_nilai}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'violations',
            header: 'Pelanggaran',
            enableSorting: false,
            cell: ({ row }) => {
                const registration = row.original;

                // Only show violation alert if the student has started the test
                if (!registration.hasil_test || registration.hasil_test.status_tes === 'tidak_dimulai') {
                    return <span className="text-xs text-muted-foreground">-</span>;
                }

                return (
                    <ViolationAlert
                        jadwalId={registration.id_jadwal}
                        pesertaId={registration.id_peserta}
                        compact={true}
                    />
                );
            },
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const registration = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {registration.status === 'menunggu' && (
                                <>
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleApprove(registration.id)}>
                                        <Check className="mr-2 h-4 w-4" />
                                        Setujui
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-orange-600" onClick={() => handleReject(registration.id)}>
                                        <X className="mr-2 h-4 w-4" />
                                        Tolak
                                    </DropdownMenuItem>
                                </>
                            )}
                            {registration.hasil_test?.status_tes === 'terputus' && !registration.hasil_test.boleh_dilanjutkan && (
                                <DropdownMenuItem className="cursor-pointer text-blue-600" onClick={() => handleIzinkanLanjut(registration.id)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Izinkan Melanjutkan
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                className="cursor-pointer text-destructive hover:text-destructive/90 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => handleDelete(registration.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4 text-destructive hover:text-destructive/90 dark:text-red-400 dark:hover:text-red-300" />
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Peserta - ${jadwal.nama_jadwal}`} />
            <JadwalLayout>
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl">
                    <div className="flex w-full flex-col flex-wrap justify-between gap-2 sm:flex-row sm:space-x-2">
                        <div>
                            <h2 className="text-2xl font-bold">Peserta Terdaftar</h2>
                            <p className="text-muted-foreground">{jadwal.nama_jadwal}</p>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Daftarkan Peserta
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="flex max-h-[90vh] w-[90vw] flex-col sm:w-[80vw] md:w-[70vw] lg:max-w-6xl">
                                    <DialogHeader className="flex-shrink-0">
                                        <DialogTitle>Daftarkan Peserta ke Jadwal</DialogTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Pilih peserta yang ingin didaftarkan ke jadwal "{jadwal.nama_jadwal}".
                                        </p>
                                    </DialogHeader>

                                    <div className="flex-1 overflow-hidden">
                                        {allPeserta.length === 0 ? (
                                            <div className="py-8 text-center text-muted-foreground">Semua peserta sudah terdaftar di jadwal ini.</div>
                                        ) : (
                                            <div className="flex h-full flex-col space-y-4">
                                                <div className="flex-1 overflow-hidden">
                                                    <DataTable
                                                        columns={[
                                                            {
                                                                id: 'select',
                                                                header: ({ table }) => (
                                                                    <Checkbox
                                                                        checked={
                                                                            table.getIsAllPageRowsSelected() ||
                                                                            (table.getIsSomePageRowsSelected() && 'indeterminate')
                                                                        }
                                                                        onCheckedChange={(value) => {
                                                                            table.toggleAllPageRowsSelected(!!value);
                                                                            if (value) {
                                                                                setSelectedPeserta(allPeserta.map((p) => p.id));
                                                                            } else {
                                                                                setSelectedPeserta([]);
                                                                            }
                                                                        }}
                                                                        aria-label="Select all"
                                                                    />
                                                                ),
                                                                cell: ({ row }) => (
                                                                    <Checkbox
                                                                        checked={selectedPeserta.includes(row.original.id)}
                                                                        onCheckedChange={(value) => {
                                                                            if (value) {
                                                                                setSelectedPeserta([...selectedPeserta, row.original.id]);
                                                                            } else {
                                                                                setSelectedPeserta(
                                                                                    selectedPeserta.filter((id) => id !== row.original.id),
                                                                                );
                                                                            }
                                                                            row.toggleSelected(!!value);
                                                                        }}
                                                                        aria-label="Select row"
                                                                    />
                                                                ),
                                                                enableSorting: false,
                                                                enableHiding: false,
                                                            },
                                                            {
                                                                accessorKey: 'nama',
                                                                header: 'Nama Peserta',
                                                                enableSorting: true,
                                                                cell: ({ row }) => (
                                                                    <div>
                                                                        <div className="font-medium">{row.original.nama}</div>
                                                                        <div className="text-sm text-muted-foreground">{row.original.npm}</div>
                                                                    </div>
                                                                ),
                                                            },
                                                            {
                                                                accessorKey: 'email',
                                                                header: 'Email',
                                                                enableSorting: true,
                                                            },
                                                            {
                                                                accessorKey: 'prodi',
                                                                header: 'Program Studi',
                                                                enableSorting: true,
                                                                cell: ({ row }) => (
                                                                    <div>
                                                                        <div>{row.original.prodi}</div>
                                                                        <div className="text-sm text-muted-foreground">{row.original.fakultas}</div>
                                                                    </div>
                                                                ),
                                                            },
                                                        ]}
                                                        data={allPeserta}
                                                        searchColumn="nama"
                                                        searchPlaceholder="Cari peserta..."
                                                        customBulkActions={[
                                                            {
                                                                label: 'Daftarkan Terpilih',
                                                                action: (selectedData: PesertaData[]) => {
                                                                    const ids = selectedData.map((p) => p.id);
                                                                    setSelectedPeserta(ids);
                                                                    handleDaftarkanPeserta();
                                                                },
                                                                variant: 'default',
                                                                icon: <UserPlus className="h-4 w-4" />,
                                                                disabled: false,
                                                            },
                                                        ]}
                                                        emptyMessage={
                                                            <div className="w-full py-8 text-center text-gray-500">
                                                                Tidak ada peserta yang dapat didaftarkan.
                                                            </div>
                                                        }
                                                        enableResponsiveHiding={false}
                                                    />
                                                </div>

                                                <div className="flex flex-shrink-0 items-center justify-between border-t bg-background pt-4">
                                                    <div className="text-sm text-muted-foreground">{selectedPeserta.length} peserta dipilih</div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedPeserta([]);
                                                                setIsModalOpen(false);
                                                            }}
                                                            disabled={isSubmitting}
                                                        >
                                                            Batal
                                                        </Button>
                                                        <Button
                                                            onClick={handleDaftarkanPeserta}
                                                            disabled={selectedPeserta.length === 0 || isSubmitting}
                                                        >
                                                            {isSubmitting ? 'Mendaftarkan...' : `Daftarkan ${selectedPeserta.length} Peserta`}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button variant="outline" onClick={handleRefresh}>
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={pesertaList}
                        searchColumn="peserta_nama"
                        searchPlaceholder="Cari peserta..."
                        customBulkActions={[
                            {
                                label: 'Setujui Terpilih',
                                action: handleBulkApprove,
                                variant: 'default',
                                icon: <Check className="h-4 w-4" />,
                                disabled: false,
                            },
                            {
                                label: 'Tolak Terpilih',
                                action: handleBulkReject,
                                variant: 'destructive',
                                icon: <X className="h-4 w-4" />,
                                disabled: false,
                            },
                        ]}
                        onBulkDelete={(selectedData) => {
                            const ids = selectedData.map((item) => item.id);
                            showAlert(
                                'Konfirmasi Hapus',
                                `Yakin ingin menghapus ${ids.length} peserta terpilih dari jadwal ini?`,
                                () => {
                                    router.post(
                                        route('jadwal.peserta.bulk-delete', jadwal.id),
                                        { ids },
                                        {
                                            onSuccess: () => {
                                                toast({
                                                    title: 'Berhasil!',
                                                    description: `${ids.length} peserta berhasil dihapus.`,
                                                });
                                            },
                                            onError: (errors) => {
                                                toast({
                                                    variant: 'destructive',
                                                    title: 'Error!',
                                                    description: errors.error || 'Terjadi kesalahan.',
                                                });
                                            },
                                        },
                                    );
                                },
                                'Hapus',
                                'destructive',
                            );
                        }}
                        emptyMessage={<div className="w-full py-8 text-center text-gray-500">Belum ada peserta yang terdaftar di jadwal ini.</div>}
                        enableResponsiveHiding={false}
                    />
                </div>
            </JadwalLayout>

            {/* Alert Dialog */}
            <AlertDialog open={alertDialog.isOpen} onOpenChange={(open) => setAlertDialog((prev) => ({ ...prev, isOpen: open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>{alertDialog.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                alertDialog.onConfirm();
                                setAlertDialog((prev) => ({ ...prev, isOpen: false }));
                            }}
                            className={
                                alertDialog.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''
                            }
                        >
                            {alertDialog.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
