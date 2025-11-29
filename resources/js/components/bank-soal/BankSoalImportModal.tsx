import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Progress as InertiaProgress } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';

interface BankSoalImportModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

interface ExcelSoal {
    jenis_soal: string;
    pertanyaan: string;
    skor: number | null; // Allow null for import
    opsi_a?: string;
    opsi_b?: string;
    opsi_c?: string;
    opsi_d?: string;
    jawaban_benar: string; // Allow empty string for import
    skala_min?: number;
    skala_maks?: number;
    skala_label_min?: string;
    skala_label_maks?: string;
    equation?: string;
}

const soalTypes = [
    { label: 'Pilihan Ganda (1 jawaban)', value: 'pilihan_ganda' },
    { label: 'Pilihan Ganda (Lebih dari 1 jawaban)', value: 'multi_choice' },
    { label: 'Esai', value: 'esai' },
    { label: 'Skala', value: 'skala' },
];

export default function BankSoalImportModal({ trigger, open = false, onOpenChange, onSuccess }: BankSoalImportModalProps) {
    const [soalData, setSoalData] = useState<ExcelSoal[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { toast } = useToast();

    const handleOpenChange = (value: boolean) => {
        if (onOpenChange) {
            onOpenChange(value);
        }
        if (!value) {
            setSoalData([]);
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
                const jsonData: ExcelSoal[] = XLSX.utils.sheet_to_json(firstSheet);

                // Validasi data dan konversi ke string
                const validatedData = jsonData.map((item) => ({
                    jenis_soal: String(item.jenis_soal || 'pilihan_ganda'),
                    pertanyaan: String(item.pertanyaan || ''),
                    skor: item.skor ? Number(item.skor) : null, // Allow null for import
                    opsi_a: item.opsi_a ? String(item.opsi_a) : '',
                    opsi_b: item.opsi_b ? String(item.opsi_b) : '',
                    opsi_c: item.opsi_c ? String(item.opsi_c) : '',
                    opsi_d: item.opsi_d ? String(item.opsi_d) : '',
                    jawaban_benar: item.jawaban_benar ? String(item.jawaban_benar).toUpperCase() : '', // Allow empty for import
                    skala_min: item.skala_min ? Number(item.skala_min) : undefined,
                    skala_maks: item.skala_maks ? Number(item.skala_maks) : undefined,
                    skala_label_min: item.skala_label_min ? String(item.skala_label_min) : '',
                    skala_label_maks: item.skala_label_maks ? String(item.skala_label_maks) : '',
                    equation: item.equation ? String(item.equation) : '',
                }));

                setSoalData(validatedData);
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
        if (soalData.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Tidak ada data soal untuk diupload.',
            });
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const totalSoal = soalData.length;

            // Kirim semua data sekaligus
            router.post(
                route('bank-soal.import'),
                {
                    soal: soalData as any,
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
                            description: `${totalSoal} soal berhasil diupload ke Bank Soal.`,
                        });
                        handleOpenChange(false);
                        onSuccess?.();
                    },
                    onError: (errors) => {
                        console.error('Error uploading soal:', errors);
                        toast({
                            variant: 'destructive',
                            title: 'Error!',
                            description: errors.message || 'Terjadi kesalahan saat mengupload soal.',
                        });
                    },
                    onFinish: () => {
                        setUploading(false);
                    },
                },
            );
        } catch (error) {
            console.error('Error uploading soal:', error);
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Terjadi kesalahan saat mengupload soal.',
            });
            setUploading(false);
        }
    };

    const columns: ColumnDef<ExcelSoal>[] = [
        {
            accessorKey: 'no',
            header: 'No',
            size: 15,
            maxSize: 20,
            enableHiding: true,
            cell: ({ row }) => <div className="font-medium">{row.index + 1}</div>,
        },
        {
            accessorKey: 'jenis_soal',
            header: 'Jenis',
            size: 140,
            cell: ({ row, getValue }) => {
                const value = (getValue() as string) || '';
                return (
                    <Select
                        value={value}
                        onValueChange={(val) => {
                            const newData = [...soalData];
                            newData[row.index].jenis_soal = val;
                            setSoalData(newData);
                        }}
                    >
                        <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue placeholder="Pilih jenis soal" />
                        </SelectTrigger>
                        <SelectContent>
                            {soalTypes.map((soal) => (
                                <SelectItem key={soal.value} value={soal.value} className="text-sm">
                                    {soal.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            },
        },
        {
            accessorKey: 'pertanyaan',
            header: 'Pertanyaan',
            size: 250,
            cell: ({ row, getValue }) => (
                <Textarea
                    className="block max-h-40 min-h-[2rem] max-w-96 min-w-[16rem] resize rounded border border-input bg-background px-2 py-1 text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSoalData((prev) => prev.map((item, idx) => (idx === row.index ? { ...item, opsi_a: value } : item)));
                    }}
                    placeholder="Masukkan pertanyaan..."
                />
            ),
        },
        {
            accessorKey: 'skor',
            header: 'Skor',
            size: 70,
            cell: ({ row, getValue }) => (
                <Input
                    type="number"
                    className="h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                    value={(getValue() as number) ?? ''}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].skor = e.target.value ? Number(e.target.value) : null;
                        setSoalData(newData);
                    }}
                    min={0}
                    placeholder="Opsional"
                />
            ),
        },
        ...['opsi_a', 'opsi_b', 'opsi_c', 'opsi_d'].map((opsiKey) => ({
            accessorKey: opsiKey,
            header: opsiKey
                .split('_')
                .map((w) => w[0].toUpperCase() + w.slice(1))
                .join(' '),
            size: 120,
            enableSorting: false,
            cell: ({ row, getValue }: { row: Row<ExcelSoal>; getValue: () => unknown }) => {
                const jenis = row.original.jenis_soal || '';
                return (
                    <Textarea
                        className="block max-h-40 min-h-[2rem] max-w-64 min-w-[8rem] resize rounded border border-input bg-background px-2 py-1 text-xs"
                        value={(getValue() as string) || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSoalData((prev) => prev.map((item, idx) => (idx === row.index ? { ...item, [opsiKey]: value } : item)));
                        }}
                        placeholder={`Opsi ${opsiKey.split('_')[1].toUpperCase()}`}
                        disabled={!(jenis === 'pilihan_ganda' || jenis === 'multi_choice')}
                    />
                );
            },
        })),
        {
            accessorKey: 'jawaban_benar',
            header: 'Jawaban Benar',
            size: 90,
            enableSorting: false,
            cell: ({ row, getValue }) => (
                <Textarea
                    className="block max-h-40 min-h-[2rem] max-w-64 min-w-[8rem] resize rounded border border-input bg-background px-2 py-1 text-xs"
                    value={(getValue() as string) || ''}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].jawaban_benar = e.target.value;
                        setSoalData(newData);
                    }}
                    placeholder="Opsional (a/b/c/d)"
                />
            ),
        },
    ];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-full sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileSpreadsheet className="h-5 w-5" />
                        Import Soal ke Bank Soal
                    </DialogTitle>
                    <DialogDescription>Upload file Excel (.xlsx, .xls) atau CSV yang berisi daftar soal.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[75vh] space-y-4 overflow-y-auto p-1">
                    {/* File Upload Section */}
                    <div className="">
                        <div className="mb-4">
                            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <h4 className="mb-2 font-medium text-blue-900">Format yang Didukung:</h4>
                                <div className="text-sm text-blue-800">
                                    <ul className="flex flex-wrap gap-4 text-sm text-blue-800">
                                        {soalTypes.map((soal) => (
                                            <li key={soal.value} className="flex min-w-[45%] flex-1 flex-col gap-1">
                                                <strong>{soal.label}:</strong>
                                                <code className="rounded bg-blue-100 px-2 py-1">{`jenis_soal = "${soal.value}"`}</code>
                                            </li>
                                        ))}
                                    </ul>
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
                                        <a href={route('soal.template')} download>
                                            Download Template
                                        </a>
                                    </div>
                                </Button>
                            </div>
                        </div>

                        <Separator />
                        {/* Preview Table */}
                        {soalData.length > 0 && (
                            <div className="py-4">
                                <div className="items-center justify-between md:flex">
                                    <h3 className="text-lg font-medium">Preview & Edit Soal ({soalData.length} soal)</h3>
                                    <div className="text-xs text-muted-foreground">💡 Scroll horizontal untuk melihat semua kolom</div>
                                </div>
                                <div className="overflow-x-auto">
                                    <DataTable columns={columns} data={soalData} searchColumn="pertanyaan" searchPlaceholder="Cari pertanyaan..." enableResponsiveHiding={false} />
                                </div>
                            </div>
                        )}

                        {/* Upload Progress */}
                        {uploading && (
                            <div className="space-y-2 rounded-lg border bg-card p-4">
                                <Progress value={progress} className="h-2 w-full" />
                                <p className="text-sm text-muted-foreground">Mengupload soal... ({Math.round(progress)}%)</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 border-t pt-6">
                            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={uploading} className="min-w-[100px]">
                                Batal
                            </Button>
                            <Button onClick={handleUpload} disabled={soalData.length === 0 || uploading} className="min-w-[140px]">
                                <Upload className="mr-2 h-4 w-4" />
                                {uploading ? 'Mengupload...' : 'Upload Soal'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
