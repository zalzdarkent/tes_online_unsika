import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { X, Plus } from 'lucide-react';

type KategoriData = {
    id: number;
    nama: string;
};

type CreateQuestionModalProps = {
    open: boolean;
    onClose: () => void;
    kategoriList: KategoriData[];
};

const JENIS_SOAL_OPTIONS = [
    { value: 'pilihan_ganda', label: 'Pilihan Ganda' },
    { value: 'multi_choice', label: 'Multi Pilihan' },
    { value: 'esai', label: 'Essay' },
    { value: 'essay_gambar', label: 'Essay Gambar' },
    { value: 'essay_audio', label: 'Essay Audio' },
    { value: 'skala', label: 'Skala' },
    { value: 'equation', label: 'Equation' }
];

const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Mudah' },
    { value: 'medium', label: 'Sedang' },
    { value: 'hard', label: 'Sulit' },
    { value: 'expert', label: 'Expert' }
];

export default function CreateQuestionModal({ open, onClose, kategoriList }: CreateQuestionModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        pertanyaan: '',
        jenis_soal: '',
        tipe_jawaban: '',
        difficulty_level: '',
        skor: '',
        kategori_tes_id: '',
        is_public: false,
        opsi_a: '',
        opsi_b: '',
        opsi_c: '',
        opsi_d: '',
        jawaban_benar: '',
        equation: '',
        tags: [] as string[]
    });
    const [tagInput, setTagInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const submitData = {
            ...formData,
            skor: parseInt(formData.skor),
            kategori_tes_id: formData.kategori_tes_id ? parseInt(formData.kategori_tes_id) : null,
            tags: formData.tags.length > 0 ? JSON.stringify(formData.tags) : null
        };

        router.post('/bank-soal', submitData, {
            onSuccess: () => {
                toast({
                    title: 'Berhasil',
                    description: 'Soal berhasil ditambahkan ke bank soal',
                });
                onClose();
                // Reset form
                setFormData({
                    title: '',
                    pertanyaan: '',
                    jenis_soal: '',
                    tipe_jawaban: '',
                    difficulty_level: '',
                    skor: '',
                    kategori_tes_id: '',
                    is_public: false,
                    opsi_a: '',
                    opsi_b: '',
                    opsi_c: '',
                    opsi_d: '',
                    jawaban_benar: '',
                    equation: '',
                    tags: []
                });
            },
            onError: (errors) => {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Gagal menambahkan soal. Periksa form Anda.',
                });
                console.log(errors);
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    const handleInputChange = (field: string, value: string | boolean | number) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };

            // Auto set tipe_jawaban based on jenis_soal
            if (field === 'jenis_soal') {
                if (value === 'pilihan_ganda') {
                    newData.tipe_jawaban = 'single_choice';
                } else if (value === 'multi_choice') {
                    newData.tipe_jawaban = 'multi_choice';
                } else if (value === 'esai') {
                    newData.tipe_jawaban = 'essay';
                } else if (value === 'essay_gambar') {
                    newData.tipe_jawaban = 'essay_gambar';
                } else if (value === 'essay_audio') {
                    newData.tipe_jawaban = 'essay_audio';
                } else if (value === 'skala') {
                    newData.tipe_jawaban = 'skala';
                } else if (value === 'equation') {
                    newData.tipe_jawaban = 'equation';
                }
            }

            return newData;
        });
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tagInput.trim()]
            }));
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const showOptions = ['pilihan_ganda', 'multi_choice'].includes(formData.jenis_soal);
    const showEquation = formData.jenis_soal === 'equation';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Soal Baru</DialogTitle>
                    <DialogDescription>
                        Buat soal baru untuk ditambahkan ke bank soal Anda
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
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

                            {/* Jenis Soal */}
                            <div className="space-y-2">
                                <Label>Jenis Soal *</Label>
                                <Select value={formData.jenis_soal} onValueChange={(value) => handleInputChange('jenis_soal', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis soal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JENIS_SOAL_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Difficulty */}
                            <div className="space-y-2">
                                <Label>Tingkat Kesulitan *</Label>
                                <Select value={formData.difficulty_level} onValueChange={(value) => handleInputChange('difficulty_level', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tingkat kesulitan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DIFFICULTY_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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

                            {/* Kategori */}
                            <div className="space-y-2">
                                <Label>Kategori</Label>
                                <Select value={formData.kategori_tes_id} onValueChange={(value) => handleInputChange('kategori_tes_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori (opsional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tanpa Kategori</SelectItem>
                                        {kategoriList.map((kategori) => (
                                            <SelectItem key={kategori.id} value={kategori.id.toString()}>
                                                {kategori.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Public Switch */}
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_public"
                                    checked={formData.is_public}
                                    onCheckedChange={(checked) => handleInputChange('is_public', checked)}
                                />
                                <Label htmlFor="is_public">Jadikan soal ini public</Label>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* Pertanyaan */}
                            <div className="space-y-2">
                                <Label htmlFor="pertanyaan">Pertanyaan *</Label>
                                <Textarea
                                    id="pertanyaan"
                                    value={formData.pertanyaan}
                                    onChange={(e) => handleInputChange('pertanyaan', e.target.value)}
                                    placeholder="Masukkan pertanyaan"
                                    rows={4}
                                    required
                                />
                            </div>

                            {/* Equation for equation type */}
                            {showEquation && (
                                <div className="space-y-2">
                                    <Label htmlFor="equation">Equation (LaTeX)</Label>
                                    <Input
                                        id="equation"
                                        value={formData.equation}
                                        onChange={(e) => handleInputChange('equation', e.target.value)}
                                        placeholder="Masukkan equation dalam format LaTeX"
                                    />
                                </div>
                            )}

                            {/* Options for multiple choice */}
                            {showOptions && (
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
                            )}

                            {/* Jawaban Benar */}
                            <div className="space-y-2">
                                <Label htmlFor="jawaban_benar">
                                    Jawaban Benar {showOptions && <span className="text-xs text-gray-500">(misal: a atau a,b,c untuk multi choice)</span>}
                                </Label>
                                <Input
                                    id="jawaban_benar"
                                    value={formData.jawaban_benar}
                                    onChange={(e) => handleInputChange('jawaban_benar', e.target.value)}
                                    placeholder={showOptions ? "a" : "Jawaban benar"}
                                />
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Tambah tag"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                    />
                                    <Button type="button" onClick={addTag} size="sm">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {formData.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                #{tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="ml-1 text-xs"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Menyimpan...' : 'Simpan Soal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
