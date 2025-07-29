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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Head, router } from '@inertiajs/react';
import 'katex/dist/katex.min.css';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BlockMath } from 'react-katex';

interface Soal {
    id: number;
    pertanyaan: string;
    jenis_soal: 'pilihan_ganda' | 'multi_choice' | 'esai' | 'essay_gambar' | 'essay_audio' | 'skala' | 'equation';
    opsi_a?: string;
    opsi_b?: string;
    opsi_c?: string;
    opsi_d?: string;
    media?: string;
    skala_min?: number;
    skala_maks?: number;
    skala_label_min?: string;
    skala_label_maks?: string;
    equation?: string;
}

interface Props {
    jadwal: {
        id: number;
        nama_jadwal: string;
        durasi: number | null;
    };
    soal: Soal[];
}

const renderMedia = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();

    if (!ext) return null;

    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        return (
            <div className="my-3">
                <Label className="mb-2 block text-sm font-medium">Gambar Pendukung</Label>
                <img src={`/storage/${url}`} alt="Gambar Soal" className="h-auto max-h-60 w-auto rounded-md shadow-sm md:max-w-xl" />
            </div>
        );
    }

    if (['mp3', 'ogg', 'wav', 'm4a'].includes(ext)) {
        return (
            <div className="my-3">
                <Label className="mb-2 block text-sm font-medium">Audio Pendukung</Label>
                <audio controls src={`/storage/${url}`} className="w-full max-w-sm" />
            </div>
        );
    }

    return null;
};

