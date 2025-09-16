import { AlertDialogWrapper } from '@/components/modal/AlertDialogWrapper';
import RichTextViewer from '@/components/rich-text-viewer';
import { toast } from '@/hooks/use-toast';
import { PesertaTesPageProps } from '@/types/page-props/peserta-tes';
import { Head, router } from '@inertiajs/react';
import 'katex/dist/katex.min.css';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PrevFlagNextButtons from './PrevFlagNextButtons';
import SoalHeader from './SoalHeader';
import SoalOpsi from './SoalOpsi';
import SoalSidebar from './SoalSidebar';

export default function SoalTes({ jadwal, soal, jawaban_tersimpan, end_time_timestamp }: PesertaTesPageProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [tandaiSoal, setTandaiSoal] = useState<Record<number, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const lastSavedAnswersRef = useRef<Record<number, string>>({});

    const calculateTimeLeft = () => {
        const now = Date.now();
        const serverEndTime = end_time_timestamp * 1000;
        const remainingMs = Math.max(0, serverEndTime - now);
        return Math.floor(remainingMs / 1000);
    };

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

    const currentSoal = soal[currentIndex];

    const saveAnswer = useCallback(async (jadwalId: number, idSoal: number, jawaban: string[] | undefined) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        const finalJawaban = Array.isArray(jawaban) ? jawaban.join(',') : '';

        if (lastSavedAnswersRef.current[idSoal] === finalJawaban) return;

        const payload = {
            jadwal_id: jadwalId,
            id_soal: idSoal,
            jawaban: finalJawaban || null,
        };

        try {
            await fetch(route('peserta.save'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
                credentials: 'same-origin',
            });
            lastSavedAnswersRef.current[idSoal] = finalJawaban;

            console.log(`jawaban tersimpan | ${finalJawaban} | soal: ${idSoal}`);
        } catch {
            toast({
                variant: 'destructive',
                title: 'Terjadi kesalahan!',
                description: 'Gagal menyimpan jawaban. Silakan coba lagi.',
            });
        }
    }, []);

    const debouncedSaveAnswer = useMemo(() => debounce(saveAnswer, 500), [saveAnswer]);

    const handleSubmit = async (redirect = false) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        await debouncedSaveAnswer.flush();

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
                router.visit('/peserta/riwayat');

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
        } finally {
            setIsSubmitting(false);
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

                handleSubmit();
                setShowTabLeaveDialog(true);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [end_time_timestamp]);

    // open other tab
    // useEffect(() => {
    //     let submitted = false;

    //     const handleVisibilityChange = () => {
    //         if (!submitted && document.visibilityState === 'hidden') {
    //             submitted = true;
    //             setAlertTitle('Anda terdeteksi meninggalkan tab ujian');
    //             setAlertDescription('Anda tidak dapat melanjutkan tes ini. Semua jawaban telah dikumpulkan');

    //             handleSubmit();
    //             setShowTabLeaveDialog(true);
    //         }
    //     };

    //     document.addEventListener('visibilitychange', handleVisibilityChange);
    //     return () => {
    //         document.removeEventListener('visibilitychange', handleVisibilityChange);
    //     };
    // }, []);

    const handleJawabanChange = (soalId: number, newJawaban: string[]) => {
        setJawaban((prev) => ({
            ...prev,
            [soalId]: newJawaban,
        }));

        debouncedSaveAnswer(jadwal.id, soalId, newJawaban);
    };

    const handleNext = () => {
        if (currentIndex < soal.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

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
                />

                {/* Main Content */}
                <div className="mx-auto mt-4 flex-1 space-y-4 overflow-y-hidden p-8 md:mt-0 md:max-w-4xl">
                    <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
                        <SoalHeader currentIndex={currentIndex} totalSoal={soal.length} timeLeft={timeLeft} />

                        {/* <p className="text-lg font-semibold">{currentSoal.pertanyaan}</p> */}
                        <RichTextViewer content={currentSoal.pertanyaan} className="max-w-full break-words" />

                        <SoalOpsi soal={currentSoal} jawaban={jawaban} onJawabanChange={handleJawabanChange} />

                        {/* spacer */}
                        <div className="h-12"></div>
                    </div>

                    {/* buttons */}
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
                            handleSubmit(true);
                        }}
                    />
                </div>
            </div>

            {showTabLeaveDialog && (
                <AlertDialogWrapper
                    open={showTabLeaveDialog}
                    title={alertTitle}
                    description={alertDescription}
                    actionLabel="Keluar"
                    onAction={() => router.visit('/peserta/riwayat')}
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

// save answer and prevent debounce on mount
// useEffect(() => {
//     if (!hasInteractedRef.current) return;

//     const currentSoal = soal[currentIndex];
//     if (!currentSoal) return;

//     const jawabanSaatIni = jawaban[currentSoal.id];
//     if (!jawabanSaatIni || jawabanSaatIni.length === 0) return;

//     saveAnswerFetch(jadwal.id, currentSoal.id, jawabanSaatIni);
// }, [jawaban, currentIndex]);
