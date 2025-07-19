import { Button } from '@/components/ui/button';
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
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jadwal Tes',
        href: '/jadwal',
    },
];

// Type untuk data jadwal
type JadwalData = {
    id: number;
    namaJadwal: string;
    tanggalMulai: string;
    tanggalBerakhir: string;
    status: string;
    jadwalSebelumnya: string;
};

// Data statis untuk tabel
const jadwalData: JadwalData[] = [
    {
        id: 1,
        namaJadwal: 'Ujian Matematika Semester 1',
        tanggalMulai: '2025-01-15 09:00',
        tanggalBerakhir: '2025-01-15 11:00',
        status: 'Aktif',
        jadwalSebelumnya: '-',
    },
    {
        id: 2,
        namaJadwal: 'Ujian Bahasa Indonesia',
        tanggalMulai: '2025-01-20 13:00',
        tanggalBerakhir: '2025-01-20 15:00',
        status: 'Tutup',
        jadwalSebelumnya: 'Ujian Matematika Semester 1',
    },
    {
        id: 3,
        namaJadwal: 'Ujian Bahasa Inggris',
        tanggalMulai: '2025-01-22 08:00',
        tanggalBerakhir: '2025-01-22 10:00',
        status: 'Tutup',
        jadwalSebelumnya: 'Ujian Bahasa Indonesia',
    },
    {
        id: 4,
        namaJadwal: 'Ujian Fisika',
        tanggalMulai: '2025-01-23 10:00',
        tanggalBerakhir: '2025-01-23 12:00',
        status: 'Tutup',
        jadwalSebelumnya: 'Ujian Bahasa Inggris',
    },
    {
        id: 5,
        namaJadwal: 'Ujian Kimia',
        tanggalMulai: '2025-01-24 13:00',
        tanggalBerakhir: '2025-01-24 15:00',
        status: 'Aktif',
        jadwalSebelumnya: 'Ujian Fisika',
    },
    {
        id: 6,
        namaJadwal: 'Ujian Biologi',
        tanggalMulai: '2025-01-25 08:00',
        tanggalBerakhir: '2025-01-25 10:00',
        status: 'Tutup',
        jadwalSebelumnya: 'Ujian Kimia',
    },
    {
        id: 7,
        namaJadwal: 'Ujian Sejarah',
        tanggalMulai: '2025-01-26 13:00',
        tanggalBerakhir: '2025-01-26 15:00',
        status: 'Tutup',
        jadwalSebelumnya: 'Ujian Biologi',
    },
    {
        id: 8,
        namaJadwal: 'Ujian Geografi',
        tanggalMulai: '2025-01-27 09:00',
        tanggalBerakhir: '2025-01-27 11:00',
        status: 'Aktif',
        jadwalSebelumnya: 'Ujian Sejarah',
    },
    {
        id: 9,
        namaJadwal: 'Ujian Ekonomi',
        tanggalMulai: '2025-01-28 10:00',
        tanggalBerakhir: '2025-01-28 12:00',
        status: 'Tutup',
        jadwalSebelumnya: 'Ujian Geografi',
    },
    {
        id: 10,
        namaJadwal: 'Ujian Sosiologi',
        tanggalMulai: '2025-01-29 13:00',
        tanggalBerakhir: '2025-01-29 15:00',
        status: 'Tutup',
        jadwalSebelumnya: 'Ujian Ekonomi',
    },
];

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
                        Apakah Anda yakin ingin menghapus jadwal "{jadwal.namaJadwal}"?
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

export default function Jadwal() {
    const { toast } = useToast();

    const handleAddJadwal = () => {
        console.log("Tambah jadwal clicked");
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
                description: `Jadwal "${jadwal.namaJadwal}" berhasil dihapus.`,
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
            accessorKey: "namaJadwal",
            header: "Nama Jadwal",
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "tanggalMulai",
            header: "Tanggal Mulai",
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "tanggalBerakhir",
            header: "Tanggal Berakhir",
            enableSorting: true,
            enableHiding: true,
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
                        status === 'Aktif'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: "jadwalSebelumnya",
            header: "Jadwal Sebelumnya",
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const jadwalSebelumnya = row.getValue("jadwalSebelumnya") as string;
                return <div className="text-muted-foreground">{jadwalSebelumnya}</div>;
            },
        },
        {
            id: "actions",
            header: "Aksi",
            enableHiding: true,
            cell: ({ row }) => {
                const jadwal = row.original;
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
                            <DropdownMenuItem className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DeleteJadwalButton
                                jadwal={jadwal}
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
                <h2 className="text-2xl font-bold">Jadwal Tes</h2>
                <DataTable
                    columns={columns}
                    data={jadwalData}
                    onAddNew={handleAddJadwal}
                    addButtonLabel="Tambah Jadwal"
                    onBulkDelete={handleBulkDelete}
                />
            </div>
        </AppLayout>
    );
}
