import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ScreenshotCombination {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    cmd?: boolean;
    win?: boolean;
}

interface AntiScreenshotProps {
    onScreenshotDetected?: (violationType: string, detectionMethod: string) => void;
    isActive?: boolean;
    jadwalId?: number;
    pesertaId?: number;
}

export default function AntiScreenshot({
    onScreenshotDetected,
    isActive = true,
    jadwalId,
    pesertaId
}: AntiScreenshotProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const detectionCountRef = useRef(0);

    const reportViolationToServer = useCallback(async (violationType: string, detectionMethod: string) => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        const browserInfo = {
            userAgent: navigator.userAgent,
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            language: navigator.language,
            platform: navigator.platform,
        };

        try {
            await fetch(route('peserta.report-violation'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    jadwal_id: jadwalId,
                    violation_type: violationType,
                    detection_method: detectionMethod,
                    browser_info: browserInfo,
                    violation_time: new Date().toISOString(),
                }),
                credentials: 'same-origin',
            });

            console.log('Violation reported to server successfully');
        } catch (error) {
            console.error('Failed to report violation to server:', error);
        }
    }, [jadwalId]);

    const handleScreenshotDetected = useCallback((violationType: string, detectionMethod: string) => {
        // Blur seluruh konten untuk mencegah screenshot
        if (overlayRef.current) {
            overlayRef.current.style.display = 'block';

            setTimeout(() => {
                if (overlayRef.current) {
                    overlayRef.current.style.display = 'none';
                }
            }, 3000);
        }

        // Report violation to server
        if (jadwalId && pesertaId) {
            reportViolationToServer(violationType, detectionMethod);
        }

        toast({
            variant: 'destructive',
            title: 'Pelanggaran Terdeteksi!',
            description: 'Aktivitas screenshot terdeteksi. Tindakan ini telah dicatat.',
        });

        // Callback untuk parent component
        if (onScreenshotDetected) {
            onScreenshotDetected(violationType, detectionMethod);
        }

        // Log pelanggaran (bisa dikirim ke server)
        console.warn('Screenshot attempt detected:', {
            type: violationType,
            method: detectionMethod,
            timestamp: new Date().toISOString()
        });
    }, [onScreenshotDetected, jadwalId, pesertaId, reportViolationToServer]);    useEffect(() => {
        if (!isActive) return;

        // Mendeteksi kombinasi tombol screenshot
        const handleKeyDown = (event: KeyboardEvent) => {
            // Deteksi khusus Windows + S dan Windows + Shift + S
            if (event.key === 's' || event.key === 'S') {
                if (event.metaKey || event.getModifierState('OS')) {
                    event.preventDefault();
                    event.stopPropagation();
                    const method = event.shiftKey ? 'windows_shift_s' : 'windows_s';
                    handleScreenshotDetected('snipping_tool', method);
                    return false;
                }
            }

            // Deteksi F12 dengan pesan khusus
            if (event.key === 'F12') {
                event.preventDefault();
                event.stopPropagation();
                toast({
                    variant: 'destructive',
                    title: 'Developer Tools Diblokir!',
                    description: 'Akses developer tools tidak diizinkan selama ujian.',
                });
                handleScreenshotDetected('developer_tools', 'f12_key');
                return false;
            }

            const screenshotCombinations = [
                // Windows screenshot combinations
                { key: 'PrintScreen' },
                { ctrl: true, shift: true, key: 'I' }, // Developer tools
                { ctrl: true, shift: true, key: 'C' }, // Inspect element
                { ctrl: true, shift: true, key: 'J' }, // Console
                { alt: true, key: 'PrintScreen' }, // Alt + Print Screen

                // Mac screenshot combinations
                { cmd: true, shift: true, key: '3' }, // Cmd + Shift + 3
                { cmd: true, shift: true, key: '4' }, // Cmd + Shift + 4
                { cmd: true, shift: true, key: '5' }, // Cmd + Shift + 5
                { cmd: true, shift: true, key: 'I' }, // Developer tools Mac
                { cmd: true, alt: true, key: 'I' }, // Developer tools Mac
            ];

            const isScreenshotAttempt = screenshotCombinations.some(combo => {
                const ctrlMatch = combo.ctrl ? event.ctrlKey : !event.ctrlKey;
                const shiftMatch = combo.shift ? event.shiftKey : !event.shiftKey;
                const altMatch = combo.alt ? event.altKey : !event.altKey;
                const cmdMatch = combo.cmd ? event.metaKey : !event.metaKey;

                return combo.key === event.key && ctrlMatch && shiftMatch && altMatch && cmdMatch;
            });

            if (isScreenshotAttempt) {
                event.preventDefault();
                event.stopPropagation();
                const combo = screenshotCombinations.find((combo: ScreenshotCombination) => {
                    const ctrlMatch = combo.ctrl ? event.ctrlKey : !event.ctrlKey;
                    const shiftMatch = combo.shift ? event.shiftKey : !event.shiftKey;
                    const altMatch = combo.alt ? event.altKey : !event.altKey;
                    const cmdMatch = combo.cmd ? event.metaKey : !event.metaKey;
                    return combo.key === event.key && ctrlMatch && shiftMatch && altMatch && cmdMatch;
                });
                const detectionMethod = combo ? `${combo.key}_combination` : 'unknown_key_combination';
                handleScreenshotDetected('screenshot_key_combination', detectionMethod);
                return false;
            }
        };

        // Mendeteksi right click untuk context menu
        const handleContextMenu = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            toast({
                variant: 'destructive',
                title: 'Aksi Tidak Diizinkan',
                description: 'Right click tidak diperbolehkan selama ujian.',
            });

            return false;
        };

        // Mendeteksi perubahan fokus window (mungkin karena screenshot tools)
        const handleBlur = () => {
            detectionCountRef.current += 1;

            if (detectionCountRef.current > 2) {
                handleScreenshotDetected('window_focus_change', 'blur_detection');
            }

            // Reset counter setelah 5 detik
            setTimeout(() => {
                detectionCountRef.current = 0;
            }, 5000);
        };

        // Mendeteksi resize window yang tidak normal
        const handleResize = () => {
            const suspiciousResize = window.outerWidth !== window.innerWidth + 16 ||
                                  window.outerHeight !== window.innerHeight + 39;

            if (suspiciousResize) {
                handleScreenshotDetected('window_resize', 'suspicious_resize');
            }
        };

        // Media query untuk mendeteksi screenshot di mobile
        const handleMediaChange = () => {
            if (window.matchMedia('print').matches) {
                handleScreenshotDetected('print_media', 'print_screen');
            }
        };

        const printMediaQuery = window.matchMedia('print');

        // Add event listeners
        document.addEventListener('keydown', handleKeyDown, { capture: true });
        document.addEventListener('contextmenu', handleContextMenu, { capture: true });
        window.addEventListener('blur', handleBlur);
        window.addEventListener('resize', handleResize);
        printMediaQuery.addEventListener('change', handleMediaChange);

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown, { capture: true });
            document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('resize', handleResize);
            printMediaQuery.removeEventListener('change', handleMediaChange);
        };
    }, [isActive, handleScreenshotDetected]);

    if (!isActive) return null;

    return (
        <>
            {/* Overlay untuk blur konten saat screenshot terdeteksi */}
            <div
                ref={overlayRef}
                className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center"
                style={{ display: 'none' }}
            >
                <div className="text-white text-center p-8">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Pelanggaran Terdeteksi</h2>
                    <p className="text-lg">Screenshot tidak diperbolehkan selama ujian</p>
                    <p className="text-sm mt-2 opacity-75">Tindakan ini telah dicatat</p>
                </div>
            </div>


        </>
    );
}
