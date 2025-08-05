import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
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

interface JawabanDetail {
    id: number;
    jenis_soal: string;
    pertanyaan: string;
    jawaban_benar: string;
    jawaban_peserta: string;
    skor_maksimal: number;
    skor_didapat: number | null;
}

interface Props {
    data: JawabanDetail[];
    peserta: {
        nama: string;
        jadwal: string;
    };
    status_koreksi?: 'draft' | 'submitted' | null; // Status koreksi
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Koreksi Peserta',
        href: '/koreksi',
    },
    {
        title: 'Detail Koreksi',
        href: '#',
    },
];

export default function DetailKoreksi({ data, peserta, status_koreksi = null }: Props) {
    const [skorData, setSkorData] = useState<JawabanDetail[]>([]);
    const [totalNilai, setTotalNilai] = useState<number>(0);
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

    // Auto koreksi untuk pilihan ganda saat komponen dimount
    useEffect(() => {
        const autoKoreksiData = data.map(item => {
            // Auto fill skor untuk pilihan ganda dan multi choice
            if (['pilihan_ganda', 'multi_choice'].includes(item.jenis_soal)) {
                // Jika skor_didapat masih null (belum dikoreksi), auto fill berdasarkan jawaban
                if (item.skor_didapat === null) {
                    const isCorrect = item.jawaban_peserta === item.jawaban_benar;
                    return {
                        ...item,
                        skor_didapat: isCorrect ? item.skor_maksimal : 0
                    };
                }
            }
            // Untuk jenis lain atau yang sudah ada skornya, gunakan apa adanya
            return item;
        });
        setSkorData(autoKoreksiData);
    }, [data]);

    // Cek status koreksi
    const isSubmitted = status_koreksi === 'submitted';
    const isDraft = status_koreksi === 'draft';

    const columns: ColumnDef<JawabanDetail>[] = [
        {
            accessorKey: 'jenis_soal',
            header: 'Tipe Soal',
            cell: ({ row }) => {
                const jenisSoal = row.getValue('jenis_soal') as string;
                const label = (() => {
                    switch (jenisSoal) {
                        case 'pilihan_ganda':
                            return 'Pilihan Ganda';
                        case 'multi_choice':
                            return 'Pilihan Ganda (Multi Jawaban)';
                        case 'esai':
                            return 'Esai';
                        case 'essay_gambar':
                            return 'Esai + Gambar';
                        case 'essay_audio':
                            return 'Esai + Audio';
                        case 'skala':
                            return 'Skala';
                        case 'equation':
                            return 'Equation';
                        default:
                            return jenisSoal;
                    }
                })();
                return <span className="text-sm font-medium">{label}</span>;
            },
        },
        {
            accessorKey: 'pertanyaan',
            header: 'Soal',
            cell: ({ row }) => {
                const html = row.getValue('pertanyaan') as string;
                return (
                    <div
                        className="prose line-clamp-4 max-w-[300px] overflow-hidden whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            },
        },
        {
            accessorKey: 'jawaban_benar',
            header: 'Jawaban Benar',
        },
        {
            accessorKey: 'jawaban_peserta',
            header: 'Jawaban Peserta',
        },
        {
            accessorKey: 'skor_maksimal',
            header: 'Skor Maksimal',
        },
        {
            accessorKey: 'skor_didapat',
            header: 'Skor Didapat',
            cell: ({ row }) => {
                const index = row.index;
                const jenisSoal = row.original.jenis_soal;
                const isAutoFilled = ['pilihan_ganda', 'multi_choice'].includes(jenisSoal);
                const isReadonly = isSubmitted; // Hanya readonly jika sudah submitted

                return (
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={0}
                            max={row.original.skor_maksimal}
                            value={skorData[index]?.skor_didapat ?? ''}
                            onChange={(e) => {
                                if (isReadonly) return;
                                const newValue = Math.min(Math.max(0, parseInt(e.target.value) || 0), row.original.skor_maksimal);
                                const newData = [...skorData];
                                newData[index] = {
                                    ...newData[index],
                                    skor_didapat: newValue,
                                };
                                setSkorData(newData);
                            }}
                            className="w-20"
                            disabled={isReadonly}
                            readOnly={isReadonly}
                        />
                        {isAutoFilled && !isSubmitted && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Auto-fill
                            </span>
                        )}
                    </div>
                );
            },
        },
    ];

    // Hitung total nilai (0-100) berdasarkan skor yang didapat
    useEffect(() => {
        const totalSkorMaksimal = skorData.reduce((sum, item) => sum + item.skor_maksimal, 0);
        const totalSkorDidapat = skorData.reduce((sum, item) => sum + (item.skor_didapat || 0), 0);

        const nilaiAkhir = (totalSkorDidapat / totalSkorMaksimal) * 100;
        setTotalNilai(Math.round(nilaiAkhir * 100) / 100); // Round to 2 decimal places
    }, [skorData]);

    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = (isSubmit = false) => {
        // Cek apakah semua soal sudah diberi skor
        const unscored = skorData.some((item) => item.skor_didapat === null);
        if (unscored) {
            toast({
                title: 'Peringatan',
                description: 'Harap isi skor untuk semua soal terlebih dahulu',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        const url = window.location.pathname;

        router.post(
            url,
            {
                skor_data: skorData.map((item) => ({
                    id: item.id,
                    skor_didapat: item.skor_didapat || 0,
                })),
                total_nilai: totalNilai,
                action: isSubmit ? 'submit' : 'save', // Tambahkan action
            },
            {
                onSuccess: () => {
                    toast({
                        title: 'Berhasil',
                        description: isSubmit ? 'Koreksi berhasil disubmit (final)' : 'Koreksi berhasil disimpan (draft)',
                        variant: 'success',
                    });
                    setIsSaving(false);
                    if (isSubmit) {
                        setIsSubmitDialogOpen(false);
                    }
                },
                onError: (error) => {
                    console.error('Save error:', error);
                    toast({
                        title: 'Gagal',
                        description: error?.message || 'Gagal menyimpan koreksi',
                        variant: 'destructive',
                    });
                    setIsSaving(false);
                },
            },
        );
    };

    const handleSubmit = () => {
        handleSave(true);
    };

    const renderHasilKoreksi = () => (
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                <h2 className="text-2xl font-bold text-green-800">Hasil Koreksi - {isSubmitted ? 'FINAL' : 'DRAFT'}</h2>
                <div className="text-lg text-green-700">
                    <p>
                        <strong>Nama Peserta:</strong> {peserta.nama}
                    </p>
                    <p>
                        <strong>Jadwal Tes:</strong> {peserta.jadwal}
                    </p>
                    <p className="mt-2">
                        <strong>Total Nilai:</strong> {totalNilai}/100
                    </p>
                    <p className="mt-1">
                        <strong>Status:</strong>
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${
                            isSubmitted
                                ? 'bg-green-600 text-white'
                                : 'bg-yellow-600 text-white'
                        }`}>
                            {isSubmitted ? 'SUBMITTED' : 'DRAFT'}
                        </span>
                    </p>
                </div>
            </div>
            <div className="rounded-xl border p-6">
                <DataTable
                    columns={columns.filter((col) => col.id !== 'skor_didapat')}
                    data={skorData}
                />
            </div>
            <Button
                onClick={() => {
                    router.visit(`/koreksi`);
                }}
                className="w-fit cursor-pointer"
            >
                Kembali ke Daftar Koreksi
            </Button>
        </div>
    );

    const renderFormKoreksi = () => (
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
            <h2 className="text-2xl font-bold">Detail Koreksi Peserta</h2>
            <div className="text-lg">
                <p>
                    <strong>Nama Peserta:</strong> {peserta.nama}
                </p>
                <p>
                    <strong>Jadwal Tes:</strong> {peserta.jadwal}
                </p>
                {isDraft && (
                    <p className="mt-2">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                            ⚠️ Status: DRAFT - Belum final
                        </span>
                    </p>
                )}
            </div>
            <div className="rounded-xl border p-6">
                <DataTable columns={columns} data={skorData} />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex gap-3">
                    <Button
                        onClick={() => handleSave(false)}
                        disabled={isSaving || isSubmitted}
                        variant="outline"
                        className="cursor-pointer"
                    >
                        {isSaving ? 'Menyimpan...' : 'Simpan (Draft)'}
                    </Button>

                    <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                disabled={isSaving || isSubmitted}
                                className="cursor-pointer bg-green-600 hover:bg-green-700"
                            >
                                Submit Final
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Submit Final</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Apakah Anda yakin ingin mensubmit koreksi ini sebagai hasil final?
                                    <br /><br />
                                    <strong>Tindakan ini tidak dapat dibatalkan!</strong>
                                    <br />
                                    Setelah disubmit, Anda tidak dapat mengubah skor lagi.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isSaving}>
                                    Batal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleSubmit}
                                    disabled={isSaving}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isSaving ? 'Memproses...' : 'Ya, Submit Final'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="text-lg font-semibold">Total Nilai: {totalNilai}/100</div>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Koreksi Peserta" />
            {isSubmitted ? renderHasilKoreksi() : renderFormKoreksi()}
        </AppLayout>
    );
}