export default function SoalTes({ jadwal, soal }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [jawaban, setJawaban] = useState<Record<number, string[]>>({});
    const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);

    const durasiMenit = jadwal.durasi || 60;
    const [timeLeft, setTimeLeft] = useState(durasiMenit * 60); // konversi ke detik

    useEffect(() => {
        if (soal.length === 0) return;

        if (timeLeft <= 0) {
            setShowTimeoutDialog(true);
            return;
        }
        const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, soal]);

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const renderOpsi = (s: Soal) => {
        const opsi = [
            { label: 'A', text: s.opsi_a },
            { label: 'B', text: s.opsi_b },
            { label: 'C', text: s.opsi_c },
            { label: 'D', text: s.opsi_d },
        ].filter((o) => o.text !== undefined);

        if (s.jenis_soal === 'pilihan_ganda') {
            return (
                <div>
                    {s.media && renderMedia(s.media)}

                    <RadioGroup
                        className="mt-4 space-y-2"
                        value={jawaban[s.id]?.[0] || ''}
                        onValueChange={(val) => setJawaban({ ...jawaban, [s.id]: [val] })}
                    >
                        {opsi.map((o, i) => (
                            <div key={i} className="flex items-center space-x-2">
                                <RadioGroupItem value={o.label} id={`soal_${s.id}_${o.label}`} />
                                <Label htmlFor={`soal_${s.id}_${o.label}`}>
                                    {o.label}. {o.text}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            );
        }

        if (s.jenis_soal === 'multi_choice') {
            return (
                <div className="mt-4 space-y-4">
                    {opsi.map((o, i) => {
                        const selected = jawaban[s.id] || [];
                        return (
                            <div key={i} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`soal_${s.id}_${o.label}`}
                                    checked={selected.includes(o.label)}
                                    onCheckedChange={(checked) => {
                                        const next = checked ? [...selected, o.label] : selected.filter((item) => item !== o.label);
                                        setJawaban({ ...jawaban, [s.id]: next });
                                    }}
                                />
                                <Label htmlFor={`soal_${s.id}_${o.label}`}>
                                    {o.label}. {o.text}
                                </Label>
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (['esai', 'essay_gambar', 'essay_audio'].includes(s.jenis_soal)) {
            return (
                <div className="mt-4 space-y-3">
                    {s.media && renderMedia(s.media)}
                    <div>
                        <Label htmlFor={`soal_${s.id}_essay`} className="mb-2 block text-sm font-medium">
                            Jawaban Anda
                        </Label>
                        <Textarea
                            id={`soal_${s.id}_essay`}
                            placeholder="Tulis jawaban Anda di sini..."
                            value={jawaban[s.id]?.[0] || ''}
                            onChange={(e) => setJawaban({ ...jawaban, [s.id]: [e.target.value] })}
                            className="min-h-[120px] resize-y"
                        />
                    </div>
                </div>
            );
        }

        if (s.jenis_soal === 'skala') {
            const skalaMin = s.skala_min ?? 1;
            const skalaMaks = s.skala_maks ?? 5;
            const labelMin = s.skala_label_min ?? 'Sangat Tidak Setuju';
            const labelMaks = s.skala_label_maks ?? 'Sangat Setuju';

            const range = Array.from({ length: skalaMaks - skalaMin + 1 }, (_, i) => skalaMin + i);

            return (
                <div className="mt-4">
                    <RadioGroup
                        value={jawaban[s.id]?.[0] || ''}
                        onValueChange={(val) => setJawaban({ ...jawaban, [s.id]: [val] })}
                        className="space-y-2"
                    >
                        {/* Grid Container */}
                        <div
                            className="grid items-center gap-y-2"
                            style={{
                                gridTemplateColumns: `auto repeat(${range.length}, minmax(0, 1fr)) auto`,
                            }}
                        >
                            {/* Label Min (left) */}
                            <div className="text-center text-sm">{labelMin}</div>

                            {/* Angka Skala */}
                            {range.map((val) => (
                                <div key={`angka_${val}`} className="text-center text-sm">
                                    {val}
                                </div>
                            ))}

                            {/* Label Max (right) */}
                            <div className="text-center text-sm">{labelMaks}</div>

                            {/* Spacer kiri */}
                            <div></div>

                            {/* Radio Items */}
                            {range.map((val) => (
                                <div key={`radio_${val}`} className="flex justify-center">
                                    <RadioGroupItem value={String(val)} id={`skala_${s.id}_${val}`} className="size-6 cursor-pointer md:size-8" />
                                </div>
                            ))}

                            {/* Spacer kanan */}
                            <div></div>
                        </div>
                    </RadioGroup>
                </div>
            );
        }

        if (s.jenis_soal === 'equation') {
            return (
                <div className="mt-4 space-y-4">
                    <div className="rounded-md border p-4">
                        <BlockMath math={s.equation} errorColor="#cc0000" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`soal_${s.id}_jawaban`} className="block font-medium">
                            Jawaban Anda
                        </Label>
                        <Textarea
                            id={`soal_${s.id}_jawaban`}
                            placeholder="Tulis jawaban Anda di sini..."
                            value={jawaban[s.id]?.[0] || ''}
                            onChange={(e) => setJawaban({ ...jawaban, [s.id]: [e.target.value] })}
                        />
                    </div>
                </div>
            );
        }

        return null;
    };

    const handleNext = () => {
        if (currentIndex < soal.length - 1) setCurrentIndex(currentIndex + 1);
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    const handleSubmit = () => {
        router.post(
            route('peserta.submit'),
            {
                jawaban,
                jadwal_id: jadwal.id,
            },
            {
                onSuccess: () => {
                    toast({
                        variant: 'success',
                        title: 'Tes Selesai',
                        description: 'Jawaban Anda berhasil dikirim.',
                    });
                    router.visit(route('peserta.riwayat'));
                },
                onError: (errors: Record<string, string>) => {
                    console.log(errors.error);
                    if (errors.error) {
                        toast({
                            variant: 'destructive',
                            title: 'Gagal Mengirim Tes',
                            description: errors.error,
                        });
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Terjadi kesalahan saat mengirim jawaban.',
                        });
                    }
                },
            },
        );
    };

    if (!soal.length) {
        return (
            <>
                <Head title="Soal Tes" />
                <div className="flex min-h-screen items-center justify-center">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-semibold">Soal belum tersedia</h2>
                        <p className="text-muted-foreground">Silakan kembali ke halaman sebelumnya atau hubungi pengawas.</p>
                        <Button onClick={() => router.visit('/daftar-tes')} className="mt-4 cursor-pointer">
                            Kembali
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    const currentSoal = soal[currentIndex];

    return (
        <>
            <Head title="Soal Tes" />
            <div className="flex min-h-screen">
                {/* Desktop Sidebar */}
                <div className="hidden w-64 border-r p-4 md:block">
                    <p className="mb-2 text-xl font-semibold">{jadwal.nama_jadwal}</p>
                    <div className="grid grid-cols-5 gap-2">
                        {soal.map((_, i) => (
                            <Button
                                key={i}
                                variant={currentIndex === i ? 'default' : 'outline'}
                                className="px-0 py-2"
                                onClick={() => setCurrentIndex(i)}
                            >
                                {i + 1}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Mobile Sidebar Sheet */}
                <Sheet>
                    <div className="absolute top-4 left-4 z-10 md:hidden">
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                    </div>
                    <SheetContent side="left" className="p-4">
                        <SheetHeader>
                            <SheetTitle className="text-2xl">{jadwal.nama_jadwal}</SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-5 gap-2 px-4">
                            {soal.map((_, i) => (
                                <Button
                                    key={i}
                                    variant={currentIndex === i ? 'default' : 'outline'}
                                    className="px-0 py-2"
                                    onClick={() => setCurrentIndex(i)}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Main Content */}
                <div className="mx-auto mt-4 flex-1 p-6 md:mt-0 md:max-w-4xl">
                    <div className="space-y-4 p-4">
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Soal ke {currentIndex + 1} dari {soal.length}
                                </p>
                                <div className="rounded-md bg-muted px-3 py-1.5">
                                    <p className="text-sm font-bold text-muted-foreground">{formatTime(timeLeft)}</p>
                                </div>
                            </div>

                            {/* <p className="text-lg font-semibold">{currentSoal.pertanyaan}</p> */}
                            <RichTextViewer content={currentSoal.pertanyaan} />

                            {renderOpsi(currentSoal)}
                        </div>

                        <div>
                            <div className="flex justify-between pt-6">
                                <Button onClick={handlePrev} disabled={currentIndex === 0} variant="outline">
                                    Sebelumnya
                                </Button>
                                {currentIndex === soal.length - 1 ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button>Selesaikan</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Yakin ingin mengumpulkan?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Pastikan semua soal telah dijawab. Jawaban yang dikumpulkan tidak bisa diubah.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction asChild>
                                                    <Button onClick={handleSubmit}>Kirim Jawaban</Button>
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <Button onClick={handleNext}>Selanjutnya</Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* timeout */}
            {showTimeoutDialog && (
                <AlertDialog open={showTimeoutDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Waktu Habis</AlertDialogTitle>
                            <AlertDialogDescription>
                                Waktu pengerjaan tes telah habis. Jawaban Anda akan dikirim secara otomatis.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction className="cursor-pointer" onClick={() => router.visit('/daftar-tes')}>
                                Kembali ke Daftar Tes
                            </AlertDialogAction>{' '}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
