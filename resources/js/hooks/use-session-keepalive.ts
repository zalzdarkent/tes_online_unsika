import { useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface UseSessionKeepAliveOptions {
    /**
     * Interval waktu dalam milidetik untuk mengirim ping keep-alive
     * Default: 5 menit (300000ms)
     */
    interval?: number;

    /**
     * Apakah keep-alive aktif atau tidak
     * Default: true
     */
    enabled?: boolean;

    /**
     * URL endpoint untuk ping keep-alive
     * Default: '/keep-alive'
     */
    endpoint?: string;

    /**
     * Callback ketika terjadi error
     */
    onError?: (error: Error) => void;

    /**
     * Callback ketika berhasil ping
     */
    onSuccess?: () => void;
}

/**
 * Hook untuk menjaga session tetap aktif dengan ping berkala ke server
 * Mencegah Cloudflare verification berulang kali karena session expired
 */
export function useSessionKeepAlive(options: UseSessionKeepAliveOptions = {}) {
    const {
        interval = 300000, // 5 menit
        enabled = true,
        endpoint = '/keep-alive',
        onError,
        onSuccess
    } = options;

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isActivePingRef = useRef(false);

    const sendKeepAlivePing = useCallback(async () => {
        // Prevent concurrent pings
        if (isActivePingRef.current) {
            return;
        }

        try {
            isActivePingRef.current = true;

            // Get CSRF token from meta tag first
            let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            // If no token, try to refresh using global function
            if (!csrfToken) {
                console.warn('No CSRF token found, attempting to refresh...');
                const windowWithRefresh = window as unknown as { refreshCSRFToken?: () => Promise<string | null> };
                if (windowWithRefresh.refreshCSRFToken) {
                    csrfToken = await windowWithRefresh.refreshCSRFToken();
                }
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    timestamp: Date.now(),
                    user_agent: navigator.userAgent,
                    page_url: window.location.href
                }),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                if (response.status === 419) {
                    console.warn('CSRF token mismatch (419), attempting to refresh and retry...');
                    // Try to refresh CSRF token and retry once
                    const windowWithRefresh = window as unknown as { refreshCSRFToken?: () => Promise<string | null> };
                    if (windowWithRefresh.refreshCSRFToken) {
                        const newCsrfToken = await windowWithRefresh.refreshCSRFToken();
                        if (newCsrfToken) {
                            // Retry the ping with new token
                            const retryResponse = await fetch(endpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': newCsrfToken,
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                                body: JSON.stringify({
                                    timestamp: Date.now(),
                                    user_agent: navigator.userAgent,
                                    page_url: window.location.href
                                }),
                                credentials: 'same-origin'
                            });

                            if (retryResponse.ok) {
                                const retryData = await retryResponse.json();
                                if (retryData.success) {
                                    console.log('Session keep-alive ping successful after CSRF refresh');
                                    onSuccess?.();
                                    return;
                                }
                            }
                        }
                    }
                }
                throw new Error(`Keep-alive ping failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                console.log('Session keep-alive ping successful');
                onSuccess?.();
            } else {
                throw new Error(data.message || 'Keep-alive ping failed');
            }

        } catch (error) {
            console.warn('Session keep-alive ping error:', error);
            onError?.(error as Error);

            // Jika error karena session expired, redirect ke login
            if (error instanceof Error && error.message.includes('401')) {
                console.log('Session expired, redirecting to login...');
                router.visit('/login');
            }
        } finally {
            isActivePingRef.current = false;
        }
    }, [endpoint, onError, onSuccess]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Initial ping setelah 10 detik
        const initialTimeout = setTimeout(() => {
            sendKeepAlivePing();
        }, 10000);

        // Ping berkala
        intervalRef.current = setInterval(() => {
            sendKeepAlivePing();
        }, interval);

        // Cleanup
        return () => {
            if (initialTimeout) {
                clearTimeout(initialTimeout);
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, interval, endpoint, sendKeepAlivePing]);

    // User activity detection untuk ping yang lebih agresif
    useEffect(() => {
        if (!enabled) {
            return;
        }

        let lastActivityTime = Date.now();
        let activityTimeout: NodeJS.Timeout;

        const updateLastActivity = () => {
            lastActivityTime = Date.now();
        };

        const checkActivity = () => {
            const timeSinceLastActivity = Date.now() - lastActivityTime;

            // Jika user tidak aktif lebih dari 2 menit, lakukan ping
            if (timeSinceLastActivity > 120000 && !isActivePingRef.current) {
                console.log('User inactive for 2 minutes, sending keep-alive ping...');
                sendKeepAlivePing();
            }

            activityTimeout = setTimeout(checkActivity, 30000); // Check setiap 30 detik
        };

        // Event listeners untuk aktivitas user
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, updateLastActivity, { passive: true });
        });

        // Start activity checker
        activityTimeout = setTimeout(checkActivity, 30000);

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, updateLastActivity);
            });

            if (activityTimeout) {
                clearTimeout(activityTimeout);
            }
        };
    }, [enabled, sendKeepAlivePing]);

    // Ping saat tab menjadi visible kembali
    useEffect(() => {
        if (!enabled) {
            return;
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !isActivePingRef.current) {
                console.log('Tab became visible, sending keep-alive ping...');
                setTimeout(() => {
                    sendKeepAlivePing();
                }, 1000); // Delay 1 detik
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [enabled, sendKeepAlivePing]);

    // Manual ping function
    const manualPing = () => {
        if (enabled) {
            sendKeepAlivePing();
        }
    };

    return {
        manualPing,
        isActivePing: isActivePingRef.current
    };
}
