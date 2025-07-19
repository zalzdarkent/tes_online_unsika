import { Button } from '@/components/ui/button';
import { Head, useForm, router } from "@inertiajs/react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import InputError from '@/components/input-error';

// Helper function untuk format tanggal tanpa timezone conversion
const formatDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return '';

    console.log("Original dateTimeString:", dateTimeString);

    // Handle format dari database: "2025-09-07T15:00:00.000000Z"
    let dateStr = dateTimeString;

    // Remove timezone 'Z' dan microseconds
    if (dateStr.includes('Z')) {
        dateStr = dateStr.replace('Z', '');
    }

    // Remove microseconds (.000000)
    if (dateStr.includes('.')) {
        dateStr = dateStr.split('.')[0];
    }

    // Replace 'T' dengan spasi
    if (dateStr.includes('T')) {
        dateStr = dateStr.replace('T', ' ');
    }

    // Ambil bagian tanggal dan waktu
    const parts = dateStr.split(' ');
    if (parts.length < 2) {
        console.log("Invalid date format:", dateTimeString);
        return dateTimeString;
    }

    const datePart = parts[0]; // 2025-09-07
    const timePart = parts[1]; // 15:00:00

    console.log("Date part:", datePart, "Time part:", timePart);

    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');

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
    id_jadwal_sebelumnya: number | null;
    created_at: string;
    updated_at: string;
};

// Type untuk props yang diterima dari controller
type JadwalProps = {
    jadwal: JadwalData[];
};

