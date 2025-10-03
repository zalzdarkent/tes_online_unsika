import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AntiScreenshot from '@/components/anti-screenshot';
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

export default function SoalTes({ jadwal, soal, jawaban_tersimpan, end_time_timestamp, user }: PesertaTesPageProps) {
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
    const [submitReason, setSubmitReason] = useState<'manual' | 'tab_switch' | 'time_up' | 'screenshot_violation'>('manual');
    const [screenshotCount, setScreenshotCount] = useState(0);
    const [timeUpSubmitted, setTimeUpSubmitted] = useState(false);

    const lastSavedAnswersRef = useRef<Record<number, string>>({});

    const calculateTimeLeft = useCallback(() => {
        const now = Date.now();
        const serverEndTime = end_time_timestamp * 1000;
        const remainingMs = Math.max(0, serverEndTime - now);
        const remainingSeconds = Math.floor(remainingMs / 1000);

        // Log setiap 10 detik untuk debugging saat waktu menipis
        if (remainingSeconds <= 60 && remainingSeconds % 10 === 0) {
            console.log(`Time calculation - Now: ${new Date(now).toLocaleTimeString()}, End: ${new Date(serverEndTime).toLocaleTimeString()}, Remaining: ${remainingSeconds}s`);
        }

        return remainingSeconds;
    }, [end_time_timestamp]);

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

    const currentSoal = soal[currentIndex];

    // Debug log untuk tracking screenshot violations
    useEffect(() => {
        if (screenshotCount > 0) {
            console.log(`Current screenshot violations count: ${screenshotCount}`);
        }
    }, [screenshotCount]);

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

    const handleSubmit = useCallback(async (redirect = false, reason = 'manual') => {
        console.log(`HandleSubmit called with reason: ${reason}, redirect: ${redirect}, isSubmitting: ${isSubmitting}`);

        if (isSubmitting) {
            console.log('Already submitting, skipping...');
            return;
        }

        setIsSubmitting(true);
        console.log('Starting submit process...');

        await debouncedSaveAnswer.flush();

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        try {
            console.log('Sending submit request to server...');
            const response = await fetch(route('peserta.submit'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    jadwal_id: jadwal.id,
                    redirect,
                    reason,
                }),
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('Submit request successful');
            console.log('Jawaban berhasil dikumpulkan');

            if (redirect) {
                router.visit('/peserta/riwayat');

                toast({
                    variant: 'success',
                    title: 'Tes Selesai',
                    description: 'Jawaban Anda berhasil dikumpulkan.',
                });
            }
        } catch (error) {
            console.error('Submit request failed:', error);
            toast({
                variant: 'destructive',
                title: 'Terjadi kesalahan!',
                description: 'Gagal menyimpan jawaban. Silakan coba lagi.',
            });

            // Jika ini auto-submit karena waktu habis, tetap tampilkan dialog
            if (reason === 'time_up') {
                console.log('Auto-submit failed but showing dialog anyway');
                setTimeout(() => setShowTabLeaveDialog(true), 1000);
            }
        } finally {
            setIsSubmitting(false);
            console.log('Submit process completed');
        }
    }, [isSubmitting, debouncedSaveAnswer, jadwal.id]);

    const handleScreenshotDetected = useCallback((violationType: string, detectionMethod: string) => {
        setScreenshotCount(prev => {
            const newCount = prev + 1;

            console.log('Screenshot violation detected:', {
                type: violationType,
                method: detectionMethod,
                count: newCount,
                jadwalId: jadwal.id,
                userId: user.id
            });

            // Jika sudah 3 kali pelanggaran, otomatis submit
            if (newCount >= 3) {
                setAlertTitle('Pelanggaran Berulang Terdeteksi');
                setAlertDescription('Anda telah melakukan pelanggaran screenshot sebanyak 3 kali. Tes akan dihentikan secara otomatis.');
                setSubmitReason('screenshot_violation');
                handleSubmit(false, 'screenshot_violation');
                setShowTabLeaveDialog(true);
            } else {
                toast({
                    variant: 'destructive',
                    title: `Pelanggaran Screenshot ${newCount}/3`,
                    description: `Peringatan: ${violationType} terdeteksi via ${detectionMethod}. Jika mencapai 3 kali, tes akan dihentikan otomatis.`,
                });

                // Log untuk debugging
                console.warn(`Screenshot violation detected. Count: ${newCount}/3`);
            }

            return newCount;
        });
    }, [handleSubmit, jadwal.id, user.id]);

    // Failsafe: Backup timer untuk auto-submit jika countdown utama gagal
    useEffect(() => {
        const timeToEnd = calculateTimeLeft();
        if (timeToEnd <= 0) return; // Jika sudah habis, tidak perlu backup timer

        const backupTimer = setTimeout(() => {
            const remainingSeconds = calculateTimeLeft();
            if (remainingSeconds <= 0 && !timeUpSubmitted && !isSubmitting) {
                console.warn('Backup timer triggered for auto-submit');
                setTimeUpSubmitted(true);
                setAlertTitle('Waktu Habis');
                setAlertDescription('Waktu pengerjaan tes telah habis. Jawaban Anda akan dikirim otomatis.');
                setSubmitReason('time_up');

                handleSubmit(false, 'time_up').then(() => {
                    setShowTabLeaveDialog(true);
                });
            }
        }, (timeToEnd + 5) * 1000); // 5 detik setelah waktu habis

        return () => clearTimeout(backupTimer);
    }, [calculateTimeLeft, handleSubmit, timeUpSubmitted, isSubmitting]);

    // countdown
    useEffect(() => {
        const interval = setInterval(() => {
            const remainingSeconds = calculateTimeLeft();
            setTimeLeft(remainingSeconds);

            // Log setiap menit untuk debugging
            if (remainingSeconds > 0 && remainingSeconds % 60 === 0) {
                console.log(`Time remaining: ${Math.floor(remainingSeconds / 60)} minutes`);
            }

            // Warning 1 menit sebelum habis
            if (remainingSeconds === 60) {
                toast({
                    variant: 'destructive',
                    title: 'Peringatan!',
                    description: 'Waktu tersisa 1 menit. Segera selesaikan tes Anda.',
                });
            }

            // Auto submit ketika waktu habis
            if (remainingSeconds <= 0 && !timeUpSubmitted && !isSubmitting) {
                console.log('Timer reached 0, triggering auto-submit...');
                setTimeUpSubmitted(true);
                setAlertTitle('Waktu Habis');
                setAlertDescription('Waktu pengerjaan tes telah habis. Jawaban Anda akan dikirim otomatis.');
                setSubmitReason('time_up');

                // Clear interval segera untuk mencegah multiple calls
                clearInterval(interval);

                // Submit dengan delay kecil untuk memastikan state terupdate
                setTimeout(() => {
                    console.log('Executing auto-submit...');
                    handleSubmit(false, 'time_up').then(() => {
                        console.log('Auto-submit completed, showing dialog...');
                        setShowTabLeaveDialog(true);
                    }).catch((error) => {
                        console.error('Auto-submit failed:', error);
                        // Fallback: tampilkan dialog meskipun submit gagal
                        setShowTabLeaveDialog(true);
                    });
                }, 100);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateTimeLeft, handleSubmit, timeUpSubmitted, isSubmitting]);

    // open other tab
    useEffect(() => {
        let submitted = false;

        const handleVisibilityChange = () => {
            if (!submitted && document.visibilityState === 'hidden') {
                submitted = true;
                setAlertTitle('Anda terdeteksi meninggalkan tab ujian');
                setAlertDescription('Tes Anda telah dihentikan karena keluar dari tab ujian. Hubungi pengawas untuk melanjutkan tes.');
                setSubmitReason('tab_switch');

                handleSubmit(false, 'tab_switch');
                setShowTabLeaveDialog(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleSubmit]);

    // Failsafe: beforeunload event untuk memastikan jawaban tersimpan
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            // Flush semua jawaban yang belum tersimpan
            debouncedSaveAnswer.flush();

            const remainingSeconds = calculateTimeLeft();
            if (remainingSeconds <= 0 && !timeUpSubmitted) {
                // Jika waktu sudah habis tapi belum submit, paksa submit
                event.preventDefault();
                event.returnValue = '';

                setTimeout(() => {
                    handleSubmit(false, 'time_up');
                }, 100);

                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [debouncedSaveAnswer, calculateTimeLeft, timeUpSubmitted, handleSubmit]);

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
            <AntiScreenshot
                onScreenshotDetected={handleScreenshotDetected}
                isActive={true}
                jadwalId={jadwal.id}
                pesertaId={user.id}
            />
            <div className="flex min-h-screen anti-screenshot no-copy content-protection" data-watermark={`${jadwal.nama_jadwal} - Peserta: ${jadwal.id}`}>
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
                <AlertDialog open={showTabLeaveDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            {(submitReason === 'tab_switch' || submitReason === 'screenshot_violation') && (
                                <AlertDialogCancel onClick={() => setShowTabLeaveDialog(false)}>
                                    Tutup
                                </AlertDialogCancel>
                            )}
                            <AlertDialogAction
                                onClick={() => {
                                    if (submitReason === 'tab_switch' || submitReason === 'screenshot_violation') {
                                        router.visit('/peserta/daftar-tes');
                                    } else {
                                        router.visit('/peserta/riwayat');
                                    }
                                }}
                            >
                                {(submitReason === 'tab_switch' || submitReason === 'screenshot_violation') ? 'Kembali ke Daftar Tes' : 'Lihat Riwayat'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}

// Note: Kode yang di-comment dibawah adalah implementasi SPA yang tidak digunakan
