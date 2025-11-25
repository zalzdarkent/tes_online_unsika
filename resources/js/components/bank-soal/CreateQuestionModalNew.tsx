import RichTextEditor from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import 'katex/dist/katex.min.css';
import React, { useState } from 'react';
import { BlockMath } from 'react-katex';

type KategoriData = {
    id: number;
    nama: string;
};

type CreateQuestionModalProps = {
    open: boolean;
    onClose: () => void;
    kategoriList: KategoriData[];
};

// Tipe soal yang didukung untuk bank soal
const SOAL_TYPES = [
    { value: 'pilihan_ganda', label: 'Multiple Choice (Satu Jawaban)' },
    { value: 'pilihan_ganda_gambar', label: 'Multiple Choice (Satu Jawaban) + Gambar' },
    { value: 'pilihan_ganda_audio', label: 'Multiple Choice (Satu Jawaban) + Audio' },
    { value: 'multi_choice', label: 'Multiple Choice (Banyak Jawaban)' },
    { value: 'multi_choice_gambar', label: 'Multiple Choice (Banyak Jawaban) + Gambar' },
    { value: 'multi_choice_audio', label: 'Multiple Choice (Banyak Jawaban) + Audio' },
    { value: 'esai', label: 'Essay' },
    { value: 'essay_gambar', label: 'Essay + Gambar' },
    { value: 'essay_audio', label: 'Essay + Audio' },
    { value: 'skala', label: 'Rentang Skala' },
    { value: 'equation', label: 'Equation' },
];

const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Mudah' },
    { value: 'medium', label: 'Sedang' },
    { value: 'hard', label: 'Sulit' },
    { value: 'expert', label: 'Expert' }
];