// Komponen untuk modal form tambah jadwal
function AddJadwalModal({ jadwal, onAddJadwal }: { jadwal: JadwalData[]; onAddJadwal: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const { data, setData, processing, errors, reset, clearErrors } = useForm({
        nama_jadwal: '',
        tanggal_mulai: '',
        tanggal_berakhir: '',
        status: 'Buka' as 'Buka' | 'Tutup',
        auto_close: true,
        id_jadwal_sebelumnya: null as number | null,
    });

    // State terpisah untuk input date dan time
    const [dateTimeInputs, setDateTimeInputs] = useState({
        tanggal_mulai_date: '',
        tanggal_mulai_time: '',
        tanggal_berakhir_date: '',
        tanggal_berakhir_time: '',
    });

    // Reset form saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            reset();
            clearErrors();
            setDateTimeInputs({
                tanggal_mulai_date: '',
                tanggal_mulai_time: '',
                tanggal_berakhir_date: '',
                tanggal_berakhir_time: '',
            });
        }
    }, [isOpen, reset, clearErrors]);

    console.log("AddJadwalModal rendered with jadwal:", jadwal?.length || 0, "items");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi frontend sederhana
        if (!data.nama_jadwal || !dateTimeInputs.tanggal_mulai_date || !dateTimeInputs.tanggal_mulai_time ||
            !dateTimeInputs.tanggal_berakhir_date || !dateTimeInputs.tanggal_berakhir_time) {
            toast({
                variant: "destructive",
                title: "Error!",
                description: "Semua field wajib diisi.",
            });
            return;
        }

        // Gabungkan tanggal dan waktu
        const tanggal_mulai = `${dateTimeInputs.tanggal_mulai_date}T${dateTimeInputs.tanggal_mulai_time}:00`;
        const tanggal_berakhir = `${dateTimeInputs.tanggal_berakhir_date}T${dateTimeInputs.tanggal_berakhir_time}:00`;

        // Validasi tanggal
        const startDate = new Date(tanggal_mulai);
        const endDate = new Date(tanggal_berakhir);
        const now = new Date();

        if (startDate <= now) {
            toast({
                variant: "destructive",
                title: "Error!",
                description: "Tanggal mulai harus setelah waktu sekarang.",
            });
            return;
        }

        if (endDate <= startDate) {
            toast({
                variant: "destructive",
                title: "Error!",
                description: "Tanggal berakhir harus setelah tanggal mulai.",
            });
            return;
        }

        // Buat payload data yang akan dikirim langsung
        const submitData = {
            nama_jadwal: data.nama_jadwal,
            tanggal_mulai,
            tanggal_berakhir,
            status: data.status,
            auto_close: data.auto_close,
            id_jadwal_sebelumnya: data.id_jadwal_sebelumnya,
        };

        console.log("Sending data:", submitData);

        // Gunakan router.post langsung dengan data yang benar
        router.post(route('jadwal.store'), submitData, {
            onSuccess: () => {
                toast({
                    variant: "default",
                    title: "Berhasil!",
                    description: "Jadwal berhasil ditambahkan.",
                });
                setIsOpen(false);
                onAddJadwal();
            },
            onError: (errors: Record<string, string>) => {
                console.log("Validation errors:", errors);
                // Handle validation errors
                if (errors.conflict) {
                    toast({
                        variant: "destructive",
                        title: "Konflik Jadwal!",
                        description: errors.conflict,
                    });
                } else if (errors.error) {
                    toast({
                        variant: "destructive",
                        title: "Error!",
                        description: errors.error,
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Error!",
                        description: "Terjadi kesalahan saat menyimpan jadwal.",
                    });
                }
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setIsOpen(true)} className='cursor-pointer'>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Jadwal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Tambah Jadwal Baru</DialogTitle>
                    <DialogDescription>
                        Isi form di bawah untuk menambahkan jadwal tes baru.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label htmlFor="nama_jadwal">Nama Jadwal</Label>
                            <Input
                                id="nama_jadwal"
                                type="text"
                                placeholder="Masukkan nama jadwal"
                                value={data.nama_jadwal}
                                onChange={(e) => setData('nama_jadwal', e.target.value)}
                                required
                                disabled={processing}
                            />
                            {errors.nama_jadwal && (
                                <InputError message={errors.nama_jadwal} />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tanggal_mulai">Tanggal & Waktu Mulai</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Input
                                            id="tanggal_mulai_date"
                                            type="date"
                                            value={dateTimeInputs.tanggal_mulai_date}
                                            onChange={(e) => setDateTimeInputs(prev => ({
                                                ...prev,
                                                tanggal_mulai_date: e.target.value
                                            }))}
                                            required
                                            disabled={processing}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            id="tanggal_mulai_time"
                                            type="time"
                                            value={dateTimeInputs.tanggal_mulai_time}
                                            onChange={(e) => setDateTimeInputs(prev => ({
                                                ...prev,
                                                tanggal_mulai_time: e.target.value
                                            }))}
                                            required
                                            disabled={processing}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                {errors.tanggal_mulai && (
                                    <InputError message={errors.tanggal_mulai} />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tanggal_berakhir">Tanggal & Waktu Berakhir</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Input
                                            id="tanggal_berakhir_date"
                                            type="date"
                                            value={dateTimeInputs.tanggal_berakhir_date}
                                            onChange={(e) => setDateTimeInputs(prev => ({
                                                ...prev,
                                                tanggal_berakhir_date: e.target.value
                                            }))}
                                            required
                                            disabled={processing}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            id="tanggal_berakhir_time"
                                            type="time"
                                            value={dateTimeInputs.tanggal_berakhir_time}
                                            onChange={(e) => setDateTimeInputs(prev => ({
                                                ...prev,
                                                tanggal_berakhir_time: e.target.value
                                            }))}
                                            required
                                            disabled={processing}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                {errors.tanggal_berakhir && (
                                    <InputError message={errors.tanggal_berakhir} />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value: 'Buka' | 'Tutup') => setData('status', value)}
                                    disabled={processing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Buka">Buka</SelectItem>
                                        <SelectItem value="Tutup">Tutup</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <InputError message={errors.status} />
                                )}
                            </div>
                            <div>
                                <Label htmlFor="id_jadwal_sebelumnya">Jadwal Sebelumnya</Label>
                                <Select
                                    value={data.id_jadwal_sebelumnya?.toString() || "0"}
                                    onValueChange={(value) => setData('id_jadwal_sebelumnya', value === "0" ? null : parseInt(value))}
                                    disabled={processing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jadwal sebelumnya" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Tidak ada</SelectItem>
                                        {jadwal && jadwal.length > 0 ? jadwal.map((j) => (
                                            <SelectItem key={j.id} value={j.id.toString()}>
                                                {j.nama_jadwal}
                                            </SelectItem>
                                        )) : null}
                                    </SelectContent>
                                </Select>
                                {errors.id_jadwal_sebelumnya && (
                                    <InputError message={errors.id_jadwal_sebelumnya} />
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            className='cursor-pointer'
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className='cursor-pointer'
                            disabled={processing}
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Jadwal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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
                            <DropdownMenuItem className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
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
                    <AddJadwalModal jadwal={jadwal || []} onAddJadwal={handleAddJadwal} />
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
