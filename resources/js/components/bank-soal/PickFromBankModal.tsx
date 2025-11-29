import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';

interface PickFromBankModalProps {
    open: boolean;
    onClose: () => void;
    jadwalId: number;
    questionBanks: QuestionBankData[];
}

type QuestionBankData = {
    id: number;
    title: string;
    pertanyaan: string;
    jenis_soal: string;
    difficulty_level: string;
    skor: number;
    user: {
        id: number;
        nama: string;
    };
    kategori?: {
        id: number;
        nama: string;
    };
};

const JENIS_SOAL_LABELS: Record<string, string> = {
    pilihan_ganda: 'Pilihan Ganda',
    multi_choice: 'Multi Pilihan',
    esai: 'Essay',
    essay_gambar: 'Essay Gambar',
    essay_audio: 'Essay Audio',
    skala: 'Skala',
    equation: 'Equation'
};

export default function PickFromBankModal({ open, onClose, jadwalId, questionBanks }: PickFromBankModalProps) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    const handleAddToTest = (selectedData: QuestionBankData[]) => {
        if (selectedData.length === 0) return;

        setSubmitting(true);
        router.post(
            '/bank-soal/copy-to-jadwal',
            {
                bank_soal_ids: selectedData.map((q) => q.id),
                jadwal_id: jadwalId,
            },
            {
                onSuccess: () => {
                    toast({
                        title: 'Berhasil',
                        description: `${selectedData.length} soal berhasil ditambahkan ke tes`,
                    });
                    onClose();
                },
                onError: () => {
                    toast({
                        variant: 'destructive',
                        title: 'Gagal',
                        description: 'Gagal menambahkan soal',
                    });
                },
                onFinish: () => setSubmitting(false),
            }
        );
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
            header: 'Soal',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                        {row.original.pertanyaan.replace(/<[^>]*>/g, '').substring(0, 80)}...
                    </div>
                    <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                            {JENIS_SOAL_LABELS[row.original.jenis_soal] || row.original.jenis_soal}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                            By {row.original.user.nama}
                        </Badge>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'kategori.nama',
            header: 'Kategori',
            cell: ({ row }) => row.original.kategori?.nama || '-',
        },
        {
            accessorKey: 'skor',
            header: 'Skor',
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Ambil Soal dari Bank Soal</DialogTitle>
                    <DialogDescription>
                        Pilih soal dari bank soal Anda atau yang dibagikan kepada Anda.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 space-y-4">
                    <DataTable
                        columns={columns}
                        data={questionBanks}
                        enableResponsiveHiding={false}
                        searchColumn="title"
                        searchPlaceholder="Cari soal..."
                        customBulkActions={[
                            {
                                label: 'Tambahkan ke Tes',
                                icon: <Plus className="h-4 w-4" />,
                                action: handleAddToTest,
                                variant: 'default',
                                disabled: submitting
                            }
                        ]}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
