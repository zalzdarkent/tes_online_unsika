import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { type SharedData } from '@/types';
import AppLayout from '@/layouts/app-layout';
import JadwalLayout from '@/layouts/jadwal/layout';
import CreateQuestionModal from '@/components/bank-soal/CreateQuestionModalNew';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, PlusIcon, Trash2, Search, Globe, Lock, AlertTriangle, Upload, Share2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import BankSoalImportModal from '@/components/bank-soal/BankSoalImportModal';
import ShareBankModal from '@/components/bank-soal/ShareBankModal';

type QuestionBankData = {
    id: number;
    title: string;
    pertanyaan: string;
    jenis_soal: string;
    difficulty_level: string;
    skor: number;
    usage_count: number;
    actual_usage_count: number;
    is_public: boolean;
    kategori?: {
        id: number;
        nama: string;
    };
    user: {
        id: number;
        nama: string;
    };
    created_at: string;
    updated_at: string;
};

type KategoriData = {
    id: number;
    nama: string;
};

type QuestionBankProps = {
    questionBanks: {
        data: QuestionBankData[];
        current_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    kategoriList: KategoriData[];
    filters: {
        kategori?: string;
        difficulty?: string;
        jenis_soal?: string;
        search?: string;
    };
};

const DIFFICULTY_LABELS = {
    easy: 'Mudah',
    medium: 'Sedang',
    hard: 'Sulit',
    expert: 'Expert'
};

const DIFFICULTY_COLORS = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-orange-100 text-orange-800',
    expert: 'bg-red-100 text-red-800'
};

const JENIS_SOAL_LABELS = {
    pilihan_ganda: 'Pilihan Ganda',
    multi_choice: 'Multi Pilihan',
    esai: 'Essay',
    essay_gambar: 'Essay Gambar',
    essay_audio: 'Essay Audio',
    skala: 'Skala',
    equation: 'Equation'
};

