import { AlertDialogWrapper } from '@/components/modal/AlertDialogWrapper';
import RichTextViewer from '@/components/rich-text-viewer';
import { toast } from '@/hooks/use-toast';
import { PesertaTesPageProps } from '@/types/page-props/peserta-tes';
import { Head, router } from '@inertiajs/react';
import 'katex/dist/katex.min.css';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import PrevFlagNextButtons from './PrevFlagNextButtons';
import SoalHeader from './SoalHeader';
import SoalOpsi from './SoalOpsi';
import SoalSidebar from './SoalSidebar';

export default function SoalTes({ jadwal, soal, jawaban_tersimpan, end_time_timestamp }: PesertaTesPageProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [tandaiSoal, setTandaiSoal] = useState<Record<number, boolean>>({});
    const [jawaban, setJawaban] = useState<Record<number, string[]>>(() => {
        const prefill: Record<number, string[]> = {};
        Object.entries(jawaban_tersimpan || {}).forEach(([soalId, ans]) => {
            prefill[Number(soalId)] = ans ? String(ans).split(',') : [];
        });
        return prefill;
    });

    const [showTabLeaveDialog, setShowTabLeaveDialog] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertDescription, setAlertDescription] = useState('');

    // prevent debounce pas baru di-mount
    const hasInteractedRef = useRef(false);

    const calculateTimeLeft = () => {
        const now = Date.now();
        const serverEndTime = end_time_timestamp * 1000;
        const remainingMs = Math.max(0, serverEndTime - now);
        return Math.floor(remainingMs / 1000);
    };

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

    const saveAnswerFetch = useCallback(
        debounce(async (jadwalId: number, idSoal: number, jawaban: string[] | undefined) => {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

            const finalJawaban = Array.isArray(jawaban) ? jawaban.join(',') : '';

            try {
                await fetch(route('peserta.save'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        jadwal_id: jadwalId,
                        id_soal: idSoal,
                        jawaban: finalJawaban || null,
                    }),
                    credentials: 'same-origin',
                });
                // todo: hapus kalo udah kelar
                console.log('Jawaban berhasil terkirim');
            } catch {
                toast({
                    variant: 'destructive',
                    title: 'Terjadi kesalahan!',
                    description: 'Gagal menyimpan jawaban. Silakan coba lagi.',
                });
            }
        }, 800),
        [],
    );

    const submitJawaban = async (redirect = false) => {
        saveAnswerFetch.flush();
        await new Promise((resolve) => setTimeout(resolve, 100));

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        try {
            await fetch(route('peserta.submit'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    jadwal_id: jadwal.id,
                    redirect,
                }),
                credentials: 'same-origin',
            });

            console.log('Jawaban berhasil dikumpulkan');
            if (redirect) {
                router.visit('/riwayat');

                toast({
                    variant: 'success',
                    title: 'Tes Selesai',
                    description: 'Jawaban Anda berhasil dikumpulkan.',
                });
            }
        } catch {
            toast({
                variant: 'destructive',
                title: 'Terjadi kesalahan!',
                description: 'Gagal menyimpan jawaban. Silakan coba lagi.',
            });
        }
    };

    // countdown
    useEffect(() => {
        const interval = setInterval(() => {
            const remainingSeconds = calculateTimeLeft();
            setTimeLeft(remainingSeconds);
            if (remainingSeconds <= 0) {
                setAlertTitle('Waktu Habis');
                setAlertDescription('Waktu pengerjaan tes telah habis. Jawaban Anda akan dikirim otomatis.');
                submitJawaban();
                setShowTabLeaveDialog(true);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [end_time_timestamp]);

    // save answer and prevent debounce on mount
    useEffect(() => {
        if (!hasInteractedRef.current) return;

        const currentSoal = soal[currentIndex];
        if (!currentSoal) return;

        const jawabanSaatIni = jawaban[currentSoal.id];

        saveAnswerFetch(jadwal.id, currentSoal.id, jawabanSaatIni);
        // saveAnswer(jadwal.id, currentSoal.id, jawabanSaatIni);
    }, [jawaban, currentIndex]);

    // open other tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setAlertTitle('Anda terdeteksi meninggalkan tab ujian');
                setAlertDescription('Anda tidak dapat melanjutkan tes ini. Semua jawaban telah dikumpulkan');
                submitJawaban();
                setShowTabLeaveDialog(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // const handleAnswer = () => {
    //     const currentSoal = soal[currentIndex];
    //     if (!currentSoal) return;

    //     const jawabanSaatIni = jawaban[currentSoal.id];

    //     saveAnswer(jadwal.id, currentSoal.id, jawabanSaatIni);
    // };

    const handleNext = () => {
        // handleAnswer();
        if (currentIndex < soal.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        // handleAnswer();
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = () => {
        // handleAnswer();

        saveAnswerFetch.flush();
        // saveAnswer.flush?.();

        router.post(
            route('peserta.submit'),
            {
                // jawaban,
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

    // cancel debounce when unmount
    useEffect(() => {
        return () => {
            saveAnswerFetch.cancel();
            // saveAnswer.cancel();
        };
    }, []);

    return (
        <>
            <Head title="Soal Tes" />
            <div className="flex min-h-screen">
                <SoalSidebar
                    jadwalNama={jadwal.nama_jadwal}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                    soal={soal}
                    jawaban={jawaban}
                    tandaiSoal={tandaiSoal}
                    durasi={jadwal.durasi}
                    // handleAnswer={handleAnswer}
                />

                {/* Main Content */}
                <div className="relative mx-auto mt-4 flex-1 space-y-4 overflow-x-auto p-8 md:mt-0 md:max-w-4xl">
                    <SoalHeader currentIndex={currentIndex} totalSoal={soal.length} timeLeft={timeLeft} />

                    {/* <p className="text-lg font-semibold">{currentSoal.pertanyaan}</p> */}
                    <RichTextViewer content={currentSoal.pertanyaan} />

                    <SoalOpsi soal={currentSoal} jawaban={jawaban} setJawaban={setJawaban} hasInteractedRef={hasInteractedRef} />

                    {/* spacer */}
                    <div className="h-16"></div>

                    <div className="fixed right-0 bottom-5 left-[var(--sidebar-width)] px-8 py-4 md:left-64">
                        <div className="mx-auto max-w-4xl">
                            <PrevFlagNextButtons
                                currentIndex={currentIndex}
                                soal={soal}
                                tandaiSoal={tandaiSoal}
                                onPrev={handlePrev}
                                onNext={handleNext}
                                onToggleFlag={() =>
                                    setTandaiSoal((prev) => ({
                                        ...prev,
                                        [soal[currentIndex].id]: !prev[soal[currentIndex].id],
                                    }))
                                }
                                onSubmit={() => {
                                    submitJawaban(true);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {showTabLeaveDialog && (
                <AlertDialogWrapper
                    open={showTabLeaveDialog}
                    title={alertTitle}
                    description={alertDescription}
                    actionLabel="Keluar"
                    onAction={() => router.visit('/riwayat')}
                />
            )}
        </>
    );
}

// save answer (SPA)
// eslint-disable-next-line react-hooks/exhaustive-deps
// const saveAnswer = useCallback(
//     debounce((jadwalId: number, idSoal: number, jawaban: string[] | undefined) => {
//         const finalJawaban = Array.isArray(jawaban) ? jawaban.join(',') : '';

//         router.post(
//             route('peserta.save'),
//             {
//                 jadwal_id: jadwalId,
//                 id_soal: idSoal,
//                 jawaban: finalJawaban,
//             },

//             {
//                 preserveState: true,
//                 preserveScroll: true,
//                 only: [],
//                 replace: true,
//                 onSuccess: () => {
//                     console.log('jawaban berhasil terkirim');
//                 },
//                 onError: () => {
//                     toast({
//                         variant: 'destructive',
//                         title: 'Terjadi kesalahan!',
//                         description: 'Gagal menyimpan jawaban. Silakan coba lagi.',
//                     });
//                 },
//             },
//         );
//     }, 1000),
//     [],
// );
