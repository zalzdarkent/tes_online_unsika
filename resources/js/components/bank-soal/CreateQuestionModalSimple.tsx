import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import { useState } from 'react';

type KategoriData = {
    id: number;
    nama: string;
};

type CreateQuestionModalProps = {
    open: boolean;
    onClose: () => void;
    kategoriList: KategoriData[];
};

export default function CreateQuestionModal({ open, onClose }: CreateQuestionModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        pertanyaan: '',
        jenis_soal: 'pilihan_ganda',
        tipe_jawaban: 'single_choice',
        difficulty_level: 'easy',
        skor: '10',
        kategori_tes_id: '',
        is_public: false,
        opsi_a: '',
        opsi_b: '',
        opsi_c: '',
        opsi_d: '',
        jawaban_benar: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const submitData = {
            ...formData,
            skor: parseInt(formData.skor),
            kategori_tes_id: formData.kategori_tes_id ? parseInt(formData.kategori_tes_id) : null
        };

        router.post('/bank-soal', submitData, {
            onSuccess: () => {
                toast({
                    title: 'Berhasil',
                    description: 'Soal berhasil ditambahkan ke bank soal',
                });
                onClose();
                setFormData({
                    title: '',
                    pertanyaan: '',
                    jenis_soal: 'pilihan_ganda',
                    tipe_jawaban: 'single_choice',
                    difficulty_level: 'easy',
                    skor: '10',
                    kategori_tes_id: '',
                    is_public: false,
                    opsi_a: '',
                    opsi_b: '',
                    opsi_c: '',
                    opsi_d: '',
                    jawaban_benar: ''
                });
            },
            onError: (errors) => {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Gagal menambahkan soal. Periksa form Anda.',
                });
                console.log('Form errors:', errors);
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    const handleInputChange = (field: string, value: string | boolean | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Tambah Soal Baru</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Judul Soal *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder="Masukkan judul soal"
                                required
                            />
                        </div>

                        {/* Pertanyaan */}
                        <div className="space-y-2">
                            <Label htmlFor="pertanyaan">Pertanyaan *</Label>
                            <textarea
                                id="pertanyaan"
                                value={formData.pertanyaan}
                                onChange={(e) => handleInputChange('pertanyaan', e.target.value)}
                                placeholder="Masukkan pertanyaan"
                                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
                                rows={4}
                                required
                            />
                        </div>

                        {/* Skor */}
                        <div className="space-y-2">
                            <Label htmlFor="skor">Skor *</Label>
                            <Input
                                id="skor"
                                type="number"
                                value={formData.skor}
                                onChange={(e) => handleInputChange('skor', e.target.value)}
                                placeholder="Masukkan skor"
                                min="1"
                                required
                            />
                        </div>

                        {/* Options untuk pilihan ganda */}
                        <div className="space-y-3">
                            <Label>Pilihan Jawaban</Label>
                            <div className="grid grid-cols-1 gap-2">
                                <Input
                                    placeholder="Opsi A"
                                    value={formData.opsi_a}
                                    onChange={(e) => handleInputChange('opsi_a', e.target.value)}
                                />
                                <Input
                                    placeholder="Opsi B"
                                    value={formData.opsi_b}
                                    onChange={(e) => handleInputChange('opsi_b', e.target.value)}
                                />
                                <Input
                                    placeholder="Opsi C"
                                    value={formData.opsi_c}
                                    onChange={(e) => handleInputChange('opsi_c', e.target.value)}
                                />
                                <Input
                                    placeholder="Opsi D"
                                    value={formData.opsi_d}
                                    onChange={(e) => handleInputChange('opsi_d', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Jawaban Benar */}
                        <div className="space-y-2">
                            <Label htmlFor="jawaban_benar">Jawaban Benar *</Label>
                            <Input
                                id="jawaban_benar"
                                value={formData.jawaban_benar}
                                onChange={(e) => handleInputChange('jawaban_benar', e.target.value)}
                                placeholder="Contoh: a"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Menyimpan...' : 'Simpan Soal'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
