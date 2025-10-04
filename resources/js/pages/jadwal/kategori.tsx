import KategoriFormModal from '@/components/modal/KategoriFormModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import JadwalLayout from '@/layouts/jadwal/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil, PlusIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jadwal Tes',
        href: '/jadwal',
    },
    {
        title: 'Kategori',
        href: '/jadwal/kategori',
    },
];

type KategoriData = {
    id: number;
    nama: string;
    jumlah_jadwal: number;
    created_at: string;
    updated_at: string;
};

type KategoriProps = {
    kategori: KategoriData[];
};

export default function KategoriTes({ kategori }: KategoriProps) {
    const { toast } = useToast();
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedKategori, setSelectedKategori] = useState<KategoriData | null>(null);

    const handleDeleteSingle = (kategori: KategoriData) => {
        setSelectedKategori(kategori);
        setDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (!selectedKategori) return;

        router.delete(route('kategori.destroy', selectedKategori.id), {
            onSuccess: () => {
                toast({
                    variant: 'success',
                    title: 'Berhasil',
                    description: `Kategori "${selectedKategori.nama}" berhasil dihapus`,
                });
                setDeleteDialog(false);
                setSelectedKategori(null);
            },
            onError: (errors) => {
                console.error('Delete error:', errors);
                toast({
                    variant: 'destructive',
                    title: 'Gagal',
                    description: errors.error || 'Terjadi kesalahan saat menghapus kategori',
                });
                setDeleteDialog(false);
                setSelectedKategori(null);
            },
        });
    };

    const handleBulkDelete = (selectedData: KategoriData[]) => {
        const selectedIds = selectedData.map((item) => item.id);
        router.post(
            route('kategori.bulk-destroy'),
            { ids: selectedIds },
            {
                onSuccess: () => {
                    toast({
                        variant: 'success',
                        title: 'Berhasil',
                        description: `${selectedIds.length} kategori berhasil dihapus`,
                    });
                },
                onError: () => {
                    toast({
                        title: 'Gagal',
                        description: 'Gagal menghapus kategori',
                        variant: 'destructive',
                    });
                },
            },
        );
    };

    const columns: ColumnDef<KategoriData>[] = [
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
            id: 'no',
            header: 'No',
            cell: ({ row }) => {
                return row.index + 1;
            },
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: 'nama',
            header: 'Nama Kategori',
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'jumlah_jadwal',
            header: 'Jumlah Jadwal',
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const jumlahJadwal = row.getValue('jumlah_jadwal') as number;
                return <span className="text-center">{jumlahJadwal || 0}</span>;
            },
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const kategori = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <KategoriFormModal
                                        mode="edit"
                                        trigger={
                                            <Button variant="ghost" size="icon" className="cursor-pointer">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        }
                                        kategori={kategori}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Edit kategori</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => handleDeleteSingle(kategori)}>
                                        <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/90 dark:text-red-400 dark:hover:text-red-300" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Hapus kategori</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Tes" />
            <JadwalLayout>
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Kategori Tes</h2>
                        <KategoriFormModal
                            mode="create"
                            trigger={
                                <Button className="cursor-pointer">
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Tambah Kategori
                                </Button>
                            }
                        />
                    </div>
                    <DataTable
                        columns={columns}
                        data={kategori}
                        searchColumn="nama"
                        searchPlaceholder="Cari kategori..."
                        onBulkDelete={handleBulkDelete}
                        emptyMessage={<div className="w-full py-8 text-center text-gray-500">Tidak ada kategori tes yang tersedia saat ini.</div>}
                        enableResponsiveHiding={false}
                    />
                </div>

                <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Kategori</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus kategori "{selectedKategori?.nama}"?
                                {selectedKategori?.jumlah_jadwal ? (
                                    <p className="mt-2 text-destructive">Kategori ini memiliki {selectedKategori.jumlah_jadwal} jadwal terkait.</p>
                                ) : null}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="cursor-pointer">
                                Batal
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete} className="cursor-pointer">
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </JadwalLayout>
        </AppLayout>
    );
}
