import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { FilterConfig } from '@/components/ui/data-table-filter';
import ConfirmDialogWrapper from '@/components/modal/ConfirmDialogWrapper';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format-date';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ClipboardCheck, Eye, Trash2, CheckSquare } from 'lucide-react';
import { useState, useMemo } from 'react';

interface DataKoreksi {
    id_user: number;
    id_jadwal: number;
    nama_peserta: string;
    nama_jadwal: string;
    total_soal: number;
    total_skor: number | null;
    waktu_ujian: string;
    status_koreksi?: string | null;
}

interface JadwalItem {
    id: number;
    nama_jadwal: string;
}

interface Props {
    data: DataKoreksi[];
    jadwalList: JadwalItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Koreksi Peserta',
        href: '/koreksi',
    },
];

export default function Koreksi({ data, jadwalList }: Props) {
    const [activeFilters, setActiveFilters] = useState<Record<string, (string | number | boolean)[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Define filter configurations
    const filterConfigs: FilterConfig[] = useMemo(() => [
        {
            id: 'jadwal',
            label: 'Jadwal Tes',
            type: 'checkbox',
            options: jadwalList.map(jadwal => ({
                id: jadwal.id.toString(),
                label: jadwal.nama_jadwal,
                value: jadwal.id
            }))
        },
        {
            id: 'status_koreksi',
            label: 'Status Koreksi',
            type: 'checkbox',
            options: [
                { id: 'belum_dikoreksi', label: 'Belum Dikoreksi', value: 'belum_dikoreksi' },
                { id: 'draft', label: 'Draft', value: 'draft' },
                { id: 'final', label: 'Final', value: 'submitted' }
            ]
        }
    ], [jadwalList]);

    // Filter data based on active filters
    const filteredData = useMemo(() => {
        if (Object.keys(activeFilters).length === 0) {
            return data;
        }

        return data.filter(item => {
            // Check jadwal filter
            if (activeFilters.jadwal && activeFilters.jadwal.length > 0) {
                if (!activeFilters.jadwal.includes(item.id_jadwal)) {
                    return false;
                }
            }

            // Check status koreksi filter
            if (activeFilters.status_koreksi && activeFilters.status_koreksi.length > 0) {
                const isKoreksi = item.total_skor !== null;
                let statusValue: string;

                if (!isKoreksi) {
                    statusValue = 'belum_dikoreksi';
                } else if (item.status_koreksi === 'submitted') {
                    statusValue = 'submitted';
                } else {
                    statusValue = 'draft';
                }

                if (!activeFilters.status_koreksi.includes(statusValue)) {
                    return false;
                }
            }

            return true;
        });
    }, [data, activeFilters]);

    const handleFilterChange = (filterId: string, selectedValues: (string | number | boolean)[]) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterId]: selectedValues
        }));
    };

    const handleDelete = (data: DataKoreksi) => {
        router.delete(`/koreksi/${data.id_user}/${data.id_jadwal}`, {
            onSuccess: () => {
                toast({
                    title: 'Berhasil!',
                    description: 'Data koreksi berhasil dihapus.',
                });
            },
            onError: (errors) => {
                console.log('Delete errors:', errors);
                toast({
                    variant: 'destructive',
                    title: 'Gagal!',
                    description: errors.message || 'Terjadi kesalahan saat menghapus data.',
                });
            },
        });
    };
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
            accessorKey: 'status_koreksi',
            header: 'Status Koreksi',
            cell: ({ row }) => {
                const data = row.original;
                const isKoreksi = data.total_skor !== null;
                const status = data.status_koreksi;

                if (!isKoreksi) {
                    return (
                        <span className="rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            Belum Dikoreksi
                        </span>
                    );
                }

                if (status === 'submitted') {
                    return (
                        <span className="rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Final
                        </span>
                    );
                }

                return (
                    <span className="rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Draft
                    </span>
                );
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
                        <ConfirmDialogWrapper
                            title="Hapus Data Koreksi?"
                            description={`Apakah Anda yakin ingin menghapus data koreksi untuk ${data.nama_peserta}? Tindakan ini tidak dapat dibatalkan.`}
                            confirmLabel="Hapus"
                            cancelLabel="Batal"
                            onConfirm={() => handleDelete(data)}
                            trigger={
                                <Button
                                    variant="outline"
                                    className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus
                                </Button>
                            }
                        />
                    </div>
                );
            },
        },
    ];

    const handleBulkDelete = (selectedData: DataKoreksi[]) => {
        if (selectedData.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Tidak ada data yang dipilih',
                description: 'Pilih data yang ingin dihapus terlebih dahulu.',
            });
            return;
        }

        const deleteData = selectedData.map(item => ({
            id_user: item.id_user,
            id_jadwal: item.id_jadwal,
            nama_peserta: item.nama_peserta,
        }));

        router.post('/koreksi/bulk-destroy',
            { items: deleteData },
            {
                onSuccess: () => {
                    toast({
                        title: 'Berhasil!',
                        description: `${selectedData.length} data koreksi berhasil dihapus.`,
                    });
                },
                onError: (errors) => {
                    console.log('Bulk delete errors:', errors);
                    toast({
                        variant: 'destructive',
                        title: 'Gagal!',
                        description: errors.message || 'Terjadi kesalahan saat menghapus data.',
                    });
                },
            },
        );
    };

    const handleBatchSubmit = (selectedData: DataKoreksi[]) => {
        if (selectedData.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Tidak ada data yang dipilih',
                description: 'Pilih peserta yang ingin disubmit final.',
            });
            return;
        }

        setIsSubmitting(true);

        const submitData = selectedData.map(item => ({
            id_user: item.id_user,
            id_jadwal: item.id_jadwal,
            nama_peserta: item.nama_peserta,
        }));

        router.post('/koreksi/batch-submit',
            { items: submitData },
            {
                onSuccess: (page) => {
                    setIsSubmitting(false);
                    // Flash message akan ditangani oleh AppLayout atau layout lain
                    // Data akan ter-refresh otomatis karena redirect
                },
                onError: (errors) => {
                    console.log('Batch submit errors:', errors);
                    toast({
                        variant: 'destructive',
                        title: 'Gagal!',
                        description: errors.message || 'Terjadi kesalahan saat batch submit.',
                    });
                    setIsSubmitting(false);
                },
            }
        );
    };

    const customBulkActions = [
        {
            label: 'Submit Final',
            icon: <CheckSquare className="h-4 w-4" />,
            action: handleBatchSubmit,
            variant: 'default' as const,
            disabled: isSubmitting,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Koreksi Peserta" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h2 className="text-2xl font-bold">Koreksi Peserta</h2>
                <DataTable
                    columns={columns}
                    data={filteredData}
                    searchColumn="nama_peserta"
                    searchPlaceholder="Cari nama peserta..."
                    exportFilename="data-koreksi"
                    showExportButton
                    onBulkDelete={handleBulkDelete}
                    customBulkActions={customBulkActions}
                    filters={filterConfigs}
                    onFilterChange={handleFilterChange}
                    activeFilters={activeFilters}
                    emptyMessage={<div className="w-full py-8 text-center text-gray-500">Tidak ada daftar koreksi yang tersedia saat ini.</div>}
                    enableResponsiveHiding={false}
                />
            </div>
        </AppLayout>
    );
}
