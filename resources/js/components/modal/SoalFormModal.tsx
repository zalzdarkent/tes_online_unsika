import React, { useState } from 'react';
import RichTextEditor from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { router } from '@inertiajs/react';
import { DialogTrigger } from '@radix-ui/react-dialog';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

// Tipe data soal
interface SoalData {
    id?: number;
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
    equation?: string;
}

interface SoalFormModalProps {
    trigger: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
    idJadwal: number;
    mode?: 'create' | 'edit';
    soal?: SoalData; // Data soal untuk edit mode
}

// Tipe soal yang didukung
const SOAL_TYPES = [
    { value: 'single_choice', label: 'Multiple Choice (Satu Jawaban)' },
    { value: 'single_choice_gambar', label: 'Multiple Choice (Satu Jawaban) + Gambar' },
    { value: 'single_choice_audio', label: 'Multiple Choice (Satu Jawaban) + Audio' },
    { value: 'multi_choice', label: 'Multiple Choice (Banyak Jawaban)' },
    { value: 'multi_choice_gambar', label: 'Multiple Choice (Banyak Jawaban) + Gambar' },
    { value: 'multi_choice_audio', label: 'Multiple Choice (Banyak Jawaban) + Audio' },
    { value: 'essay', label: 'Essay' },
    { value: 'essay_gambar', label: 'Essay + Gambar' },
    { value: 'essay_audio', label: 'Essay + Audio' },
    { value: 'skala', label: 'Rentang Skala' },
    { value: 'equation', label: 'Equation' },
];

