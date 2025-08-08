import { AlertDialogWrapper } from '@/components/modal/AlertDialogWrapper';
import RichTextViewer from '@/components/rich-text-viewer';
import { toast } from '@/hooks/use-toast';
import { PesertaTesPageProps } from '@/types/page-props/peserta-tes';
import { Head, router } from '@inertiajs/react';
import 'katex/dist/katex.min.css';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useState } from 'react';
import PrevFlagNextButtons from './PrevFlagNextButtons';
import SoalHeader from './SoalHeader';
import SoalOpsi from './SoalOpsi';
import SoalSidebar from './SoalSidebar';

export default function SoalTes({ jadwal, soal, start_time }: PesertaTesPageProps) {
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

    // todo bug: kalo akses lewat URL, udah 00:00 ga kepental ke riwayat
    useEffect(() => {
        if (timeLeft <= 0) return;

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
                    onSuccess: () => {
                        console.log('jawaban berhasil terkirim');
                    },
                    onError: () => {
                        toast({
                            variant: 'destructive',
                            title: 'Terjadi kesalahan!',
                            description: 'Gagal menyimpan jawaban. Silakan coba lagi.',
                        });
                    },
                },
            );
        }, 500),
        [],
    );

    const handleAnswer = () => {
        const currentSoal = soal[currentIndex];
        const jawabanSaatIni = jawaban[currentSoal.id];

        saveAnswer(jadwal.id, currentSoal.id, jawabanSaatIni);
    };

    const handleNext = () => {
        handleAnswer();
        if (currentIndex < soal.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        handleAnswer();

        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = () => {
        handleAnswer();

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
                    durasi={jadwal.durasi || 60}
                    handleAnswer={handleAnswer}
                />

                {/* Main Content */}
                <div className="relative mx-auto mt-4 flex-1 space-y-4 p-8 md:mt-0 md:max-w-4xl">
                    <SoalHeader currentIndex={currentIndex} totalSoal={soal.length} timeLeft={timeLeft} />

                    {/* <p className="text-lg font-semibold">{currentSoal.pertanyaan}</p> */}
                    <RichTextViewer content={currentSoal.pertanyaan} />

                    <SoalOpsi soal={currentSoal} jawaban={jawaban} setJawaban={setJawaban} />

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
                                onSubmit={handleSubmit}
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
                    actionLabel="Kembali ke Daftar Tes"
                    onAction={() => router.visit('/daftar-tes')}
                />
            )}
        </>
    );
}
