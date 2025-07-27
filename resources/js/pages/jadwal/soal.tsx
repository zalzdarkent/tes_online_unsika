import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import JadwalLayout from '@/layouts/jadwal/layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import SoalFormModal from '@/components/modal/SoalFormModal';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
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
import { ColumnDef } from '@tanstack/react-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

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
                <Button variant="ghost" size="sm" className="text-red-600 cursor-pointer"
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
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus soal ini?
                        Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
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
    created_at: string;
    updated_at: string;
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
    const { delete: deleteSoal } = useForm();
    const [selectedSoal, setSelectedSoal] = useState<SoalData | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    // Handler untuk menghapus satu soal
    const handleDeleteSingle = (soal: SoalData) => {
        console.log("Delete single soal:", soal.id);

        router.delete(route('soal.destroy', soal.id), {
            onSuccess: () => {
                toast({
                    variant: "success",
                    title: "Berhasil!",
                    description: `Soal berhasil dihapus.`,
                });
            },
            onError: (errors: Record<string, string>) => {
                console.log("Delete errors:", errors);
                if (errors.error) {
                    toast({
                        variant: "destructive",
                        title: "Error!",
                        description: errors.error,
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Error!",
                        description: "Terjadi kesalahan saat menghapus soal.",
                    });
                }
            }
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
                const jenisSoal = row.getValue('jenis_soal');
                const label = (() => {
                    switch (jenisSoal) {
                        case 'pilihan_ganda': return 'Pilihan Ganda';
                        case 'multi_choice': return 'Pilihan Ganda (Multi Jawaban)';
                        case 'esai': return 'Esai';
                        case 'essay_gambar': return 'Esai + Gambar';
                        case 'essay_audio': return 'Esai + Audio';
                        case 'skala': return 'Skala';
                        case 'equation': return 'Equation';
                        default: return jenisSoal;
                    }
                })();
                return (
                    <span className="text-sm font-medium">{label}</span>
                );
            },
        },
        {
            accessorKey: 'pertanyaan',
            header: 'Pertanyaan',
            cell: ({ row }) => (
                <div className="max-w-[300px] truncate">
                    {row.getValue('pertanyaan')}
                </div>
            ),
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
                                <Button className='cursor-pointer' variant="ghost" size="sm" onClick={() => { setSelectedSoal(row.original); setShowDetail(true); }}><Eye className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>Lihat detail</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className='cursor-pointer' variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Eye className="h-5 w-5 text-white-600" />
                        Detail Soal
                    </DialogTitle>
                </DialogHeader>

                {selectedSoal && (
                    <div className="space-y-6 py-4">
                        {/* Media Section */}
                        {selectedSoal.media && (
                            <div className="border border-white-100 rounded-lg p-4">
                                <h3 className="font-medium text-white-900 mb-3 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    Media Lampiran
                                </h3>
                                <div className="flex justify-center">
                                    {selectedSoal.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <div className="relative">
                                            <img
                                                src={`/storage/${selectedSoal.media}`}
                                                alt="Gambar soal"
                                                className="max-w-full max-h-64 rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                            />
                                        </div>
                                    ) : selectedSoal.media.match(/\.(mp3|wav|ogg)$/i) ? (
                                        <div className="w-full max-w-md">
                                            <audio
                                                controls
                                                src={`/storage/${selectedSoal.media}`}
                                                className="w-full rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="text-gray-500">File media tidak dapat ditampilkan</div>
                                            <div className="text-sm text-gray-400">{selectedSoal.media}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Info Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Jenis Soal */}
                            <div className="border border-white-900 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    <span className="text-sm font-medium text-white-800">Jenis Soal</span>
                                </div>
                                <span className="text-white-900 font-semibold">
                                    {(() => {
                                        switch (selectedSoal.jenis_soal) {
                                            case 'pilihan_ganda': return 'Pilihan Ganda';
                                            case 'multi_choice': return 'Pilihan Ganda (Multi Jawaban)';
                                            case 'esai': return 'Esai';
                                            case 'essay_gambar': return 'Esai + Gambar';
                                            case 'essay_audio': return 'Esai + Audio';
                                            case 'skala': return 'Skala';
                                            case 'equation': return 'Equation';
                                            default: return selectedSoal.jenis_soal;
                                        }
                                    })()}
                                </span>
                            </div>

                            {/* Skor */}
                            <div className="border border-white-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    <span className="text-sm font-medium text-white-800">Skor</span>
                                </div>
                                <span className="text-white-900 font-semibold text-lg">{selectedSoal.skor} poin</span>
                            </div>
                        </div>

                        {/* Pertanyaan */}
                        <div className="border border-white-200 rounded-lg p-5">
                            <h3 className="font-medium text-white-900 mb-3 flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pertanyaan
                            </h3>
                            <div className="text-black leading-relaxed whitespace-pre-line bg-gray-200 p-4 rounded-md">
                                {selectedSoal.pertanyaan}
                            </div>
                        </div>

                        {/* Opsi Jawaban */}
                        {(selectedSoal.opsi_a || selectedSoal.opsi_b || selectedSoal.opsi_c || selectedSoal.opsi_d) && (
                            <div className="border border-white-200 rounded-lg p-5">
                                <h3 className="font-medium text-white-900 mb-4 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Pilihan Jawaban
                                </h3>
                                <div className="space-y-3">
                                    {selectedSoal.opsi_a && (
                                        <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${selectedSoal.jawaban_benar.toLowerCase() === 'a'
                                                ? 'bg-green-50 border-2 border-green-200'
                                                : 'bg-blue-100 border border-blue-200'
                                            }`}>
                                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${selectedSoal.jawaban_benar.toLowerCase() === 'a'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-300 text-gray-700'
                                                }`}>
                                                A
                                            </span>
                                            <span className="text-gray-800">{selectedSoal.opsi_a}</span>
                                            {selectedSoal.jawaban_benar.toLowerCase() === 'a' && (
                                                <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    )}

                                    {selectedSoal.opsi_b && (
                                        <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${selectedSoal.jawaban_benar.toLowerCase() === 'b'
                                                ? 'bg-green-50 border-2 border-green-200'
                                                : 'bg-blue-100 border border-blue-200'
                                            }`}>
                                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${selectedSoal.jawaban_benar.toLowerCase() === 'b'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-300 text-gray-700'
                                                }`}>
                                                B
                                            </span>
                                            <span className="text-gray-800">{selectedSoal.opsi_b}</span>
                                            {selectedSoal.jawaban_benar.toLowerCase() === 'b' && (
                                                <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    )}

                                    {selectedSoal.opsi_c && (
                                        <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${selectedSoal.jawaban_benar.toLowerCase() === 'c'
                                                ? 'bg-green-50 border-2 border-green-200'
                                                : 'bg-blue-100 border border-blue-200'
                                            }`}>
                                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${selectedSoal.jawaban_benar.toLowerCase() === 'c'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-300 text-gray-700'
                                                }`}>
                                                C
                                            </span>
                                            <span className="text-gray-800">{selectedSoal.opsi_c}</span>
                                            {selectedSoal.jawaban_benar.toLowerCase() === 'c' && (
                                                <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    )}

                                    {selectedSoal.opsi_d && (
                                        <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${selectedSoal.jawaban_benar.toLowerCase() === 'd'
                                                ? 'bg-green-50 border-2 border-green-200'
                                                : 'bg-blue-100 border border-blue-200'
                                            }`}>
                                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${selectedSoal.jawaban_benar.toLowerCase() === 'd'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-300 text-gray-700'
                                                }`}>
                                                D
                                            </span>
                                            <span className="text-gray-800">{selectedSoal.opsi_d}</span>
                                            {selectedSoal.jawaban_benar.toLowerCase() === 'd' && (
                                                <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Jawaban Benar untuk soal non-pilihan ganda */}
                        {!selectedSoal.opsi_a && !selectedSoal.opsi_b && !selectedSoal.opsi_c && !selectedSoal.opsi_d && (
                            <div className="border border-white-200 rounded-lg p-5">
                                <h3 className="font-medium text-white-800 mb-3 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Jawaban Benar
                                </h3>
                                <div className="text-black bg-gray-200 p-3 rounded-md whitespace-pre-line">
                                    {selectedSoal.jawaban_benar}
                                </div>
                            </div>
                        )}

                        {/* Footer dengan tombol */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="px-6 cursor-pointer">
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
        <AppLayout breadcrumbs={[
            { title: 'Jadwal Tes', href: '/jadwal' },
            { title: jadwal.nama_jadwal, href: `/jadwal/${jadwal.id}/soal` },
            { title: 'Soal', href: '#' },
        ]}>
            <Head title={`Soal - ${jadwal.nama_jadwal}`} />
            <JadwalLayout>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl overflow-x-auto">
                    <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Soal untuk Jadwal: {jadwal.nama_jadwal}</h2>
                        <div className="text-sm text-muted-foreground">
                            Tanggal: {jadwal.tanggal_mulai} s/d {jadwal.tanggal_berakhir}
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
                    emptyMessage={<div className="text-center w-full py-8 text-gray-500">Belum ada soal untuk jadwal ini.</div>}
                />
                {renderSoalDetailModal()}
            </div>
            </JadwalLayout>
        </AppLayout>
    );
}
