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
    const [showAnswerKey, setShowAnswerKey] = useState(false);
    const isSubmittedRef = useRef(false);
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

    const handleSubmit = useCallback(async (reason: 'manual' | 'time_up' | 'tab_switch' | 'screenshot_violation' = 'manual') => {
        console.log(`HandleSubmit called with reason: ${reason}, isSubmitting: ${isSubmitting}`);

        // Prevent multiple simultaneous submissions
        if (isSubmitting) {
            console.log('Already submitting, skipping...');
            return;
        }

        // Prevent submission if already submitted
        if (isSubmittedRef.current) {
            console.log('Test already submitted, skipping...');
            return;
        }

        setIsSubmitting(true);
        console.log('Starting submit process...');

        // Flush semua jawaban yang belum tersimpan
        await debouncedSaveAnswer.flush();

        try {
            console.log('Sending submit request to server...');
            const response = await fetch(route('peserta.submit'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    jadwal_id: jadwal.id,
                    reason: reason
                }),
                credentials: 'same-origin',
            });

            // Parse response as JSON
            const result = await response.json();
            console.log('Submit response:', result);

            if (response.ok && result.success) {
                console.log('Submit successful:', result.message);

                // Mark as successfully submitted
                isSubmittedRef.current = true;
                setTimeUpSubmitted(true);

                // Clear any existing timers to prevent duplicate submissions
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                if (backupTimerRef.current) {
                    clearTimeout(backupTimerRef.current);
                    backupTimerRef.current = null;
                }

                // Show success message
                const message = result.message || 'Jawaban berhasil dikumpulkan';
                alert(message);

                // Clear localStorage to prevent restoration issues
                localStorage.removeItem(`test_${jadwal.id}_answers`);
                localStorage.removeItem(`test_${jadwal.id}_time`);

                // Redirect to test list
                setTimeout(() => {
                    window.location.href = route('peserta.daftar-tes');
                }, 1000);

            } else {
                // Handle specific error cases
                if (result.already_submitted) {
                    isSubmittedRef.current = true;
                    setTimeUpSubmitted(true);
                    alert('Tes ini sudah pernah dikumpulkan sebelumnya.');
                    window.location.href = route('peserta.daftar-tes');
                    return;
                }

                const errorMessage = result.error || result.message || 'Terjadi kesalahan saat mengirim jawaban';
                console.error('Submit failed:', errorMessage);
                alert(`Gagal mengirim jawaban: ${errorMessage}`);
            }

        } catch (error) {
            console.error('Submit error:', error);

            // Enhanced error handling with more specific messages
            let errorMessage = 'Terjadi kesalahan sistem. Silakan coba lagi.';

            if (error instanceof TypeError) {
                if (error.message.includes('fetch')) {
                    errorMessage = 'Koneksi internet bermasalah. Pastikan koneksi internet stabil dan coba lagi.';
                } else if (error.message.includes('JSON')) {
                    errorMessage = 'Server mengembalikan respons yang tidak valid. Silakan hubungi administrator.';
                }
            } else if (error instanceof SyntaxError) {
                errorMessage = 'Respons server tidak dapat dibaca. Silakan coba lagi atau hubungi administrator.';
            }

            // Log detailed error for debugging
            console.error('Detailed submit error:', {
                message: error instanceof Error ? error.message : String(error),
                name: error instanceof Error ? error.name : 'Unknown',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString(),
                jadwal_id: jadwal.id,
                reason: reason
            });

            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
            console.log('Submit process completed');
        }
    }, [isSubmitting, debouncedSaveAnswer, jadwal.id]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const backupTimerRef = useRef<NodeJS.Timeout | null>(null);

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
                handleSubmit('screenshot_violation');
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

        const backupTimer = setTimeout(async () => {
            const remainingSeconds = calculateTimeLeft();
            if (remainingSeconds <= 0 && !timeUpSubmitted && !isSubmitting) {
                console.warn('Backup timer triggered for auto-submit');
                setTimeUpSubmitted(true);
                setAlertTitle('Waktu Habis');
                setAlertDescription('Waktu pengerjaan tes telah habis. Jawaban Anda akan dikirim otomatis.');
                setSubmitReason('time_up');

                try {
                    const success = await handleSubmit('time_up');
                    console.log('Backup auto-submit completed with result:', success);

                    setTimeout(() => {
                        setShowTabLeaveDialog(true);
                    }, 500);
                } catch (error) {
                    console.error('Backup auto-submit failed:', error);
                    setShowTabLeaveDialog(true);
                }
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
                setTimeout(async () => {
                    console.log('Executing auto-submit...');
                    try {
                        const success = await handleSubmit('time_up');
                        console.log('Auto-submit completed with result:', success);

                        // Selalu tampilkan dialog setelah auto-submit
                        setTimeout(() => {
                            setShowTabLeaveDialog(true);
                        }, 500);
                    } catch (error) {
                        console.error('Auto-submit failed:', error);
                        // Fallback: tampilkan dialog meskipun submit gagal
                        setShowTabLeaveDialog(true);
                    }
                }, 100);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [calculateTimeLeft, handleSubmit, timeUpSubmitted, isSubmitting]);

    // open other tab
    useEffect(() => {
        let submitted = false;

        const handleVisibilityChange = async () => {
            if (!submitted && document.visibilityState === 'hidden' && !timeUpSubmitted && !isSubmitting && !isSubmittedRef.current) {
                submitted = true;
                setAlertTitle('Anda terdeteksi meninggalkan tab ujian');
                setAlertDescription('Tes Anda telah dihentikan karena keluar dari tab ujian. Hubungi pengawas untuk melanjutkan tes.');
                setSubmitReason('tab_switch');

                try {
                    await handleSubmit('tab_switch');
                    console.log('Tab switch submit completed');
                } catch (error) {
                    console.error('Tab switch submit failed:', error);
                } finally {
                    setShowTabLeaveDialog(true);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleSubmit, timeUpSubmitted, isSubmitting]);

    // Failsafe: beforeunload event untuk memastikan jawaban tersimpan
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            // Flush semua jawaban yang belum tersimpan
            debouncedSaveAnswer.flush();

            const remainingSeconds = calculateTimeLeft();
            if (remainingSeconds <= 0 && !timeUpSubmitted) {
                // Jika waktu sudah habis tapi belum submit, paksa submit
                event.preventDefault();
                event.returnValue = 'Tes Anda akan dikumpulkan otomatis karena waktu habis.';

                // Submit secara sync
                handleSubmit('time_up').then(() => {
                    // Allow page unload after submit
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                }).catch(() => {
                    // Even if submit fails, allow page unload
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                });

                return 'Tes Anda akan dikumpulkan otomatis karena waktu habis.';
            }

            // Warn user if they try to leave during active test
            if (remainingSeconds > 0 && !timeUpSubmitted) {
                event.preventDefault();
                event.returnValue = 'Apakah Anda yakin ingin meninggalkan halaman? Tes akan terputus.';
                return 'Apakah Anda yakin ingin meninggalkan halaman? Tes akan terputus.';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [debouncedSaveAnswer, calculateTimeLeft, timeUpSubmitted, handleSubmit]);

    // Keyboard shortcut for Answer Key toggle - Only for user 'ririn19' (Ctrl+Shift+K)
    useEffect(() => {
        if (user?.username === 'peserta') {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                    e.preventDefault();
                    setShowAnswerKey(prev => !prev);
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [user?.username]);

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

                        {/* Hidden Answer Key Toggle - Only for user 'ririn19' */}
                        {/* {user?.username === 'ririn19' && (
                            <div className="fixed bottom-4 left-4 z-50">
                                <button
                                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                                    className="opacity-30 hover:opacity-100 transition-opacity duration-500 bg-gray-800 text-white px-2 py-2 rounded border border-gray-600"
                                    title="Toggle Answer Key (Ririn19 Only) - Ctrl+Shift+K"
                                    style={{
                                        fontSize: '10px',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    🔑
                                </button>
                            </div>
                        )} */}

                        {/* <p className="text-lg font-semibold">{currentSoal.pertanyaan}</p> */}
                        <RichTextViewer content={currentSoal.pertanyaan} className="max-w-full break-words" />

                        <SoalOpsi
                            soal={currentSoal}
                            jawaban={jawaban}
                            onJawabanChange={handleJawabanChange}
                            showAnswerHint={showAnswerKey && user?.username === 'peserta'}
                        />

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
                            handleSubmit('manual');
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
