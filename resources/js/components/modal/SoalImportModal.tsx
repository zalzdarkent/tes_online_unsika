import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { router } from '@inertiajs/react';

interface SoalImportModalProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    idJadwal: number;
    onSuccess?: () => void;
}

interface ExcelSoal {
    jenis_soal: string;
    pertanyaan: string;
    skor: number;
    opsi_a?: string;
    opsi_b?: string;
    opsi_c?: string;
    opsi_d?: string;
    jawaban_benar: string;
    skala_min?: number;
    skala_maks?: number;
    skala_label_min?: string;
    skala_label_maks?: string;
    equation?: string;
}

export default function SoalImportModal({ trigger, open = false, onOpenChange, idJadwal, onSuccess }: SoalImportModalProps) {
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
                    skor: Number(item.skor) || 1,
                    opsi_a: item.opsi_a ? String(item.opsi_a) : '',
                    opsi_b: item.opsi_b ? String(item.opsi_b) : '',
                    opsi_c: item.opsi_c ? String(item.opsi_c) : '',
                    opsi_d: item.opsi_d ? String(item.opsi_d) : '',
                    jawaban_benar: String(item.jawaban_benar || ''),
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
            let uploaded = 0;

            // Kirim semua data sekaligus
            await router.post(route('soal.import'), {
                soal: soalData.map(soal => ({
                    ...soal,
                    id_jadwal: idJadwal
                }))
            }, {
                onProgress: (event: { percentage?: number }) => {
                    // Update progress based on upload progress
                    if (event && event.percentage) {
                        setProgress(event.percentage);
                    }
                },
                onSuccess: () => {
                    toast({
                        title: 'Berhasil!',
                        description: `${totalSoal} soal berhasil diupload.`,
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
                }
            });

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

    const columns = [
        {
            accessorKey: 'jenis_soal',
            header: 'Jenis',
            size: 140,
            cell: ({ row, getValue }) => (
                <select
                    className="h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                    value={getValue() as string}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].jenis_soal = e.target.value;
                        setSoalData(newData);
                    }}
                >
                    <option value="pilihan_ganda">Pilihan Ganda</option>
                    <option value="multi_choice">Multi Pilihan</option>
                    <option value="esai">Esai</option>
                    <option value="skala">Skala</option>
                    <option value="equation">Equation</option>
                </select>
            ),
        },
        {
            accessorKey: 'pertanyaan',
            header: 'Pertanyaan',
            size: 250,
            cell: ({ row, getValue }) => (
                <input
                    type="text"
                    className="h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                    value={getValue() as string}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].pertanyaan = e.target.value;
                        setSoalData(newData);
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
                <input
                    type="number"
                    className="h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                    value={getValue() as number}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].skor = Number(e.target.value);
                        setSoalData(newData);
                    }}
                    min="0"
                />
            ),
        },
        {
            accessorKey: 'opsi_a',
            header: 'A',
            size: 120,
            cell: ({ row, getValue }) => (
                <input
                    type="text"
                    className="h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                    value={getValue() as string || ''}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].opsi_a = e.target.value;
                        setSoalData(newData);
                    }}
                    placeholder="Opsi A"
                />
            ),
        },
        {
            accessorKey: 'opsi_b',
            header: 'B',
            size: 120,
            cell: ({ row, getValue }) => (
                <input
                    type="text"
                    className="h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                    value={getValue() as string || ''}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].opsi_b = e.target.value;
                        setSoalData(newData);
                    }}
                    placeholder="Opsi B"
                />
            ),
        },
        {
            accessorKey: 'opsi_c',
            header: 'C',
            size: 120,
            cell: ({ row, getValue }) => (
                <input
                    type="text"
                    className="h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                    value={getValue() as string || ''}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].opsi_c = e.target.value;
                        setSoalData(newData);
                    }}
                    placeholder="Opsi C"
                />
            ),
        },
        {
            accessorKey: 'opsi_d',
            header: 'D',
            size: 120,
            cell: ({ row, getValue }) => (
                <input
                    type="text"
                    className="h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                    value={getValue() as string || ''}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].opsi_d = e.target.value;
                        setSoalData(newData);
                    }}
                    placeholder="Opsi D"
                />
            ),
        },
        {
            accessorKey: 'jawaban_benar',
            header: 'Jawaban',
            size: 90,
            cell: ({ row, getValue }) => (
                <input
                    type="text"
                    className="h-8 w-full rounded border border-input bg-background px-2 py-1 text-xs"
                    value={getValue() as string || ''}
                    onChange={(e) => {
                        const newData = [...soalData];
                        newData[row.index].jawaban_benar = e.target.value;
                        setSoalData(newData);
                    }}
                    placeholder="a/b/c/d"
                />
            ),
        },
    ];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[95vw] max-w-7xl">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileSpreadsheet className="h-5 w-5" />
                        Import Soal dari Excel
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[75vh] space-y-6 overflow-y-auto p-1">
                    {/* File Upload Section */}
                    <div className="rounded-lg border bg-card p-6">
                        <div className="mb-4">
                            <h3 className="mb-2 text-lg font-medium">Upload File Excel</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Upload file Excel (.xlsx, .xls) atau CSV yang berisi daftar soal. Pastikan format sesuai dengan template.
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <h4 className="font-medium text-blue-900 mb-2">Format yang Didukung:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                                    <div>• <strong>Pilihan Ganda:</strong> jenis_soal = "pilihan_ganda"</div>
                                    <div>• <strong>Multi Pilihan:</strong> jenis_soal = "multi_choice"</div>
                                    <div>• <strong>Esai:</strong> jenis_soal = "esai"</div>
                                    <div>• <strong>Skala:</strong> jenis_soal = "skala"</div>
                                </div>
                            </div>
                        </div>
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
                            <Button variant="outline" asChild className="w-full sm:w-auto">
                                <a href={route('soal.template')} download>
                                    Download Template
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Preview Table */}
                    {soalData.length > 0 && (
                        <div className="rounded-lg border bg-card p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-medium">Preview & Edit Data ({soalData.length} soal)</h3>
                                <div className="text-xs text-muted-foreground">
                                    💡 Scroll horizontal untuk melihat semua kolom
                                </div>
                            </div>
                            <div className="overflow-auto rounded-md border">
                                <div className="min-w-[1000px]">
                                    <DataTable
                                        columns={columns}
                                        data={soalData}
                                        searchColumn="pertanyaan"
                                        searchPlaceholder="Cari pertanyaan..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="space-y-2 rounded-lg border bg-card p-4">
                            <Progress value={progress} className="h-2 w-full" />
                            <p className="text-sm text-muted-foreground">
                                Mengupload soal... ({Math.round(progress)}%)
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 border-t pt-6">
                        <Button
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={uploading}
                            className="min-w-[100px]"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={soalData.length === 0 || uploading}
                            className="min-w-[140px]"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {uploading ? 'Mengupload...' : 'Upload Soal'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