export default function CreateQuestionModal({ open, onClose, kategoriList }: CreateQuestionModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [jenisSoal, setJenisSoal] = useState('');
    const [pertanyaan, setPertanyaan] = useState('');
    const [opsi, setOpsi] = useState(['', '', '', '']);
    const [jawabanBenar, setJawabanBenar] = useState('');
    const [jawabanBenarMulti, setJawabanBenarMulti] = useState<string[]>([]);
    const [skor, setSkor] = useState(1);
    const [difficultyLevel, setDifficultyLevel] = useState('');
    const [kategoriTesId, setKategoriTesId] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [equation, setEquation] = useState('');
    const [skalaMin, setSkalaMin] = useState<number | undefined>(1);
    const [skalaMaks, setSkalaMaks] = useState<number | undefined>(5);
    const [skalaLabelMin, setSkalaLabelMin] = useState('');
    const [skalaLabelMaks, setSkalaLabelMaks] = useState('');
    const [media, setMedia] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form saat modal ditutup
    const resetForm = () => {
        setTitle('');
        setJenisSoal('');
        setPertanyaan('');
        setOpsi(['', '', '', '']);
        setJawabanBenar('');
        setJawabanBenarMulti([]);
        setSkor(1);
        setDifficultyLevel('');
        setKategoriTesId('');
        setIsPublic(false);
        setEquation('');
        setSkalaMin(1);
        setSkalaMaks(5);
        setSkalaLabelMin('');
        setSkalaLabelMaks('');
        setMedia(null);
        setErrors({});
    };

    // Validasi form
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = 'Judul soal wajib diisi.';
        if (!pertanyaan.trim()) newErrors.pertanyaan = 'Pertanyaan wajib diisi.';
        if (!jenisSoal) newErrors.jenisSoal = 'Jenis soal wajib dipilih.';
        if (!difficultyLevel) newErrors.difficultyLevel = 'Tingkat kesulitan wajib dipilih.';
        if (!skor || skor < 1) newErrors.skor = 'Skor minimal 1.';

        if (jenisSoal === 'pilihan_ganda' || jenisSoal === 'pilihan_ganda_gambar' || jenisSoal === 'pilihan_ganda_audio') {
            opsi.forEach((o, i) => {
                if (!o.trim()) newErrors[`opsi_${i}`] = `Opsi ${String.fromCharCode(65 + i)} wajib diisi.`;
            });
            if (!jawabanBenar) newErrors.jawabanBenar = 'Jawaban benar wajib dipilih.';
        }

        if (jenisSoal === 'multi_choice' || jenisSoal === 'multi_choice_gambar' || jenisSoal === 'multi_choice_audio') {
            opsi.forEach((o, i) => {
                if (!o.trim()) newErrors[`opsi_${i}`] = `Opsi ${String.fromCharCode(65 + i)} wajib diisi.`;
            });
            if (jawabanBenarMulti.length === 0) newErrors.jawabanBenarMulti = 'Pilih minimal satu jawaban benar.';
        }

        if (jenisSoal === 'skala') {
            if (skalaMin !== undefined && skalaMaks !== undefined && skalaMin >= skalaMaks) {
                newErrors.skala = 'Nilai minimum harus lebih kecil dari maksimum.';
            }
            if (!skalaLabelMin.trim()) newErrors.skalaLabelMin = 'Label minimum wajib diisi.';
            if (!skalaLabelMaks.trim()) newErrors.skalaLabelMaks = 'Label maksimum wajib diisi.';
        }

        if (['esai', 'essay_gambar', 'essay_audio'].includes(jenisSoal)) {
            if (!jawabanBenar.trim()) newErrors.jawabanBenar = 'Jawaban benar wajib diisi.';
        }

        return newErrors;
    };

    // Handle submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({
                title: 'Gagal menyimpan soal',
                description: Object.values(newErrors).join(' '),
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        // Convert frontend jenis_soal to backend format
        let backendJenisSoal = jenisSoal;
        if (jenisSoal.includes('_gambar') || jenisSoal.includes('_audio')) {
            if (jenisSoal.startsWith('pilihan_ganda')) {
                backendJenisSoal = 'pilihan_ganda';
            } else if (jenisSoal.startsWith('multi_choice')) {
                backendJenisSoal = 'multi_choice';
            } else if (jenisSoal.startsWith('essay')) {
                backendJenisSoal = jenisSoal; // Keep as is (essay_gambar, essay_audio)
            }
        }

        // Prepare data
        const payload: Record<string, string | number | boolean | null> = {
            title,
            pertanyaan,
            jenis_soal: backendJenisSoal,
            difficulty_level: difficultyLevel,
            skor,
            is_public: isPublic ? 1 : 0, // Convert boolean to 1/0 for Laravel
            kategori_tes_id: kategoriTesId && kategoriTesId !== 'none' ? parseInt(kategoriTesId) : null,
        };

        // Set tipe_jawaban based on jenis_soal
        if (jenisSoal === 'pilihan_ganda' || jenisSoal === 'pilihan_ganda_gambar' || jenisSoal === 'pilihan_ganda_audio') {
            payload.tipe_jawaban = 'single_choice';
            payload.opsi_a = opsi[0];
            payload.opsi_b = opsi[1];
            payload.opsi_c = opsi[2];
            payload.opsi_d = opsi[3];
            payload.jawaban_benar = jawabanBenar;
        } else if (jenisSoal === 'multi_choice' || jenisSoal === 'multi_choice_gambar' || jenisSoal === 'multi_choice_audio') {
            payload.tipe_jawaban = 'multi_choice';
            payload.opsi_a = opsi[0];
            payload.opsi_b = opsi[1];
            payload.opsi_c = opsi[2];
            payload.opsi_d = opsi[3];
            payload.jawaban_benar = jawabanBenarMulti.join(',');
        } else if (jenisSoal === 'esai') {
            payload.tipe_jawaban = 'essay';
            payload.jawaban_benar = jawabanBenar;
        } else if (jenisSoal === 'essay_gambar') {
            payload.tipe_jawaban = 'essay_gambar';
            payload.jawaban_benar = jawabanBenar;
        } else if (jenisSoal === 'essay_audio') {
            payload.tipe_jawaban = 'essay_audio';
            payload.jawaban_benar = jawabanBenar;
        } else if (jenisSoal === 'skala') {
            payload.tipe_jawaban = 'skala';
            payload.skala_min = skalaMin || 1;
            payload.skala_maks = skalaMaks || 5;
            payload.skala_label_min = skalaLabelMin;
            payload.skala_label_maks = skalaLabelMaks;
            payload.jawaban_benar = jawabanBenar;
        } else if (jenisSoal === 'equation') {
            payload.tipe_jawaban = 'equation';
            payload.equation = equation;
            payload.jawaban_benar = jawabanBenar;
        }

        // Handle file upload
        if (media) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, String(value));
                }
            });
            formData.append('media', media);

            router.post('/bank-soal', formData, {
                onSuccess: () => {
                    setLoading(false);
                    onClose();
                    resetForm();
                    toast({
                        title: 'Berhasil',
                        description: 'Soal berhasil ditambahkan ke bank soal!',
                    });
                },
                onError: (err) => {
                    setLoading(false);
                    toast({
                        title: 'Gagal menyimpan soal',
                        description: err && typeof err === 'object' ? Object.values(err).join(' ') : String(err),
                        variant: 'destructive',
                    });
                    if (err) setErrors(err);
                },
                preserveScroll: true,
                forceFormData: true,
            });
        } else {
            router.post('/bank-soal', payload, {
                onSuccess: () => {
                    setLoading(false);
                    onClose();
                    resetForm();
                    toast({
                        title: 'Berhasil',
                        description: 'Soal berhasil ditambahkan ke bank soal!',
                    });
                },
                onError: (err) => {
                    setLoading(false);
                    toast({
                        title: 'Gagal menyimpan soal',
                        description: err && typeof err === 'object' ? Object.values(err).join(' ') : String(err),
                        variant: 'destructive',
                    });
                    if (err) setErrors(err);
                },
                preserveScroll: true,
            });
        }
    };

    // Render opsi input untuk pilihan ganda
    const renderOpsiInput = () => {
        if (jenisSoal === 'pilihan_ganda' || jenisSoal === 'pilihan_ganda_gambar' || jenisSoal === 'pilihan_ganda_audio' ||
            jenisSoal === 'multi_choice' || jenisSoal === 'multi_choice_gambar' || jenisSoal === 'multi_choice_audio') {
            return (
                <div className="space-y-2">
                    <label className="mb-1 block font-medium">Opsi Jawaban</label>
                    {opsi.map((val, idx) => {
                        const key = String.fromCharCode(65 + idx);
                        const id = `jawaban-${idx}`;

                        return (
                            <div key={idx} className="flex items-center gap-2">
                                <label className="w-20">Opsi {key}</label>
                                <Input
                                    placeholder={`Opsi ${key}`}
                                    value={val}
                                    onChange={(e) => {
                                        const newOpsi = [...opsi];
                                        newOpsi[idx] = e.target.value;
                                        setOpsi(newOpsi);
                                    }}
                                />
                                {errors[`opsi_${idx}`] && <span className="ml-2 text-xs text-red-500">{errors[`opsi_${idx}`]}</span>}

                                {(jenisSoal === 'multi_choice' || jenisSoal === 'multi_choice_gambar' || jenisSoal === 'multi_choice_audio') ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            id={id}
                                            className="cursor-pointer"
                                            type="checkbox"
                                            checked={jawabanBenarMulti.includes(key)}
                                            onChange={() => {
                                                setJawabanBenarMulti(
                                                    jawabanBenarMulti.includes(key)
                                                        ? jawabanBenarMulti.filter((j) => j !== key)
                                                        : [...jawabanBenarMulti, key],
                                                );
                                            }}
                                        />
                                        <label htmlFor={id} className="cursor-pointer">
                                            Benar
                                        </label>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <input
                                            id={id}
                                            type="radio"
                                            name="jawaban_benar"
                                            checked={jawabanBenar === key}
                                            onChange={() => setJawabanBenar(key)}
                                            className="cursor-pointer"
                                        />
                                        <label htmlFor={id} className="cursor-pointer">
                                            Benar
                                        </label>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {(jenisSoal === 'pilihan_ganda' || jenisSoal === 'pilihan_ganda_gambar' || jenisSoal === 'pilihan_ganda_audio') && errors.jawabanBenar && (
                        <span className="text-xs text-red-500">{errors.jawabanBenar}</span>
                    )}
                    {(jenisSoal === 'multi_choice' || jenisSoal === 'multi_choice_gambar' || jenisSoal === 'multi_choice_audio') && errors.jawabanBenarMulti && (
                        <span className="text-xs text-red-500">{errors.jawabanBenarMulti}</span>
                    )}
                </div>
            );
        }
        return null;
    };

    // Render media input
    const renderMediaInput = () => {
        if (['pilihan_ganda_gambar', 'pilihan_ganda_audio', 'multi_choice_gambar', 'multi_choice_audio',
             'essay_gambar', 'essay_audio'].includes(jenisSoal)) {
            const isAudio = jenisSoal.includes('audio');
            return (
                <div>
                    <label className="mb-1 block font-medium">{isAudio ? 'Upload Audio' : 'Upload Gambar'}</label>
                    <Input type="file" accept={isAudio ? 'audio/*' : 'image/*'} onChange={(e) => setMedia(e.target.files?.[0] || null)} />
                </div>
            );
        }
        return null;
    };

    // Render skala input
    const renderSkalaInput = () => {
        if (jenisSoal === 'skala') {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block font-medium">Rentang Minimum</label>
                            <Select value={skalaMin !== undefined ? String(skalaMin) : undefined} onValueChange={(val) => setSkalaMin(Number(val))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih minimum" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1].map((val) => (
                                        <SelectItem key={val} value={String(val)}>
                                            {val}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="mb-1 block font-medium">Rentang Maksimum</label>
                            <Select
                                value={skalaMaks !== undefined ? String(skalaMaks) : undefined}
                                onValueChange={(val) => setSkalaMaks(Number(val))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih maksimum" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[...Array(10).keys()].slice(1).map((val) => (
                                        <SelectItem key={val + 1} value={String(val + 1)}>
                                            {val + 1}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block font-medium">Label Minimum</label>
                            <Input placeholder="Sangat Tidak Setuju" value={skalaLabelMin} onChange={(e) => setSkalaLabelMin(e.target.value)} />
                            {errors.skalaLabelMin && <span className="text-xs text-red-500">{errors.skalaLabelMin}</span>}
                        </div>
                        <div>
                            <label className="mb-1 block font-medium">Label Maksimum</label>
                            <Input placeholder="Sangat Setuju" value={skalaLabelMaks} onChange={(e) => setSkalaLabelMaks(e.target.value)} />
                            {errors.skalaLabelMaks && <span className="text-xs text-red-500">{errors.skalaLabelMaks}</span>}
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Render equation input
    const renderEquationInput = () => {
        if (jenisSoal === 'equation') {
            return (
                <div className="space-y-2">
                    <label className="mb-1 block font-medium">Equation (LaTeX/Math)</label>
                    <Textarea placeholder="Equation (LaTeX/Math)" value={equation} onChange={(e) => setEquation(e.target.value)} />

                    <label className="mt-2 mb-1 block font-medium">Preview LaTeX</label>
                    <div className="min-h-[60px] w-full rounded-md border px-3 py-2 font-mono text-sm">
                        <BlockMath math={equation} errorColor="#cc0000" />
                    </div>
                </div>
            );
        }
        return null;
    };

    // Render input jawaban benar untuk essay
    const renderEssayJawabanInput = () => {
        if (['esai', 'essay_gambar', 'essay_audio', 'skala', 'equation'].includes(jenisSoal)) {
            return (
                <div>
                    <label className="mb-1 block font-medium">Jawaban Benar (Kunci)</label>
                    <Textarea placeholder="Jawaban benar/kunci" value={jawabanBenar} onChange={(e) => setJawabanBenar(e.target.value)} />
                    {errors.jawabanBenar && <span className="text-xs text-red-500">{errors.jawabanBenar}</span>}
                </div>
            );
        }
        return null;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] w-full overflow-y-auto rounded-lg border bg-background text-foreground shadow-xl sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Tambah Soal ke Bank Soal</DialogTitle>
                    <DialogDescription>
                        Buat soal baru untuk ditambahkan ke koleksi bank soal Anda
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="mb-1 block font-medium">Judul Soal</label>
                                <Input placeholder="Judul soal" value={title} onChange={(e) => setTitle(e.target.value)} required />
                                {errors.title && <span className="text-xs text-red-500">{errors.title}</span>}
                            </div>

                            {/* Jenis Soal */}
                            <div>
                                <label className="mb-1 block font-medium">Jenis Soal</label>
                                <Select value={jenisSoal} onValueChange={setJenisSoal}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Jenis Soal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SOAL_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.jenisSoal && <span className="text-xs text-red-500">{errors.jenisSoal}</span>}
                            </div>

                            {/* Difficulty */}
                            <div>
                                <label className="mb-1 block font-medium">Tingkat Kesulitan</label>
                                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
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
                                {errors.difficultyLevel && <span className="text-xs text-red-500">{errors.difficultyLevel}</span>}
                            </div>

                            {/* Skor */}
                            <div>
                                <label className="mb-1 block font-medium">Skor</label>
                                <Input type="number" min={1} value={skor} onChange={(e) => setSkor(Number(e.target.value))} placeholder="Skor" required />
                                {errors.skor && <span className="text-xs text-red-500">{errors.skor}</span>}
                            </div>

                            {/* Kategori */}
                            <div>
                                <label className="mb-1 block font-medium">Kategori</label>
                                <Select value={kategoriTesId} onValueChange={setKategoriTesId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori (opsional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tanpa Kategori</SelectItem>
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
                                <Switch id="is_public" checked={isPublic} onCheckedChange={setIsPublic} />
                                <label htmlFor="is_public" className="font-medium">Jadikan soal ini public</label>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* Pertanyaan */}
                            <div>
                                <label className="mb-1 block font-medium">Pertanyaan</label>
                                <RichTextEditor value={pertanyaan} onChange={setPertanyaan} />
                                {errors.pertanyaan && <span className="text-xs text-red-500">{errors.pertanyaan}</span>}
                            </div>

                            {renderOpsiInput()}
                            {renderEssayJawabanInput()}
                            {renderMediaInput()}
                            {renderSkalaInput()}
                            {renderEquationInput()}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { onClose(); resetForm(); }} disabled={loading} className="cursor-pointer">
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading} className="cursor-pointer">
                            {loading ? 'Menyimpan...' : 'Simpan Soal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
