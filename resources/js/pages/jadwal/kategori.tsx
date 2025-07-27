import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import KategoriFormModal from "@/components/modal/KategoriFormModal";
import { type BreadcrumbItem } from "@/types";
import JadwalLayout from "@/layouts/jadwal/layout";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusIcon, Pencil, Trash2 } from "lucide-react";

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

    const handleDeleteSingle = (kategori: KategoriData) => {
        router.delete(route('kategori.destroy', kategori.id), {
            onSuccess: () => {
                toast({
                    title: "Berhasil",
                    description: "Kategori berhasil dihapus",
                });
            },
            onError: () => {
                toast({
                    title: "Gagal",
                    description: "Gagal menghapus kategori",
                    variant: "destructive",
                });
            },
        });
    };

    const handleBulkDelete = (selectedData: KategoriData[]) => {
        const selectedIds = selectedData.map(item => item.id);
        router.post(route('kategori.bulk-destroy'),
            { ids: selectedIds },
            {
                onSuccess: () => {
                    toast({
                        title: "Berhasil",
                        description: `${selectedIds.length} kategori berhasil dihapus`,
                    });
                },
                onError: () => {
                    toast({
                        title: "Gagal",
                        description: "Gagal menghapus kategori",
                        variant: "destructive",
                    });
                },
            }
        );
    };

    const columns: ColumnDef<KategoriData>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
            id: "no",
            header: "No",
            cell: ({ row }) => {
                return row.index + 1;
            },
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: "nama",
            header: "Nama Kategori",
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "jumlah_jadwal",
            header: "Jumlah Jadwal",
            enableSorting: true,
            enableHiding: true,
            cell: ({ row }) => {
                const jumlahJadwal = row.getValue("jumlah_jadwal") as number;
                return (
                    <span className="text-center">{jumlahJadwal || 0}</span>
                );
            },
        },
        {
            id: "actions",
            header: "Aksi",
            cell: ({ row }) => {
                const kategori = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="cursor-pointer"
                                        onClick={() => router.get(route('kategori.edit', kategori.id))}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Edit kategori</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="cursor-pointer"
                                        onClick={() => handleDeleteSingle(kategori)}
                                    >
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
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl overflow-x-auto">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Kategori Tes</h2>
                        <KategoriFormModal
                            mode="create"
                            trigger={
                                <Button className="cursor-pointer">
                                    <PlusIcon className="h-4 w-4 mr-2" />
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
                        emptyMessage={
                            <div className="text-center w-full py-8 text-gray-500">
                                Tidak ada kategori tes yang tersedia saat ini.
                            </div>
                        }
                    />
                </div>
            </JadwalLayout>
        </AppLayout>
    );
}
