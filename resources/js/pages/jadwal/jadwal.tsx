import { Button } from '@/components/ui/button';
import { Head } from "@inertiajs/react";
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import JadwalFormModal from '@/components/JadwalFormModal';

import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

// Helper function untuk format tanggal tanpa timezone conversion
const formatDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return '';

    console.log("Original dateTimeString:", dateTimeString);

    // Handle format dari database yang langsung: "2025-07-23 10:30:00"
    let dateStr = dateTimeString;

    // Remove timezone 'Z' jika ada
    if (dateStr.includes('Z')) {
        dateStr = dateStr.replace('Z', '');
    }

    // Remove microseconds (.000000) jika ada
    if (dateStr.includes('.')) {
        dateStr = dateStr.split('.')[0];
    }

    // Replace 'T' dengan spasi jika ada
    if (dateStr.includes('T')) {
        dateStr = dateStr.replace('T', ' ');
    }

    // Ambil bagian tanggal dan waktu
    const parts = dateStr.trim().split(' ');
    if (parts.length < 2) {
        console.log("Invalid date format:", dateTimeString);
        return dateTimeString;
    }

    const datePart = parts[0]; // 2025-07-23
    const timePart = parts[1]; // 10:30:00

    console.log("Date part:", datePart, "Time part:", timePart);

    const [year, month, day] = datePart.split('-');
    const timeComponents = timePart.split(':');
    const hour = timeComponents[0];
    const minute = timeComponents[1];

    console.log("Parsed:", { year, month, day, hour, minute });

    if (!year || !month || !day || !hour || !minute) {
        console.log("Missing date/time components");
        return dateTimeString;
    }

    // Format manual tanpa Date object untuk menghindari timezone issues
    const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    const formattedTime = `${hour.padStart(2, '0')}.${minute.padStart(2, '0')}`;

    const result = `${formattedDate}, ${formattedTime}`;
    console.log("Formatted result:", result);

    return result;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jadwal Tes',
        href: '/jadwal',
    },
];

// Type untuk data jadwal sesuai dengan database
type JadwalData = {
    id: number;
    nama_jadwal: string;
    tanggal_mulai: string;
    tanggal_berakhir: string;
    status: string;
    auto_close?: boolean;
    id_jadwal_sebelumnya: number | null;
    created_at: string;
    updated_at: string;
};

// Type untuk props yang diterima dari controller
type JadwalProps = {
    jadwal: JadwalData[];
};

// Komponen untuk tombol hapus individual dengan dialog konfirmasi
function DeleteJadwalButton({ jadwal, onDelete }: { jadwal: JadwalData; onDelete: (jadwal: JadwalData) => void }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDelete = () => {
        onDelete(jadwal);
        setIsDeleteDialogOpen(false);
    };

    return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
                <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onSelect={(e) => {
                        e.preventDefault();
                        setIsDeleteDialogOpen(true);
                    }}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus jadwal "{jadwal.nama_jadwal}"?
                        Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        Ya, Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function Jadwal({ jadwal }: JadwalProps) {
    const { toast } = useToast();

    console.log("Jadwal component rendered with:", jadwal?.length || 0, "items");

    // Safety check untuk props
    if (!jadwal) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Jadwal Tes" />
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                    <h2 className="text-2xl font-bold">Jadwal Tes</h2>
                    <div className="text-center py-8">Loading...</div>
                </div>
            </AppLayout>
        );
    }

    // Helper function untuk mencari nama jadwal berdasarkan ID
    const findJadwalNameById = (id: number | null): string => {
        if (!id) return '-';
        const found = jadwal.find(j => j.id === id);
        return found ? found.nama_jadwal : '-';
    };

    const handleAddJadwal = () => {
        // Callback ini akan dipanggil setelah modal ditutup
        // Untuk refresh data atau trigger reload
        console.log("Jadwal berhasil ditambahkan, refresh data jika perlu");
    };

    const handleEditJadwal = () => {
        // Callback ini akan dipanggil setelah modal edit ditutup
        // Untuk refresh data atau trigger reload
        console.log("Jadwal berhasil diupdate, refresh data jika perlu");
    };

    const handleBulkDelete = (selectedData: JadwalData[]) => {
        const selectedIds = selectedData.map(item => item.id);
        console.log("Bulk delete for IDs:", selectedIds);

        setTimeout(() => {
            toast({
                variant: "success",
                title: "Berhasil!",
                description: `${selectedData.length} jadwal berhasil dihapus.`,
            });
        }, 500);
    };

    const handleDeleteSingle = (jadwal: JadwalData) => {
        console.log("Delete single jadwal:", jadwal.id);

        setTimeout(() => {
            toast({
                variant: "success",
                title: "Berhasil!",
                description: `Jadwal "${jadwal.nama_jadwal}" berhasil dihapus.`,
            });
        }, 500);
    };

    const columns: ColumnDef<JadwalData>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "id",
            header: "No",
            enableHiding: true,
            cell: ({ row }) => {
                return <div className="font-medium">{row.index + 1}</div>;
            },
        },
        {
            accessorKey: "nama_jadwal",
            header: "Nama Jadwal",
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "tanggal_mulai",
            header: "Tanggal Mulai",
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const tanggal = row.getValue("tanggal_mulai") as string;
                return formatDateTime(tanggal);
            },
        },
        {
            accessorKey: "tanggal_berakhir",
            header: "Tanggal Berakhir",
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const tanggal = row.getValue("tanggal_berakhir") as string;
                return formatDateTime(tanggal);
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'Buka'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: "id_jadwal_sebelumnya",
            header: "Jadwal Sebelumnya",
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const idJadwalSebelumnya = row.getValue("id_jadwal_sebelumnya") as number | null;
                const namaJadwal = findJadwalNameById(idJadwalSebelumnya);
                return <div className="text-muted-foreground">{namaJadwal}</div>;
            },
        },
        {
            id: "actions",
            header: "Aksi",
            enableHiding: true,
            cell: ({ row }) => {
                const jadwalItem = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Soal
                            </DropdownMenuItem>
                            <JadwalFormModal
                                mode="edit"
                                trigger={
                                    <DropdownMenuItem
                                        className="cursor-pointer"
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </DropdownMenuItem>
                                }
                                jadwal={jadwalItem}
                                allJadwal={jadwal || []}
                                onSuccess={handleEditJadwal}
                            />
                            <DeleteJadwalButton
                                jadwal={jadwalItem}
                                onDelete={handleDeleteSingle}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jadwal Tes" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Jadwal Tes</h2>
                    <JadwalFormModal
                        mode="create"
                        trigger={
                            <Button className='cursor-pointer'>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Jadwal
                            </Button>
                        }
                        allJadwal={jadwal || []}
                        onSuccess={handleAddJadwal}
                    />
                </div>
                {jadwal && jadwal.length > 0 ? (
                    <DataTable
                        columns={columns}
                        data={jadwal}
                        searchColumn="nama_jadwal"
                        searchPlaceholder="Cari jadwal..."
                        onBulkDelete={handleBulkDelete}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Jadwal</h3>
                            <p className="text-gray-500 mb-4">Tidak ada jadwal tes yang tersedia saat ini.</p>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
