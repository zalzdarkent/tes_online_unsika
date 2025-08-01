import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { useState, useEffect } from 'react';

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

export default function DetailKoreksi({ data, peserta }: Props) {
    const [skorData, setSkorData] = useState<JawabanDetail[]>(data);
    const [totalNilai, setTotalNilai] = useState<number>(0);

    // Cek apakah sudah dikoreksi dengan memeriksa skor_didapat pada data pertama
    const isKoreksi = data.length > 0 && data[0].skor_didapat !== null;

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
                return (
                    <Input
                        type="number"
                        min={0}
                        max={row.original.skor_maksimal}
                        value={skorData[index].skor_didapat || ''}
                        onChange={(e) => {
                            const newValue = Math.min(
                                Math.max(0, parseInt(e.target.value) || 0),
                                row.original.skor_maksimal
                            );
                            const newData = [...skorData];
                            newData[index] = {
                                ...newData[index],
                                skor_didapat: newValue,
                            };
                            setSkorData(newData);
                        }}
                        className="w-20"
                    />
                );
            },
        },
    ];

    // Hitung total nilai (0-100) berdasarkan skor yang didapat
    useEffect(() => {
        const totalSkorMaksimal = skorData.reduce(
            (sum, item) => sum + item.skor_maksimal,
            0
        );
        const totalSkorDidapat = skorData.reduce(
            (sum, item) => sum + (item.skor_didapat || 0),
            0
        );

        const nilaiAkhir = (totalSkorDidapat / totalSkorMaksimal) * 100;
        setTotalNilai(Math.round(nilaiAkhir * 100) / 100); // Round to 2 decimal places
    }, [skorData]);

    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        // Cek apakah semua soal sudah diberi skor
        const unscored = skorData.some(item => item.skor_didapat === null);
        if (unscored) {
            toast({
                title: "Peringatan",
                description: "Harap isi skor untuk semua soal terlebih dahulu",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        const url = window.location.pathname;

        router.post(url, {
            skor_data: skorData.map(item => ({
                id: item.id,
                skor_didapat: item.skor_didapat || 0
            })),
            total_nilai: totalNilai
        }, {
            onSuccess: () => {
                toast({
                    title: "Berhasil",
                    description: "Koreksi berhasil disimpan",
                    variant: "success",
                });
                setIsSaving(false);
            },
            onError: (error) => {
                console.error('Save error:', error);
                toast({
                    title: "Gagal",
                    description: error?.message || "Gagal menyimpan koreksi",
                    variant: "destructive",
                });
                setIsSaving(false);
            }
        });
    };

    const renderHasilKoreksi = () => (
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h2 className="text-2xl font-bold text-green-800">Hasil Koreksi</h2>
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
                </div>
            </div>
            <div className="rounded-xl border p-6">
                <DataTable
                    columns={columns.filter(col => col.accessorKey !== 'skor_didapat')}
                    data={skorData}
                />
            </div>
            <Button
                onClick={() => window.location.href = '/koreksi'}
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
            </div>
            <div className="rounded-xl border p-6">
                <DataTable columns={columns} data={skorData} />
            </div>
            <div className="flex justify-between items-center">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90"
                >
                    {isSaving ? 'Menyimpan...' : 'Simpan Koreksi'}
                </Button>
                <div className="text-lg font-semibold">
                    Total Nilai: {totalNilai}/100
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Koreksi Peserta" />
            {isKoreksi ? renderHasilKoreksi() : renderFormKoreksi()}
        </AppLayout>
    );
}
