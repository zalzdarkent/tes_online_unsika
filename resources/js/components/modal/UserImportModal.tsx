import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Progress as InertiaProgress } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';

interface UserImportModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

interface ExcelUser {
    [key: string]: string | undefined;
    email: string;
    username: string;
    nama: string;
    npm?: string;
    prodi?: string;
    fakultas?: string;
    universitas?: string;
    no_hp?: string;
    alamat?: string;
    password: string;
    role: string; // Default 'peserta', bisa diedit di preview
}

const userRoles = [
    { label: 'Administrator', value: 'admin' },
    { label: 'Guru/Dosen', value: 'teacher' },
    { label: 'Peserta/Mahasiswa', value: 'peserta' },
];

export default function UserImportModal({ trigger, open = false, onOpenChange, onSuccess }: UserImportModalProps) {
    const [userData, setUserData] = useState<ExcelUser[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { toast } = useToast();

    const handleOpenChange = (value: boolean) => {
        if (onOpenChange) {
            onOpenChange(value);
        }
        if (!value) {
            setUserData([]);
            setProgress(0);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData: ExcelUser[] = XLSX.utils.sheet_to_json(firstSheet);

                // Validasi data dan konversi ke string
                const validatedData = jsonData.map((item) => ({
                    email: String(item.email || '').trim().toLowerCase(),
                    username: String(item.username || '').trim(),
                    nama: String(item.nama || '').trim(),
                    npm: item.npm ? String(item.npm).trim() : '',
                    prodi: item.prodi ? String(item.prodi).trim() : '',
                    fakultas: item.fakultas ? String(item.fakultas).trim() : '',
                    universitas: item.universitas ? String(item.universitas).trim() : '',
                    no_hp: item.no_hp ? String(item.no_hp).trim() : '',
                    alamat: item.alamat ? String(item.alamat).trim() : '',
                    password: String(item.password || '').trim() || Math.random().toString(36).slice(-8), // Generate random password jika kosong
                    role: 'peserta', // Default role
                }));

                setUserData(validatedData);

                toast({
                    variant: 'success',
                    title: 'Berhasil!',
                    description: `${validatedData.length} data user berhasil dibaca dari file Excel.`,
                });
            } catch (error) {
                console.error('Error reading Excel file:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error!',
                    description: 'Gagal membaca file Excel. Pastikan format file sesuai.',
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async () => {
        if (userData.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Tidak ada data user untuk diupload.',
            });
            return;
        }

        // Validasi data sebelum upload
        const invalidUsers = userData.filter(user =>
            !user.username || !user.nama || !user.email
        );

        if (invalidUsers.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: `Ada ${invalidUsers.length} user dengan data tidak lengkap. Pastikan username, nama, dan email diisi.`,
            });
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const totalUsers = userData.length;

            // Kirim semua data sekaligus
            router.post(
                route('users.import'),
                {
                    users: userData,
                },
                {
                    onProgress: (event?: InertiaProgress) => {
                        if (event && event.percentage !== undefined) {
                            setProgress(event.percentage);
                        }
                    },
                    onSuccess: () => {
                        toast({
                            variant: 'success',
                            title: 'Berhasil!',
                            description: `${totalUsers} user berhasil diimpor.`,
                        });
                        handleOpenChange(false);
                        onSuccess?.();
                    },
                    onError: (errors) => {
                        console.error('Error uploading users:', errors);
                        const errorMessage = errors.message || errors.error || 'Terjadi kesalahan saat mengimpor user.';
                        toast({
                            variant: 'destructive',
                            title: 'Error!',
                            description: errorMessage,
                        });
                    },
                    onFinish: () => {
                        setUploading(false);
                    },
                },
            );
        } catch (error) {
            console.error('Error uploading users:', error);
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Terjadi kesalahan saat mengimpor user.',
            });
            setUploading(false);
        }
    };

    const updateUserData = (index: number, field: keyof ExcelUser, value: string) => {
        setUserData(prev => prev.map((item, idx) =>
            idx === index ? { ...item, [field]: value } : item
        ));
    };

    const columns: ColumnDef<ExcelUser>[] = [
        {
            accessorKey: 'no',
            header: 'No',
            size: 50,
            cell: ({ row }) => <div className="font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: 'email',
            header: 'Email*',
            size: 180,
            cell: ({ row, getValue }) => (
                <Input
                    type="email"
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'email', e.target.value)}
                    placeholder="email@example.com"
                />
            ),
        },
        {
            accessorKey: 'username',
            header: 'Username*',
            size: 120,
            cell: ({ row, getValue }) => (
                <Input
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'username', e.target.value)}
                    placeholder="Username unik"
                />
            ),
        },
        {
            accessorKey: 'nama',
            header: 'Nama Lengkap*',
            size: 150,
            cell: ({ row, getValue }) => (
                <Input
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'nama', e.target.value)}
                    placeholder="Nama lengkap"
                />
            ),
        },
        {
            accessorKey: 'npm',
            header: 'NPM/NIM',
            size: 120,
            cell: ({ row, getValue }) => (
                <Input
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'npm', e.target.value)}
                    placeholder="NPM/NIM"
                />
            ),
        },
        {
            accessorKey: 'prodi',
            header: 'Program Studi',
            size: 150,
            cell: ({ row, getValue }) => (
                <Input
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'prodi', e.target.value)}
                    placeholder="Nama prodi"
                />
            ),
        },
        {
            accessorKey: 'fakultas',
            header: 'Fakultas',
            size: 150,
            cell: ({ row, getValue }) => (
                <Input
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'fakultas', e.target.value)}
                    placeholder="Nama fakultas"
                />
            ),
        },
        {
            accessorKey: 'universitas',
            header: 'Universitas',
            size: 150,
            cell: ({ row, getValue }) => (
                <Input
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'universitas', e.target.value)}
                    placeholder="Nama universitas"
                />
            ),
        },
        {
            accessorKey: 'no_hp',
            header: 'No. HP',
            size: 120,
            cell: ({ row, getValue }) => (
                <Input
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'no_hp', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                />
            ),
        },
        {
            accessorKey: 'alamat',
            header: 'Alamat',
            size: 200,
            cell: ({ row, getValue }) => (
                <Input
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'alamat', e.target.value)}
                    placeholder="Alamat lengkap"
                />
            ),
        },
        {
            accessorKey: 'password',
            header: 'Password*',
            size: 120,
            cell: ({ row, getValue }) => (
                <Input
                    type="password"
                    className="h-8 w-full text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => updateUserData(row.index, 'password', e.target.value)}
                    placeholder="Password"
                />
            ),
        },
        {
            accessorKey: 'role',
            header: 'Role*',
            size: 120,
            cell: ({ row, getValue }) => {
                const value = (getValue() as string) || '';
                return (
                    <Select
                        value={value}
                        onValueChange={(val) => updateUserData(row.index, 'role', val)}
                    >
                        <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                            {userRoles.map((role) => (
                                <SelectItem key={role.value} value={role.value} className="text-sm">
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            },
        },
    ];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-full sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileSpreadsheet className="h-5 w-5" />
                        Import User dari Excel
                    </DialogTitle>
                    <DialogDescription>Upload file Excel (.xlsx, .xls) atau CSV yang berisi daftar user.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[75vh] space-y-4 overflow-y-auto p-1">
                    {/* File Upload Section */}
                    <div className="">
                        <div className="mb-4">
                            <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3">
                                <h4 className="mb-2 font-medium text-foreground">Format yang Didukung:</h4>
                                <div className="text-sm text-muted-foreground">
                                    <ul className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        {userRoles.map((role) => (
                                            <li key={role.value} className="flex min-w-[45%] flex-1 flex-col gap-1">
                                                <strong>{role.label}:</strong>
                                                <code className="rounded bg-background px-2 py-1 text-foreground border">{`role = "${role.value}"`}</code>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-3 border-t border-border pt-2">
                                        <strong>Catatan:</strong> Role akan otomatis diset sebagai "peserta" dan dapat diedit saat preview
                                    </div>
                                </div>
                            </div>

                            {/* upload and download template */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileUpload}
                                        className="w-full cursor-pointer rounded-lg border p-2 text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-secondary/80"
                                        disabled={uploading}
                                    />
                                </div>
                                <Button asChild className="w-full sm:w-auto">
                                    <div>
                                        <Download />
                                        <a href={route('users.template')} download>
                                            Download Template
                                        </a>
                                    </div>
                                </Button>
                            </div>
                        </div>

                        <Separator />
                        {/* Preview Table */}
                        {userData.length > 0 && (
                            <div className="py-4">
                                <div className="items-center justify-between md:flex">
                                    <h3 className="text-lg font-medium">Preview & Edit User ({userData.length} user)</h3>
                                    <div className="text-xs text-muted-foreground">💡 Scroll horizontal untuk melihat semua kolom. Field bertanda * wajib diisi. Role default: peserta.</div>
                                </div>
                                <div className="overflow-x-auto">
                                    <DataTable
                                        columns={columns}
                                        data={userData}
                                        searchColumn="nama"
                                        searchPlaceholder="Cari nama user..."
                                        enableResponsiveHiding={false}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Upload Progress */}
                        {uploading && (
                            <div className="space-y-2 rounded-lg border bg-card p-4">
                                <Progress value={progress} className="h-2 w-full" />
                                <p className="text-sm text-muted-foreground">Mengimpor user... ({Math.round(progress)}%)</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 border-t pt-6">
                            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={uploading} className="min-w-[100px]">
                                Batal
                            </Button>
                            <Button onClick={handleUpload} disabled={userData.length === 0 || uploading} className="min-w-[140px]">
                                <Upload className="mr-2 h-4 w-4" />
                                {uploading ? 'Mengimpor...' : 'Import User'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
