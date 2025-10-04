import UserDetailModal from '@/components/modal/UserDetailModal';
import UserFormModal from '@/components/modal/UserFormModal';
import UserImportModal from '@/components/modal/UserImportModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, FileSpreadsheet, Pencil, PlusIcon, Trash2, User } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola User',
        href: '/users',
    },
];

type UserData = {
    id: number;
    username: string;
    nama: string;
    email: string;
    role: 'admin' | 'teacher' | 'peserta';
    alamat?: string | null;
    no_hp?: string | null;
    foto?: string | null;
    created_at: string;
    updated_at?: string;
    prodi?: string | null;
    fakultas?: string | null;
    universitas?: string | null;
    npm?: string | null;
};

type UserProps = {
    users: UserData[];
};

const roleLabels = {
    admin: 'Administrator',
    teacher: 'Guru',
    peserta: 'Peserta',
};

const roleColors = {
    admin: 'bg-red-100 text-red-800',
    teacher: 'bg-blue-100 text-blue-800',
    peserta: 'bg-green-100 text-green-800',
};

export default function UsersIndex({ users }: UserProps) {
    const { toast } = useToast();
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    // Debug: Log data yang diterima
    console.log('Users data received:', users);
    console.log('Users count:', users?.length || 0);

    const handleDeleteSingle = (user: UserData) => {
        setSelectedUser(user);
        setDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (!selectedUser) return;

        router.delete(route('users.destroy', selectedUser.id), {
            onSuccess: () => {
                toast({
                    title: 'Berhasil',
                    description: `User "${selectedUser.nama}" berhasil dihapus`,
                });
                setDeleteDialog(false);
                setSelectedUser(null);
            },
            onError: (errors) => {
                console.error('Delete error:', errors);
                toast({
                    variant: 'destructive',
                    title: 'Gagal',
                    description: errors.error || 'Terjadi kesalahan saat menghapus user',
                });
                setDeleteDialog(false);
                setSelectedUser(null);
            },
        });
    };

    const handleBulkDelete = (selectedData: UserData[]) => {
        // Batasi maksimal 100 item untuk menghindari memory issues
        if (selectedData.length > 100) {
            toast({
                variant: 'destructive',
                title: 'Peringatan!',
                description: 'Maksimal 100 user dapat dihapus sekaligus.',
            });
            return;
        }

        const selectedIds = selectedData.map((item) => item.id);
        router.post(
            route('users.bulk-destroy'),
            { ids: selectedIds },
            {
                onSuccess: () => {
                    toast({
                        title: 'Berhasil',
                        description: `${selectedIds.length} user berhasil dihapus`,
                    });
                },
                onError: (errors: Record<string, string>) => {
                    console.error('Bulk delete errors:', errors);
                    const errorMessage = errors.error || errors.message || 'Gagal menghapus user';
                    toast({
                        title: 'Gagal',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                },
            },
        );
    };

    const columns: ColumnDef<UserData>[] = [
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
            accessorKey: 'username',
            header: 'Username',
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.username}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'nama',
            header: 'Nama Lengkap',
        },
        {
            accessorKey: 'email',
            header: 'Email',
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => {
                const role = row.getValue('role') as keyof typeof roleLabels;
                return (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[role]}`}>
                        {roleLabels[role]}
                    </span>
                );
            },
        },
        {
            accessorKey: 'no_hp',
            header: 'No. HP',
            cell: ({ row }) => {
                const noHp = row.getValue('no_hp') as string;
                return noHp || '-';
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Dibuat',
            cell: ({ row }) => {
                const date = new Date(row.getValue('created_at'));
                return date.toLocaleDateString('id-ID');
            },
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <TooltipProvider>
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <UserDetailModal user={user}>
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </UserDetailModal>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Lihat detail</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <UserFormModal user={user} mode="edit">
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </UserFormModal>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Edit user</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteSingle(user)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/90 dark:text-red-400 dark:hover:text-red-300" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Hapus user</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola User" />

            <div className="container mx-auto space-y-6 px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Kelola User</h1>
                        <p className="text-muted-foreground">Kelola data pengguna sistem</p>
                    </div>
                    <div className="flex gap-2">
                        <UserImportModal
                            trigger={
                                <Button variant="outline">
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Import Excel
                                </Button>
                            }
                            open={showImportModal}
                            onOpenChange={setShowImportModal}
                            onSuccess={() => {
                                // Refresh page after successful import
                                router.reload();
                            }}
                        />
                        <UserFormModal mode="create">
                            <Button>
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Tambah User
                            </Button>
                        </UserFormModal>
                    </div>
                </div>

                <div className="rounded-lg border bg-background p-6">
                    <DataTable
                        columns={columns}
                        data={users}
                        onBulkDelete={handleBulkDelete}
                        searchColumn="nama"
                        searchPlaceholder="Cari nama user..."
                        enableResponsiveHiding={false}
                    />
                </div>
            </div>

            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Hapus User</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