export default function SoalFormModal({
    trigger,
    open: externalOpen,
    onOpenChange: externalOnOpenChange,
    onSuccess,
    idJadwal,
    mode = 'create',
    soal
}: SoalFormModalProps) {
    const { toast } = useToast();
    const [internalOpen, setInternalOpen] = useState(false);

    // Use external open state if provided, otherwise use internal
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = externalOnOpenChange || setInternalOpen;
    const [loading, setLoading] = useState(false);
    const [tipeJawaban, setTipeJawaban] = useState('single_choice');
    const [pertanyaan, setPertanyaan] = useState('');
    const [opsi, setOpsi] = useState(['', '', '', '']);
    const [jawabanBenar, setJawabanBenar] = useState('');
    const [jawabanBenarMulti, setJawabanBenarMulti] = useState<string[]>([]);
    const [skor, setSkor] = useState(1);
    const [media, setMedia] = useState<File | null>(null);
    const [skalaMin, setSkalaMin] = useState<number | undefined>(undefined);
    const [skalaMaks, setSkalaMaks] = useState<number | undefined>(undefined);
    const [skalaLabelMin, setSkalaLabelMin] = useState('');
    const [skalaLabelMaks, setSkalaLabelMaks] = useState('');
    const [equation, setEquation] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form saat modal ditutup
    const resetForm = () => {
        setTipeJawaban('single_choice');
        setPertanyaan('');
        setOpsi(['', '', '', '']);
        setJawabanBenar('');
        setJawabanBenarMulti([]);
        setSkor(1);
        setMedia(null);
        setSkalaMin(undefined);
        setSkalaMaks(undefined);
        setSkalaLabelMin('');
        setSkalaLabelMaks('');
        setEquation('');
        setErrors({});
    };

    // Load data saat modal dibuka untuk edit
    React.useEffect(() => {
        if (open && mode === 'edit' && soal) {
            // Konversi jenis_soal database ke tipe UI
            let uiType = soal.jenis_soal;
            if (soal.jenis_soal === 'pilihan_ganda') {
                uiType = soal.media ? 'single_choice_gambar' : 'single_choice';
            } else if (soal.jenis_soal === 'multi_choice') {
                uiType = soal.media ? 'multi_choice_gambar' : 'multi_choice';
            } else if (soal.jenis_soal === 'esai') {
                uiType = soal.media ? 'essay_gambar' : 'essay';
            }

            setTipeJawaban(uiType);
            setPertanyaan(soal.pertanyaan);
            setSkor(soal.skor);

            // Load opsi jika ada
            if (soal.opsi_a || soal.opsi_b || soal.opsi_c || soal.opsi_d) {
                setOpsi([
                    soal.opsi_a || '',
                    soal.opsi_b || '',
                    soal.opsi_c || '',
                    soal.opsi_d || ''
                ]);
            }

            // Load jawaban benar
            if (soal.jenis_soal === 'multi_choice') {
                setJawabanBenarMulti(soal.jawaban_benar.split(','));
            } else {
                setJawabanBenar(soal.jawaban_benar);
            }

            // Load data skala
            if (soal.jenis_soal === 'skala') {
                setSkalaMin(soal.skala_min);
                setSkalaMaks(soal.skala_maks);
                setSkalaLabelMin(soal.skala_label_min || '');
                setSkalaLabelMaks(soal.skala_label_maks || '');
            }

            // Load equation
            if (soal.jenis_soal === 'equation') {
                setEquation(soal.equation || '');
            }
        } else if (open && mode === 'create') {
            resetForm();
        }
    }, [open, mode, soal]);

    // Handler submit
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!pertanyaan.trim()) newErrors.pertanyaan = 'Pertanyaan wajib diisi.';
        if (!skor || skor < 1) newErrors.skor = 'Skor minimal 1.';
        if (tipeJawaban.startsWith('single_choice')) {
            opsi.forEach((o, i) => {
                if (!o.trim()) newErrors[`opsi_${i}`] = `Opsi ${String.fromCharCode(65 + i)} wajib diisi.`;
            });
            if (!jawabanBenar) newErrors.jawabanBenar = 'Jawaban benar wajib dipilih.';
        }
        if (tipeJawaban.startsWith('multi_choice')) {
            opsi.forEach((o, i) => {
                if (!o.trim()) newErrors[`opsi_${i}`] = `Opsi ${String.fromCharCode(65 + i)} wajib diisi.`;
            });
            if (jawabanBenarMulti.length === 0) newErrors.jawabanBenarMulti = 'Pilih minimal satu jawaban benar.';
        }
        // Validasi untuk skala
        if (tipeJawaban === 'skala') {
            if (skalaMin !== undefined && skalaMaks !== undefined && skalaMin >= skalaMaks) {
                newErrors.skala = 'Nilai minimum harus lebih kecil dari maksimum.';
            }
            if (!skalaLabelMin.trim()) newErrors.skalaLabelMin = 'Label minimum wajib diisi.';
            if (!skalaLabelMaks.trim()) newErrors.skalaLabelMaks = 'Label maksimum wajib diisi.';
            if (!jawabanBenar.trim()) newErrors.jawabanBenar = 'Jawaban benar (nilai target) wajib diisi.';
            const jawabanBenarNum = Number(jawabanBenar);
            if (skalaMin !== undefined && skalaMaks !== undefined &&
                (isNaN(jawabanBenarNum) || jawabanBenarNum < skalaMin || jawabanBenarNum > skalaMaks)) {
                newErrors.jawabanBenar = `Jawaban benar harus berupa angka antara ${skalaMin} dan ${skalaMaks}.`;
            }
        }
        // Validasi wajib untuk essay
        if (tipeJawaban === 'essay' || tipeJawaban === 'essay_gambar' || tipeJawaban === 'essay_audio') {
            if (!jawabanBenar.trim()) newErrors.jawabanBenar = 'Jawaban benar wajib diisi.';
        }
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Tampilkan toast error validasi frontend
            toast({
                title: 'Gagal menyimpan soal',
                description: Object.values(newErrors).join(' '),
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        // Kirim data ke backend
        let formData: FormData | null = null;
        if (media) {
            formData = new FormData();
            formData.append('id_jadwal', String(idJadwal));
            formData.append(
                'jenis_soal',
                tipeJawaban.startsWith('single_choice')
                    ? 'pilihan_ganda'
                    : tipeJawaban.startsWith('multi_choice')
                      ? 'multi_choice'
                      : tipeJawaban === 'essay'
                        ? 'esai'
                        : tipeJawaban,
            );
            formData.append('pertanyaan', pertanyaan);
            formData.append('skor', String(skor));
            if (tipeJawaban === 'single_choice') {
                formData.append('opsi_a', opsi[0]);
                formData.append('opsi_b', opsi[1]);
                formData.append('opsi_c', opsi[2]);
                formData.append('opsi_d', opsi[3]);
                formData.append('jawaban_benar', jawabanBenar);
            }
            if (tipeJawaban === 'multi_choice') {
                formData.append('opsi_a', opsi[0]);
                formData.append('opsi_b', opsi[1]);
                formData.append('opsi_c', opsi[2]);
                formData.append('opsi_d', opsi[3]);
                formData.append('jawaban_benar', jawabanBenarMulti.join(','));
            }
            if (tipeJawaban === 'multi_choice_gambar') {
                formData.append('opsi_a', opsi[0]);
                formData.append('opsi_b', opsi[1]);
                formData.append('opsi_c', opsi[2]);
                formData.append('opsi_d', opsi[3]);
                formData.append('jawaban_benar', jawabanBenarMulti.join(','));
            }
            if (tipeJawaban === 'single_choice_gambar') {
                formData.append('opsi_a', opsi[0]);
                formData.append('opsi_b', opsi[1]);
                formData.append('opsi_c', opsi[2]);
                formData.append('opsi_d', opsi[3]);
                formData.append('jawaban_benar', jawabanBenar);
            }

            if (tipeJawaban === 'essay' || tipeJawaban === 'essay_gambar' || tipeJawaban === 'essay_audio') {
                formData.append('jawaban_benar', jawabanBenar);
            }
            if (tipeJawaban === 'skala') {
                formData.append('skala_min', String(skalaMin));
                formData.append('skala_maks', String(skalaMaks));
                formData.append('skala_label_min', skalaLabelMin);
                formData.append('skala_label_maks', skalaLabelMaks);
                formData.append('jawaban_benar', jawabanBenar);
            }
            if (tipeJawaban === 'equation') {
                formData.append('equation', equation);
                formData.append('jawaban_benar', jawabanBenar);
            }
            formData.append('media', media);

            // Determine route based on mode
            const route = mode === 'edit' && soal ? `/soal/${soal.id}` : `/jadwal/soal`;

            // Add _method field for Laravel to handle PUT request via POST
            if (mode === 'edit') {
                formData.append('_method', 'PUT');
            }

            // Tambahkan field lain sesuai kebutuhan
            router.post(route, formData, {
                onSuccess: () => {
                    setLoading(false);
                    setOpen(false);
                    resetForm();
                    toast({
                        title: 'Berhasil',
                        description: mode === 'edit' ? 'Soal berhasil diperbarui!' : 'Soal berhasil ditambahkan!',
                    });
                    if (onSuccess) onSuccess();
                },
                onError: (err) => {
                    setLoading(false);
                    // Tampilkan toast error dari backend
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
            const payload = {
                id_jadwal: idJadwal,
                jenis_soal: tipeJawaban.startsWith('single_choice')
                    ? 'pilihan_ganda'
                    : tipeJawaban.startsWith('multi_choice')
                      ? 'multi_choice'
                      : tipeJawaban === 'essay'
                        ? 'esai'
                        : tipeJawaban,
                pertanyaan,
                skor,
            } as Record<string, string | number>;
            if (tipeJawaban === 'single_choice') {
                payload.opsi_a = opsi[0];
                payload.opsi_b = opsi[1];
                payload.opsi_c = opsi[2];
                payload.opsi_d = opsi[3];
                payload.jawaban_benar = jawabanBenar;
            }
            if (tipeJawaban === 'single_choice_gambar') {
                payload.opsi_a = opsi[0];
                payload.opsi_b = opsi[1];
                payload.opsi_c = opsi[2];
                payload.opsi_d = opsi[3];
                payload.jawaban_benar = jawabanBenar;
            }

            if (tipeJawaban === 'multi_choice') {
                payload.opsi_a = opsi[0];
                payload.opsi_b = opsi[1];
                payload.opsi_c = opsi[2];
                payload.opsi_d = opsi[3];
                payload.jawaban_benar = jawabanBenarMulti.join(',');
            }
            if (tipeJawaban === 'multi_choice_gambar') {
                payload.opsi_a = opsi[0];
                payload.opsi_b = opsi[1];
                payload.opsi_c = opsi[2];
                payload.opsi_d = opsi[3];
                payload.jawaban_benar = jawabanBenarMulti.join(',');
            }
            if (tipeJawaban === 'essay' || tipeJawaban === 'essay_gambar' || tipeJawaban === 'essay_audio') {
                payload.jawaban_benar = jawabanBenar;
            }
            if (tipeJawaban === 'skala') {
                if (skalaMin !== undefined) payload.skala_min = skalaMin;
                if (skalaMaks !== undefined) payload.skala_maks = skalaMaks;
                payload.skala_label_min = skalaLabelMin;
                payload.skala_label_maks = skalaLabelMaks;
                payload.jawaban_benar = jawabanBenar;
            }
            if (tipeJawaban === 'equation') {
                payload.equation = equation;
                payload.jawaban_benar = jawabanBenar;
            }
            // Tambahkan field lain sesuai kebutuhan

            // Determine route based on mode
            const route = mode === 'edit' && soal ? `/soal/${soal.id}` : `/jadwal/soal`;
            const method = mode === 'edit' ? 'put' : 'post';

            router[method](route, payload, {
                onSuccess: () => {
                    setLoading(false);
                    setOpen(false);
                    resetForm();
                    toast({
                        title: 'Berhasil',
                        description: mode === 'edit' ? 'Soal berhasil diperbarui!' : 'Soal berhasil ditambahkan!',
                    });
                    if (onSuccess) onSuccess();
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

    // Render opsi input sesuai tipe soal
    const renderOpsiInput = () => {
        if (tipeJawaban.startsWith('single_choice') || tipeJawaban.startsWith('multi_choice')) {
            return (
                <div className="space-y-2">
                    <label className="mb-1 block font-medium">Opsi Jawaban</label>
                    {opsi.map((val, idx) => {
                        const id = `jawaban-${idx}`;
                        const key = String.fromCharCode(65 + idx);

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

                                {tipeJawaban.startsWith('multi_choice') ? (
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
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    setJawabanBenarMulti(
                                                        jawabanBenarMulti.includes(key)
                                                            ? jawabanBenarMulti.filter((j) => j !== key)
                                                            : [...jawabanBenarMulti, key],
                                                    );
                                                }
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
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    setJawabanBenar(key);
                                                }
                                            }}
                                        />
                                        <label htmlFor={id} className="cursor-pointer">
                                            Benar
                                        </label>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {tipeJawaban.startsWith('single_choice') && errors.jawabanBenar && (
                        <span className="text-xs text-red-500">{errors.jawabanBenar}</span>
                    )}
                    {tipeJawaban.startsWith('multi_choice') && errors.jawabanBenarMulti && (
                        <span className="text-xs text-red-500">{errors.jawabanBenarMulti}</span>
                    )}
                </div>
            );
        }
        return null;
    };

    // Render upload media jika ada gambar/audio
    const renderMediaInput = () => {
        const withMedia = ['essay_gambar', 'essay_audio', 'single_choice_gambar', 'single_choice_audio', 'multi_choice_gambar', 'multi_choice_audio'];

        if (withMedia.includes(tipeJawaban)) {
            const isAudio = tipeJawaban.endsWith('_audio');
            return (
                <div>
                    <label className="mb-1 block font-medium">{isAudio ? 'Upload Audio' : 'Upload Gambar'}</label>
                    <Input type="file" accept={isAudio ? 'audio/*' : 'image/*'} onChange={(e) => setMedia(e.target.files?.[0] || null)} />
                </div>
            );
        }
        return null;
    };

    // Render skala
    const renderSkalaInput = () => {
        if (tipeJawaban === 'skala') {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Skala Minimum */}
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
                            {errors.skala && <span className="text-xs text-red-500">{errors.skala}</span>}
                            <div className="mt-1 text-xs text-gray-500">Minimum 0</div>
                        </div>

                        {/* Skala Maksimum */}
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
                            <div className="mt-1 text-xs text-gray-500">Maksimal 10</div>
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
                    <div>
                        <label className="mb-1 block font-medium">Nilai Jawaban Benar (dalam rentang)</label>
                        <Input
                            type="number"
                            min={skalaMin}
                            max={skalaMaks}
                            value={jawabanBenar}
                            onChange={(e) => setJawabanBenar(e.target.value)}
                            placeholder={`Nilai antara ${skalaMin} sampai ${skalaMaks}`}
                        />
                        {errors.jawabanBenar && <span className="text-xs text-red-500">{errors.jawabanBenar}</span>}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Render equation
    const renderEquationInput = () => {
        if (tipeJawaban === 'equation') {
            return (
                <div className="space-y-2">
                    <label className="mb-1 block font-medium">Equation (LaTeX/Math)</label>
                    <Textarea placeholder="Equation (LaTeX/Math)" value={equation} onChange={(e) => setEquation(e.target.value)} />

                    <label className="mt-2 mb-1 block font-medium">Preview LaTeX</label>
                    <div className="min-h-[60px] w-full rounded-md border px-3 py-2 font-mono text-sm">
                        <BlockMath math={equation} errorColor="#cc0000" />
                    </div>

                    <label className="mb-1 block font-medium">Jawaban Benar (Kunci)</label>
                    <Textarea placeholder="Jawaban benar/kunci" value={jawabanBenar} onChange={(e) => setJawabanBenar(e.target.value)} />
                    {errors.jawabanBenar && <span className="text-xs text-red-500">{errors.jawabanBenar}</span>}
                </div>
            );
        }
        return null;
    };

    // Render input jawaban benar untuk essay
    const renderEssayJawabanInput = () => {
        if (tipeJawaban === 'essay' || tipeJawaban === 'essay_gambar' || tipeJawaban === 'essay_audio') {
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-background text-foreground shadow-xl sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Edit Soal' : 'Tambah Soal'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block font-medium">Tipe Soal</label>
                        <Select value={tipeJawaban} onValueChange={setTipeJawaban}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Tipe Soal" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="max-h-60 overflow-y-auto">
                                    {SOAL_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="mb-1 block font-medium">Pertanyaan</label>
                        {/* <Textarea placeholder="Pertanyaan" value={pertanyaan} onChange={(e) => setPertanyaan(e.target.value)} required /> */}
                        <RichTextEditor value={pertanyaan} onChange={setPertanyaan} />
                        {errors.pertanyaan && <span className="text-xs text-red-500">{errors.pertanyaan}</span>}
                    </div>

                    {renderOpsiInput()}
                    {renderEssayJawabanInput()}
                    {renderMediaInput()}
                    {renderSkalaInput()}
                    {renderEquationInput()}
                    <div>
                        <label className="mb-1 block font-medium">Skor</label>
                        <Input type="number" min={1} value={skor} onChange={(e) => setSkor(Number(e.target.value))} placeholder="Skor" required />
                        {errors.skor && <span className="text-xs text-red-500">{errors.skor}</span>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="cursor-pointer">
                            {loading ? 'Menyimpan...' : mode === 'edit' ? 'Update' : 'Simpan'}
                        </Button>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" onClick={resetForm} className="cursor-pointer">
                                Batal
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
