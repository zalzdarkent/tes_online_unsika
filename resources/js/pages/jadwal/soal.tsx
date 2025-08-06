import SoalFormModal from '@/components/modal/SoalFormModal';
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
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import JadwalLayout from '@/layouts/jadwal/layout';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import 'katex/dist/katex.min.css';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BlockMath } from 'react-katex';

// Komponen untuk tombol hapus individual dengan dialog konfirmasi
function DeleteSoalButton({ soal, onDelete }: { soal: SoalData; onDelete: (soal: SoalData) => void }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        onDelete(soal);
        // Don't close dialog immediately, let the parent handle success/error
        setTimeout(() => {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }, 1000);
    };

    return (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer text-red-600"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsDeleteDialogOpen(true);
                    }}
                >
                    <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/90 dark:text-red-400 dark:hover:text-red-300" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                    <AlertDialogDescription>Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90">
                        {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Type untuk data soal
interface SoalData {
    id: number;
    id_jadwal: number;
    jenis_soal: string;
    pertanyaan: string;
    opsi_a?: string;
    opsi_b?: string;
    opsi_c?: string;
    opsi_d?: string;
    jawaban_benar: string;
    skor: number;
    media?: string;
    skala_min?: number;
    skala_maks?: number;
    skala_label_min?: string;
    skala_label_maks?: string;
    created_at: string;
    updated_at: string;
    equation?: string;
}

interface JadwalData {
    id: number;
    nama_jadwal: string;
    tanggal_mulai: string;
    tanggal_berakhir: string;
}

interface SoalPageProps {
    jadwal: JadwalData;
    soal: SoalData[];
}

export default function SoalPage({ jadwal, soal }: SoalPageProps) {
    const { toast } = useToast();
    const [selectedSoal, setSelectedSoal] = useState<SoalData | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [editSoal, setEditSoal] = useState<SoalData | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Handler untuk menghapus satu soal
    const handleDeleteSingle = (soal: SoalData) => {
        console.log('Delete single soal:', soal.id);

        router.delete(route('soal.destroy', soal.id), {
            onSuccess: () => {
                toast({
                    variant: 'success',
                    title: 'Berhasil!',
                    description: `Soal berhasil dihapus.`,
                });
            },
            onError: (errors: Record<string, string>) => {
                console.log('Delete errors:', errors);
                if (errors.error) {
                    toast({
                        variant: 'destructive',
                        title: 'Error!',
                        description: errors.error,
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error!',
                        description: 'Terjadi kesalahan saat menghapus soal.',
                    });
                }
            },
        });
    };

    // Kolom DataTable

    const columns: ColumnDef<SoalData>[] = [
        {
            accessorKey: 'id',
            header: 'No',
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: 'jenis_soal',
            header: 'Jenis Soal',
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
        // {
        //     accessorKey: 'pertanyaan',
        //     header: 'Pertanyaan',
        //     cell: ({ row }) => <div className="max-w-[300px] truncate">{row.getValue('pertanyaan')}</div>,
        // },
        {
            accessorKey: 'pertanyaan',
            header: 'Pertanyaan',
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
            accessorKey: 'skor',
            header: 'Skor',
            cell: ({ row }) => row.getValue('skor') + ' poin',
        },
        {
            id: 'aksi',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className="cursor-pointer"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedSoal(row.original);
                                        setShowDetail(true);
                                    }}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Lihat detail</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className="cursor-pointer"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEditSoal(row.original);
                                        setShowEditModal(true);
                                    }}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit soal</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DeleteSoalButton soal={row.original} onDelete={handleDeleteSingle} />
                            </TooltipTrigger>
                            <TooltipContent>Hapus soal</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            ),
        },
    ];

    // Modal detail soal yang diperbaiki
    const renderSoalDetailModal = () => (
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                        <Eye className="text-white-600 h-5 w-5" />
                        Detail Soal
                    </DialogTitle>
                </DialogHeader>

                {selectedSoal && (
                    <div className="space-y-6 py-4">
                        {/* Media Section */}
                        {selectedSoal.media && (
                            <div className="border-white-100 rounded-lg border p-4">
                                <h3 className="text-white-900 mb-3 flex items-center gap-2 font-medium">
                                    <svg className="h-4 w-4 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                        />
                                    </svg>
                                    Media Lampiran
                                </h3>
                                <div className="flex justify-center">
                                    {selectedSoal.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <div className="relative">
                                            <img
                                                src={`/storage/${selectedSoal.media}`}
                                                alt="Gambar soal"
                                                className="max-h-64 max-w-full rounded-lg border-2 border-gray-200 shadow-sm transition-shadow hover:shadow-md"
                                            />
                                        </div>
                                    ) : selectedSoal.media.match(/\.(mp3|wav|ogg)$/i) ? (
                                        <div className="w-full max-w-md">
                                            <audio controls src={`/storage/${selectedSoal.media}`} className="w-full rounded-lg" />
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center">
                                            <div className="text-gray-500">File media tidak dapat ditampilkan</div>
                                            <div className="text-sm text-gray-400">{selectedSoal.media}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Info Cards Grid */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Jenis Soal */}
                            <div className="border-white-900 rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-white-800 text-sm font-medium">Jenis Soal</span>
                                </div>
                                <span className="text-white-900 font-semibold">
                                    {(() => {
                                        switch (selectedSoal.jenis_soal) {
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
                                                return selectedSoal.jenis_soal;
                                        }
                                    })()}
                                </span>
                            </div>

                            {/* Skor */}
                            <div className="border-white-200 rounded-lg border p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-white-800 text-sm font-medium">Skor</span>
                                </div>
                                <span className="text-white-900 text-lg font-semibold">{selectedSoal.skor} poin</span>
                            </div>
                        </div>

                        {/* Pertanyaan */}
                        <div className="border-white-200 rounded-lg border p-5">
                            <h3 className="text-white-900 mb-3 flex items-center gap-2 font-medium">
                                <svg className="h-4 w-4 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Pertanyaan
                            </h3>
                            <div className="rounded-md bg-gray-200 p-4 leading-relaxed whitespace-pre-line text-black">{selectedSoal.pertanyaan}</div>
                        </div>

                        {/* Opsi Jawaban */}
                        {(selectedSoal.opsi_a || selectedSoal.opsi_b || selectedSoal.opsi_c || selectedSoal.opsi_d) && (
                            <div className="border-white-200 rounded-lg border p-5">
                                <h3 className="text-white-900 mb-4 flex items-center gap-2 font-medium">
                                    <svg className="h-4 w-4 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                    Pilihan Jawaban
                                </h3>
                                {selectedSoal.jenis_soal === 'multi_choice' && (
                                    <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-700">
                                        <strong>Multi Jawaban:</strong> Soal ini memiliki lebih dari satu jawaban benar
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {(() => {
                                        // Helper function untuk mengecek apakah opsi adalah jawaban benar
                                        const isCorrectAnswer = (option: string) => {
                                            const jawabanBenar = selectedSoal.jawaban_benar.toLowerCase();
                                            // Untuk multi choice, jawaban bisa berupa "a,c" atau "b,d", dll
                                            // Untuk pilihan ganda biasa, jawaban berupa "a", "b", dll
                                            return jawabanBenar.includes(option.toLowerCase());
                                        };

                                        return (
                                            <>
                                                {selectedSoal.opsi_a && (
                                                    <div
                                                        className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                                                            isCorrectAnswer('a')
                                                                ? 'border-2 border-green-200 bg-green-50'
                                                                : 'border border-blue-200 bg-blue-100'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                                                                isCorrectAnswer('a') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                                                            }`}
                                                        >
                                                            A
                                                        </span>
                                                        <span className="text-gray-800">{selectedSoal.opsi_a}</span>
                                                        {isCorrectAnswer('a') && (
                                                            <svg className="ml-auto h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedSoal.opsi_b && (
                                                    <div
                                                        className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                                                            isCorrectAnswer('b')
                                                                ? 'border-2 border-green-200 bg-green-50'
                                                                : 'border border-blue-200 bg-blue-100'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                                                                isCorrectAnswer('b') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                                                            }`}
                                                        >
                                                            B
                                                        </span>
                                                        <span className="text-gray-800">{selectedSoal.opsi_b}</span>
                                                        {isCorrectAnswer('b') && (
                                                            <svg className="ml-auto h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedSoal.opsi_c && (
                                                    <div
                                                        className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                                                            isCorrectAnswer('c')
                                                                ? 'border-2 border-green-200 bg-green-50'
                                                                : 'border border-blue-200 bg-blue-100'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                                                                isCorrectAnswer('c') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                                                            }`}
                                                        >
                                                            C
                                                        </span>
                                                        <span className="text-gray-800">{selectedSoal.opsi_c}</span>
                                                        {isCorrectAnswer('c') && (
                                                            <svg className="ml-auto h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedSoal.opsi_d && (
                                                    <div
                                                        className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                                                            isCorrectAnswer('d')
                                                                ? 'border-2 border-green-200 bg-green-50'
                                                                : 'border border-blue-200 bg-blue-100'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                                                                isCorrectAnswer('d') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                                                            }`}
                                                        >
                                                            D
                                                        </span>
                                                        <span className="text-gray-800">{selectedSoal.opsi_d}</span>
                                                        {isCorrectAnswer('d') && (
                                                            <svg className="ml-auto h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Tampilan khusus untuk soal skala */}
                        {selectedSoal.jenis_soal === 'skala' && selectedSoal.skala_min && selectedSoal.skala_maks && (
                            <div className="border-white-200 rounded-lg border p-5">
                                <h3 className="text-white-900 mb-4 flex items-center gap-2 font-medium">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    Rentang Skala
                                </h3>

                                <div className="space-y-4">
                                    {/* Info Rentang */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <div className="text-sm font-medium text-blue-800">Rentang Minimum</div>
                                            <div className="text-lg font-bold text-blue-900">{selectedSoal.skala_min}</div>
                                            <div className="text-sm text-blue-700">{selectedSoal.skala_label_min}</div>
                                        </div>
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <div className="text-sm font-medium text-blue-800">Rentang Maksimum</div>
                                            <div className="text-lg font-bold text-blue-900">{selectedSoal.skala_maks}</div>
                                            <div className="text-sm text-blue-700">{selectedSoal.skala_label_maks}</div>
                                        </div>
                                    </div>

                                    {/* Visual Skala */}
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3 text-sm font-medium text-gray-800">Preview Skala:</div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-center">
                                                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                                                    {selectedSoal.skala_min}
                                                </div>
                                                <div className="max-w-20 text-xs text-gray-600">{selectedSoal.skala_label_min}</div>
                                            </div>
                                            {/* Titik-titik di tengah */}
                                            <div className="mx-4 flex flex-1 items-center justify-center gap-1">
                                                {Array.from(
                                                    { length: Math.max(0, (selectedSoal.skala_maks || 5) - (selectedSoal.skala_min || 1) - 1) },
                                                    (_, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-medium"
                                                        >
                                                            {(selectedSoal.skala_min || 1) + i + 1}
                                                        </div>
                                                    ),
                                                )}
                                            </div>{' '}
                                            <div className="text-center">
                                                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                                                    {selectedSoal.skala_maks}
                                                </div>
                                                <div className="max-w-20 text-xs text-gray-600">{selectedSoal.skala_label_maks}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nilai Target */}
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                        <div className="mb-2 text-sm font-medium text-green-800">Nilai Target (Jawaban Benar):</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white">
                                                {selectedSoal.jawaban_benar}
                                            </div>
                                            <div className="text-green-700">
                                                Nilai yang diharapkan dalam rentang {selectedSoal.skala_min} - {selectedSoal.skala_maks}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedSoal.jenis_soal === 'equation' && selectedSoal.equation && (
                            <div className="border-white-200 rounded-lg border p-5">
                                <h3 className="text-white-800 mb-3 flex items-center gap-2 font-medium">Equation</h3>
                                <BlockMath math={selectedSoal.equation} />
                            </div>
                        )}

                        {/* Jawaban Benar untuk soal non-pilihan ganda dan non-skala */}
                        {!selectedSoal.opsi_a &&
                            !selectedSoal.opsi_b &&
                            !selectedSoal.opsi_c &&
                            !selectedSoal.opsi_d &&
                            selectedSoal.jenis_soal !== 'skala' && (
                                <div className="border-white-200 rounded-lg border p-5">
                                    <h3 className="text-white-800 mb-3 flex items-center gap-2 font-medium">
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Jawaban Benar
                                    </h3>
                                    <div className="rounded-md bg-gray-200 p-3 whitespace-pre-line text-black">{selectedSoal.jawaban_benar}</div>
                                </div>
                            )}

                        {/* Footer dengan tombol */}
                        <div className="flex justify-end gap-3 border-t pt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="cursor-pointer px-6">
                                    Tutup
                                </Button>
                            </DialogClose>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Jadwal Tes', href: '/jadwal' },
                { title: jadwal.nama_jadwal, href: `/jadwal/${jadwal.id}/soal` },
                { title: 'Soal', href: '#' },
            ]}
        >
            <Head title={`Soal - ${jadwal.nama_jadwal}`} />
            <JadwalLayout>
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="mb-1 text-2xl font-bold">Soal untuk Jadwal: {jadwal.nama_jadwal}</h2>
                            <div className="text-sm text-muted-foreground">
                                Tanggal: {format(new Date(jadwal.tanggal_mulai), 'dd MMMM yyyy', { locale: id })} s/d{' '}
                                {format(new Date(jadwal.tanggal_berakhir), 'dd MMMM yyyy', { locale: id })}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <SoalFormModal
                                trigger={
                                    <Button className="cursor-pointer">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah Soal
                                    </Button>
                                }
                                idJadwal={jadwal.id}
                                onSuccess={() => {
                                    // TODO: reload data jika perlu
                                }}
                            />
                        </div>
                    </div>
                    <DataTable
                        columns={columns}
                        data={soal}
                        searchColumn="pertanyaan"
                        searchPlaceholder="Cari pertanyaan..."
                        emptyMessage={<div className="w-full py-8 text-center text-gray-500">Belum ada soal untuk jadwal ini.</div>}
                        showExportButton
                    />
                    {renderSoalDetailModal()}

                    {/* Edit Modal */}
                    {editSoal && (
                        <SoalFormModal
                            trigger={<div style={{ display: 'none' }} />}
                            open={showEditModal}
                            onOpenChange={setShowEditModal}
                            idJadwal={jadwal.id}
                            mode="edit"
                            soal={editSoal}
                            onSuccess={() => {
                                setShowEditModal(false);
                                setEditSoal(null);
                                // Reload page to show updated data
                                window.location.reload();
                            }}
                        />
                    )}
                </div>
            </JadwalLayout>
        </AppLayout>
    );
}
