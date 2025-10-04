import RichTextViewer from '@/components/rich-text-viewer';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { AlertCircleIcon, ArrowLeft, BookOpenCheck, CheckCircle, ClipboardList, User, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Types
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
    status_koreksi?: 'draft' | 'submitted' | null;
}

// Breadcrumb
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Koreksi Peserta', href: '/koreksi' },
    { title: 'Detail Koreksi', href: '#' },
];

export default function DetailKoreksi({ data, peserta, status_koreksi = null }: Props) {
    const [skorData, setSkorData] = useState<JawabanDetail[]>([]);
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isSubmitted = status_koreksi === 'submitted';
    const { toast } = useToast();

    // Auto-fill pilihan ganda
    useEffect(() => {
        const autoFilled = data.map((item) => {
            if (['pilihan_ganda', 'multi_choice'].includes(item.jenis_soal) && item.skor_didapat === null) {
                // Case-insensitive comparison untuk pilihan ganda
                const jawabanPeserta = (item.jawaban_peserta || '').toString().toLowerCase().trim();
                const jawabanBenar = (item.jawaban_benar || '').toString().toLowerCase().trim();
                const benar = jawabanPeserta === jawabanBenar;
                return { ...item, skor_didapat: benar ? item.skor_maksimal : 0 };
            }
            return item;
        });
        setSkorData(autoFilled);
    }, [data]);

    // Total skor dan nilai
    const { totalSkorDidapat, totalSkorMaksimal, totalNilai } = useMemo(() => {
        const totalSkorMaksimal = skorData.reduce((sum, item) => sum + item.skor_maksimal, 0);
        const totalSkorDidapat = skorData.reduce((sum, item) => sum + (item.skor_didapat || 0), 0);
        const nilaiAkhir = totalSkorMaksimal > 0 ? (totalSkorDidapat / totalSkorMaksimal) * 100 : 0;
        return {
            totalSkorMaksimal,
            totalSkorDidapat,
            totalNilai: Math.round(nilaiAkhir * 100) / 100,
        };
    }, [skorData]);

    // Column definitions
    const columns = useMemo<ColumnDef<JawabanDetail>[]>(
        () => [
            {
                accessorKey: 'no',
                header: 'No',
                cell: ({ row }) => <div className="font-medium">{row.index + 1}</div>,
            },
            {
                accessorKey: 'jenis_soal',
                header: 'Tipe Soal',
                cell: ({ row }) => {
                    const labelMap: Record<string, string> = {
                        pilihan_ganda: 'Pilihan Ganda',
                        multi_choice: 'Pilihan Ganda (Multi Jawaban)',
                        esai: 'Esai',
                        essay_gambar: 'Esai + Gambar',
                        essay_audio: 'Esai + Audio',
                        skala: 'Skala',
                        equation: 'Equation',
                    };
                    const key = row.getValue('jenis_soal') as string;

                    return <span className="text-sm font-medium">{labelMap[key] || key}</span>;
                },
            },
            {
                accessorKey: 'pertanyaan',
                header: 'Soal',
                cell: ({ row }) => {
                    const html = row.getValue('pertanyaan') as string;
                    return <RichTextViewer content={html} className="line-clamp-3 w-64 max-w-64 overflow-hidden" />;
                },
            },
            { accessorKey: 'jawaban_benar', header: 'Jawaban Benar' },
            {
                accessorKey: 'jawaban_peserta',
                header: 'Jawaban Peserta',
                cell: ({ row }) => {
                    const jawaban = row.original.jawaban_peserta;
                    return jawaban ? jawaban : <span className="text-muted-foreground italic">Tidak diisi</span>;
                },
            },
            {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const { jenis_soal, skor_didapat, skor_maksimal, jawaban_peserta, jawaban_benar } = row.original;
                    let status: 'benar' | 'salah' | 'belum' = 'belum';
                    if (skor_didapat !== null) {
                        if (['pilihan_ganda', 'multi_choice'].includes(jenis_soal)) {
                            // Case-insensitive comparison untuk pilihan ganda
                            const jawabanPeserta = (jawaban_peserta || '').toString().toLowerCase().trim();
                            const jawabanBenar = (jawaban_benar || '').toString().toLowerCase().trim();
                            status = jawabanPeserta === jawabanBenar ? 'benar' : 'salah';
                        } else {
                            status = skor_didapat === skor_maksimal ? 'benar' : 'salah';
                        }
                    }

                    const label = { benar: 'Benar', salah: 'Salah', belum: 'Belum Dikoreksi' };
                    const color = {
                        benar: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                        salah: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                        belum: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                    };

                    return <Badge className={color[status]}>{label[status]}</Badge>;
                },
            },
            { accessorKey: 'skor_maksimal', header: 'Skor Maksimal' },
            {
                accessorKey: 'skor_didapat',
                header: 'Skor Didapat',
                cell: ({ row }) => {
                    const index = row.index;
                    const isAuto = ['pilihan_ganda', 'multi_choice'].includes(row.original.jenis_soal);
                    const isReadonly = isSubmitted;

                    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        if (isReadonly) return;
                        const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), row.original.skor_maksimal);
                        const newData = [...skorData];
                        newData[index] = { ...newData[index], skor_didapat: val };
                        setSkorData(newData);
                    };

                    return isAuto ? (
                        <p>{skorData[index]?.skor_didapat ?? 0}</p>
                    ) : (
                        <Input
                            type="number"
                            min={0}
                            max={row.original.skor_maksimal}
                            value={skorData[index]?.skor_didapat ?? ''}
                            onChange={handleChange}
                            className="w-20"
                            disabled={isReadonly}
                            readOnly={isReadonly}
                            placeholder="Skor"
                        />
                    );
                },
            },
        ],
        [skorData, isSubmitted],
    );

    const handleSave = (isSubmit = false) => {
        if (skorData.some((item) => item.skor_didapat === null)) {
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
                skor_data: skorData.map(({ id, skor_didapat }) => ({ id, skor_didapat: skor_didapat || 0 })),
                total_nilai: totalNilai,
                action: isSubmit ? 'submit' : 'save',
            },
            {
                onSuccess: () => {
                    toast({
                        title: 'Berhasil',
                        description: isSubmit ? 'Koreksi berhasil disubmit (final)' : 'Koreksi berhasil disimpan (draft)',
                        variant: 'success',
                    });
                    setIsSaving(false);
                    if (isSubmit) setIsSubmitDialogOpen(false);
                },
                onError: (error) => {
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

    const handleSubmit = () => handleSave(true);

    const renderStatistik = () => {
        const correct = skorData.filter(
            (item) =>
                item.skor_didapat !== null &&
                (['pilihan_ganda', 'multi_choice'].includes(item.jenis_soal)
                    ? (item.jawaban_peserta || '').toString().toLowerCase().trim() === (item.jawaban_benar || '').toString().toLowerCase().trim()
                    : item.skor_didapat === item.skor_maksimal),
        ).length;

        const incorrect = skorData.filter(
            (item) =>
                item.skor_didapat !== null &&
                (['pilihan_ganda', 'multi_choice'].includes(item.jenis_soal)
                    ? (item.jawaban_peserta || '').toString().toLowerCase().trim() !== (item.jawaban_benar || '').toString().toLowerCase().trim()
                    : item.skor_didapat !== item.skor_maksimal),
        ).length;

        const ungraded = skorData.filter((item) => item.skor_didapat === null).length;

        const blocks = [
            { label: 'Jawaban Benar', value: correct, icon: <CheckCircle />, color: 'green' },
            { label: 'Jawaban Salah', value: incorrect, icon: <XCircle />, color: 'red' },
            { label: 'Belum Dikoreksi', value: ungraded, icon: <AlertCircleIcon />, color: 'yellow' },
            { label: 'Total Soal', value: skorData.length, icon: <ClipboardList />, color: 'blue' },
        ];

        return (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {blocks.map(({ label, value, icon, color }) => (
                    <div key={label} className={`rounded-lg bg-${color}-50 p-4 dark:bg-${color}-900`}>
                        <div className={`text-${color}-700 dark:text-${color}-300 mb-2 flex items-center gap-2 text-2xl font-bold`}>
                            {icon} {value}
                        </div>
                        <div className={`text-sm text-${color}-700 dark:text-${color}-300 dark:bg-${color}-900`}>{label}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Koreksi Peserta" />
            <div className="flex flex-col gap-4 p-4">
                {/* button kembali */}
                <div>
                    <Button variant="ghost" onClick={() => router.visit(`/koreksi`)} className="w-fit">
                        <ArrowLeft />
                        Kembali
                    </Button>
                </div>

                {/* Info peserta */}
                <div className="pb-3">
                    <h2 className="text-2xl font-bold">Ringkasan Nilai</h2>
                    <div className="mt-2 gap-4 space-y-4 md:flex md:justify-between md:space-y-0">
                        <div className="space-y-1 text-muted-foreground">
                            <div>
                                <User className="inline size-4" /> Nama Peserta: {peserta.nama}
                            </div>
                            <div>
                                <ClipboardList className="inline size-4" /> Tes yang Diikuti: {peserta.jadwal}
                            </div>
                            <div>
                                <BookOpenCheck className="inline size-4" /> Status:
                                <Badge
                                    className={
                                        isSubmitted
                                            ? 'ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                            : 'ml-2 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                    }
                                >
                                    {isSubmitted ? 'Sudah Dikoreksi' : 'Belum Selesai Dikoreksi'}
                                </Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="w-full gap-1 p-2 text-center md:w-24">
                                <div className="text-2xl font-bold">
                                    {totalSkorDidapat}/{totalSkorMaksimal}
                                </div>
                                <div className="text-sm">Skor</div>
                            </Card>
                            <Card className="w-full gap-1 p-2 text-center md:w-24">
                                <div className="text-2xl font-bold">{totalNilai}%</div>
                                <div className="text-sm">Nilai</div>
                            </Card>
                        </div>
                    </div>
                </div>

                {renderStatistik()}

                <DataTable columns={columns} data={skorData} enableResponsiveHiding={false} />

                {/* button simpan dan submit */}
                {!isSubmitted && (
                    <div className="mt-4">
                        <div className="flex gap-3">
                            <Button onClick={() => handleSave(false)} disabled={isSaving} variant="outline">
                                {isSaving ? 'Menyimpan...' : 'Simpan (Draft)'}
                            </Button>

                            <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button disabled={isSaving}>Submit Final</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Konfirmasi Submit Final</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Apakah Anda yakin ingin submit hasil koreksi ini sebagai final?
                                            <br />
                                            <br />
                                            <strong>Tindakan ini tidak dapat dibatalkan!</strong>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isSaving}>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSubmit} disabled={isSaving}>
                                            {isSaving ? 'Memproses...' : 'Ya, Submit Final'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
