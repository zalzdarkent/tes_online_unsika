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
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Head, router } from '@inertiajs/react';
import 'katex/dist/katex.min.css';
import debounce from 'lodash/debounce';
import { Check, ChevronLeft, Flag, Menu } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
    start_time: string;
}

const numberNavigations = [
    {
        label: 'Sedang Dijawab',
        className: 'border-black bg-white text-black dark:border-white dark:bg-black dark:text-white text-sm',
    },
    {
        label: 'Sudah Dijawab',
        className:
            'border-green-500 bg-green-50 text-green-500 hover:bg-green-100 hover:text-green-500 dark:border-green-300 dark:bg-green-900 dark:text-green-300',
    },
    {
        label: 'Belum Dijawab',
        className: 'border',
    },
    {
        label: 'Ditandai',
        className: 'border-yellow-500 bg-yellow-100 text-yellow-700 dark:border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300',
    },
];

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

export default function SoalTes({ jadwal, soal, start_time }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [tandaiSoal, setTandaiSoal] = useState<Record<number, boolean>>({});
    const [jawaban, setJawaban] = useState<Record<number, string[]>>({});
    const [showTabLeaveDialog, setShowTabLeaveDialog] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertDescription, setAlertDescription] = useState('');

    const durasiMenit = jadwal.durasi || 60;
    const [timeLeft, setTimeLeft] = useState(() => {
        const start = new Date(start_time).getTime();
        const end = start + durasiMenit * 60 * 1000;
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        return remaining;
    });

    useEffect(() => {
        if (soal.length === 0 || timeLeft <= 0) return;

        // timeout
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setAlertTitle('Waktu Habis');
                    setAlertDescription('Waktu pengerjaan tes telah habis. Jawaban Anda akan dikirim otomatis.');
                    setShowTabLeaveDialog(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [soal, timeLeft]);

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
                        {opsi.map((o, i) => {
                            const isSelected = jawaban[s.id]?.[0] === o.label;
                            return (
                                <div
                                    key={i}
                                    onClick={() => setJawaban({ ...jawaban, [s.id]: [o.label] })}
                                    className={`flex cursor-pointer items-center space-x-2 rounded-md border p-3 transition-all hover:bg-muted/70 ${
                                        isSelected ? 'border-primary' : 'border-muted'
                                    }`}
                                >
                                    <RadioGroupItem value={o.label} id={`soal_${s.id}_${o.label}`} className="pointer-events-none" />
                                    <Label htmlFor={`soal_${s.id}_${o.label}`} className="cursor-pointer select-none">
                                        {o.label}. {o.text}
                                    </Label>
                                </div>
                            );
                        })}
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
                        {typeof s.equation === 'string' && <BlockMath math={s.equation} errorColor="#cc0000" />}
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

    // todo: add prefill
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveAnswer = useCallback(
        debounce((jadwalId: number, idSoal: number, jawaban: string[] | undefined) => {
            const finalJawaban = Array.isArray(jawaban) ? jawaban.join(',') : '';

            router.post(
                route('peserta.save'),
                {
                    jadwal_id: jadwalId,
                    id_soal: idSoal,
                    jawaban: finalJawaban,
                },

                {
                    preserveState: true,
                    preserveScroll: true,
                    only: [],
                    replace: true,
                    // onSuccess: () => {
                    //     console.log('success');
                    // },
                    onError: () => {
                        toast({
                            variant: 'destructive',
                            title: 'Terjadi kesalahan!',
                            description: 'Gagal menyimpan jawaban',
                        });
                    },
                },
            );
        }, 500),
        [],
    );

    const handleNext = () => {
        const currentSoal = soal[currentIndex];
        const jawabanSaatIni = jawaban[currentSoal.id];

        saveAnswer(jadwal.id, currentSoal.id, jawabanSaatIni);

        if (currentIndex < soal.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        const currentSoal = soal[currentIndex];
        const jawabanSaatIni = jawaban[currentSoal.id];

        saveAnswer(jadwal.id, currentSoal.id, jawabanSaatIni);

        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = () => {
        // save last answer
        const currentSoal = soal[currentIndex];
        const jawabanSaatIni = jawaban[currentSoal.id];
        saveAnswer(jadwal.id, currentSoal.id, jawabanSaatIni);

        saveAnswer.flush?.();

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
                },
                onError: (errors: Record<string, string>) => {
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

    const currentSoal = soal[currentIndex];

    // function showAlert(title: string, desc: string) {
    //     setAlertTitle(title);
    //     setAlertDescription(desc);
    //     setShowTabLeaveDialog(true);
    // }

    // useEffect(() => {
    //     // open other tab
    //     const handleVisibilityChange = () => {
    //         if (document.visibilityState === 'hidden') {
    //             showAlert('Anda terdeteksi meninggalkan tab ujian', 'awaban Anda akan dikirim otomatis.');
    //             // handleSubmit();
    //         }
    //     };

    //     // refresh
    //     const handlePageHide = () => {
    //         showAlert('refresh', 'test refresh.');
    //         // handleSubmit();
    //     };

    //     document.addEventListener('visibilitychange', handleVisibilityChange);
    //     window.addEventListener('pagehide', handlePageHide);

    //     return () => {
    //         document.removeEventListener('visibilitychange', handleVisibilityChange);
    //         window.removeEventListener('pagehide', handlePageHide);
    //     };
    // }, []);

    // cancel debounce when unmount
    useEffect(() => {
        return () => {
            saveAnswer.cancel();
        };
    }, []);

    function renderNavigation() {
        return (
            <>
                <div className="grid grid-cols-5 gap-2 pb-4">
                    {soal.map((s, i) => {
                        const isActive = currentIndex === i;
                        const isAnswered = (jawaban[s.id]?.[0] ?? '').trim() !== '';

                        let baseClass = 'px-0 py-2 text-sm';

                        if (isActive) {
                            baseClass += ' bg-white text-black border-2 border-black dark:bg-black dark:text-white dark:border-white';
                        } else if (tandaiSoal[s.id]) {
                            baseClass +=
                                ' border border-yellow-500 bg-yellow-50 text-yellow-500 hover:bg-yellow-100 hover:text-yellow-500 dark:text-yellow-300 dark:bg-yellow-900 dark:border-yellow-300';
                        } else if (isAnswered) {
                            baseClass +=
                                ' border border-green-500 bg-green-50 text-green-500 hover:bg-green-100 hover:text-green-500 dark:text-green-300 dark:bg-green-900 dark:border-green-300';
                        } else {
                            baseClass += ' border ';
                        }

                        return (
                            <Button key={i} variant="ghost" onClick={() => setCurrentIndex(i)} className={baseClass}>
                                {i + 1}
                            </Button>
                        );
                    })}
                </div>

                {numberNavigations.map((nav, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className={`size-5 rounded-sm border px-0 py-2 ${nav.className}`} />
                        <div className="text-sm">{nav.label}</div>
                    </div>
                ))}
                <Separator className="mt-4" />
                <div>
                    <p className="mb-1 font-semibold">Informasi Tes</p>
                    <div className="grid grid-cols-2 space-y-1 text-sm text-muted-foreground">
                        <div>Total Soal:</div>
                        <div className="text-right">{soal.length}</div>

                        <div>Terjawab:</div>
                        <div className="text-right">{Object.values(jawaban).filter((j) => (j?.[0] ?? '').trim() !== '').length}</div>

                        <div>Durasi:</div>
                        <div className="text-right">{jadwal?.durasi} menit</div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Soal Tes" />
            <div className="flex min-h-screen">
                {/* Desktop Sidebar */}
                <div className="hidden w-64 border-r p-4 md:block">
                    <h2 className="mb-2 text-xl font-semibold">{jadwal.nama_jadwal}</h2>
                    <div className="space-y-2">
                        <p className="font-semibold">Navigasi Soal</p>
                        {renderNavigation()}
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
                        {renderNavigation()}
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
                                <Button onClick={handlePrev} disabled={currentIndex === 0} variant="outline" className="cursor-pointer">
                                    <ChevronLeft />
                                    Sebelumnya
                                </Button>

                                <Button
                                    variant={tandaiSoal[currentSoal.id] ? 'default' : 'outline'}
                                    onClick={() =>
                                        setTandaiSoal((prev) => ({
                                            ...prev,
                                            [currentSoal.id]: !prev[currentSoal.id],
                                        }))
                                    }
                                >
                                    <Flag />
                                    {tandaiSoal[currentSoal.id] ? 'Hapus Tanda' : 'Tandai Soal'}
                                </Button>

                                {currentIndex === soal.length - 1 ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button>
                                                <Check />
                                                Selesaikan
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Yakin ingin mengumpulkan?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Pastikan semua soal telah dijawab. Jawaban yang dikumpulkan tidak bisa diubah.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
                                                <AlertDialogAction asChild>
                                                    <Button onClick={handleSubmit} className="cursor-pointer">
                                                        Kirim Jawaban
                                                    </Button>
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <Button variant="outline" onClick={handleNext}>
                                        Selanjutnya
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showTabLeaveDialog && (
                <AlertDialog open={showTabLeaveDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
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