export default function BankSoalIndex({ questionBanks, kategoriList, filters }: QuestionBankProps) {
    const { toast } = useToast();
    const page = usePage<SharedData>();
    const appEnv = page.props.app_env; // Get environment from shared props

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [createModal, setCreateModal] = useState(false);
    const [importModal, setImportModal] = useState(false);
    const [shareModal, setShareModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankData | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [kategoriFilter, setKategoriFilter] = useState(filters.kategori || 'all');
    const [difficultyFilter, setDifficultyFilter] = useState(filters.difficulty || 'all');
    const [jenisFilter, setJenisFilter] = useState(filters.jenis_soal || 'all');
    const isFirstMount = useRef(true);

    // Debounced search for text input only
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            const params = {
                search: searchTerm || undefined,
                kategori: kategoriFilter !== 'all' ? kategoriFilter : undefined,
                difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
                jenis_soal: jenisFilter !== 'all' ? jenisFilter : undefined
            };

            const filteredParams = Object.fromEntries(
                Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
            );

            router.get('/bank-soal', filteredParams, {
                preserveState: true,
                preserveScroll: true
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, kategoriFilter, difficultyFilter, jenisFilter]);

    const handleDeleteSingle = (question: QuestionBankData) => {
        setSelectedQuestion(question);
        setDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (!selectedQuestion) return;

        router.delete(`/bank-soal/${selectedQuestion.id}`, {
            onSuccess: () => {
                toast({
                    title: 'Berhasil',
                    description: 'Soal berhasil dihapus dari bank soal',
                });
                setDeleteDialog(false);
                setSelectedQuestion(null);
            },
            onError: (errors) => {
                const errorMessage = errors?.error || 'Gagal menghapus soal';
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: errorMessage,
                });
                setDeleteDialog(false);
                setSelectedQuestion(null);
            }
        });
    };

    const handleBulkDelete = (selectedRows: QuestionBankData[]) => {
        const selectedIds = selectedRows.map(row => row.id.toString());

        router.post('/bank-soal/bulk-destroy', {
            ids: selectedIds
        }, {
            onSuccess: () => {
                toast({
                    title: 'Berhasil',
                    description: `${selectedIds.length} soal berhasil dihapus`,
                });
            },
            onError: () => {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Gagal menghapus soal',
                });
            }
        });
    };

    const columns: ColumnDef<QuestionBankData>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Pilih semua"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Pilih baris"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'title',
            header: 'Judul Soal',
            cell: ({ row }) => {
                const question = row.original;
                return (
                    <div className="space-y-1">
                        <div className="font-medium">
                            {question.title}
                            {question.user.id !== page.props.auth.user.id && (
                                <Badge variant="outline" className="ml-2 border-blue-200 bg-blue-50 text-blue-700 text-[10px]">
                                    Shared by {question.user.nama}
                                </Badge>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">
                            {(() => {
                                const cleanText = question.pertanyaan.replace(/<[^>]*>/g, '');
                                return cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText;
                            })()}
                        </div>
                        <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                                {JENIS_SOAL_LABELS[question.jenis_soal as keyof typeof JENIS_SOAL_LABELS]}
                            </Badge>
                            {question.is_public ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Globe className="h-3 w-3 text-blue-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>Public</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Lock className="h-3 w-3 text-red-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>Private</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'kategori.nama',
            header: 'Kategori',
            cell: ({ row }) => {
                const kategori = row.original.kategori;
                return kategori ? (
                    <Badge variant="secondary">{kategori.nama}</Badge>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                );
            }
        },
        {
            accessorKey: 'difficulty_level',
            header: 'Tingkat',
            cell: ({ row }) => {
                const difficulty = row.original.difficulty_level;
                return (
                    <Badge className={DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS]}>
                        {DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS]}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'skor',
            header: 'Skor',
            cell: ({ row }) => (
                <span className="font-mono">{row.original.skor}</span>
            )
        },
        {
            accessorKey: 'usage_count',
            header: 'Digunakan',
            cell: ({ row }) => (
                <span className="text-sm">{row.original.actual_usage_count}x</span>
            )
        },
        {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }) => {
                const question = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                    >
                                        <Link href={`/bank-soal/${question.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Lihat Detail</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                    >
                                        <Link href={`/bank-soal/${question.id}/edit`}>
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Soal</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSingle(question)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Hapus Soal</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                );
            }
        }
    ];

    return (
        <>
            <Head title="Bank Soal" />
            <AppLayout>
                <JadwalLayout>
                    {/* Production Warning Banner */}
                    {appEnv === 'production' && (
                        <div className="mb-6 bg-gradient-to-r from-red-100 to-orange-100 border border-red-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="font-semibold text-red-800">Development Environment</div>
                                <div className="text-sm text-red-700">
                                    Anda sedang menggunakan fitur Bank Soal di environment Development. Pastikan data yang dimasukkan sudah benar.
                                </div>
                            </div>
                            <div className="px-2 py-1 bg-red-200 text-red-800 text-xs font-medium rounded-full">
                                PROD
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Header & Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">Bank Soal</h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola dan atur koleksi soal Anda</p>
                            </div>
                            <Button onClick={() => setCreateModal(true)} className="cursor-pointer">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Tambah Soal
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setImportModal(true)} className="cursor-pointer">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Excel
                                </Button>
                                <Button variant="outline" onClick={() => setShareModal(true)} className="cursor-pointer">
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share Bank
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Search */}
                            <div className="lg:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Cari soal..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Kategori Filter */}
                            <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {kategoriList.map((kategori) => (
                                        <SelectItem key={`kategori-${kategori.id}`} value={kategori.id.toString()}>
                                            {kategori.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Difficulty Filter */}
                            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Tingkat" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tingkat</SelectItem>
                                    <SelectItem value="easy">Mudah</SelectItem>
                                    <SelectItem value="medium">Sedang</SelectItem>
                                    <SelectItem value="hard">Sulit</SelectItem>
                                    <SelectItem value="expert">Expert</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Jenis Soal Filter */}
                            <Select value={jenisFilter} onValueChange={setJenisFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jenis</SelectItem>
                                    <SelectItem value="pilihan_ganda">Pilihan Ganda</SelectItem>
                                    <SelectItem value="multi_choice">Multi Pilihan</SelectItem>
                                    <SelectItem value="esai">Essay</SelectItem>
                                    <SelectItem value="essay_gambar">Essay Gambar</SelectItem>
                                    <SelectItem value="essay_audio">Essay Audio</SelectItem>
                                    <SelectItem value="skala">Skala</SelectItem>
                                    <SelectItem value="equation">Equation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Data Table */}
                        <DataTable<QuestionBankData, unknown>
                            columns={columns}
                            data={questionBanks.data}
                            onBulkDelete={handleBulkDelete}
                            emptyMessage={
                                <div className="w-full py-8 text-center text-gray-500">
                                    Tidak ada soal dalam bank soal saat ini.
                                </div>
                            }
                            enableResponsiveHiding={false}
                        />

                        {/* Delete Dialog */}
                        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Hapus Soal</DialogTitle>
                                    <DialogDescription>
                                        Apakah Anda yakin ingin menghapus soal "{selectedQuestion?.title}"?
                                        Tindakan ini tidak dapat dibatalkan.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteDialog(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={confirmDelete}
                                    >
                                        Hapus
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Create Question Modal */}
                        <CreateQuestionModal
                            open={createModal}
                            onClose={() => setCreateModal(false)}
                            kategoriList={kategoriList}
                        />

                        {/* Import Modal */}
                        <BankSoalImportModal
                            open={importModal}
                            onOpenChange={setImportModal}
                            onSuccess={() => {
                                router.reload({ only: ['questionBanks'] });
                            }}
                        />

                        {/* Share Modal */}
                        <ShareBankModal
                            open={shareModal}
                            onClose={() => setShareModal(false)}
                        />
                    </div>
                </JadwalLayout>
            </AppLayout>
        </>
    );
}
