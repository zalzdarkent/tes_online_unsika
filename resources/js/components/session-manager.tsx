import { useSessionKeepAlive } from '@/hooks/use-session-keepalive';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface SessionManagerProps {
    /**
     * Apakah session keep-alive aktif
     * Default: true
     */
    enabled?: boolean;

    /**
     * Interval ping dalam milidetik
     * Default: 5 menit untuk user biasa, 2 menit untuk peserta yang sedang tes
     */
    interval?: number;

    /**
     * Tampilkan status indicator
     * Default: false (hanya untuk debugging)
     */
    showStatus?: boolean;
}

/**
 * Komponen global untuk mengelola session keep-alive
 * Mencegah Cloudflare verification berulang dengan ping berkala ke server
 */
export function SessionManager({
    enabled = true,
    interval,
    showStatus = false
}: SessionManagerProps) {
    const { props } = usePage();
    const { auth } = props as any;
    const user = auth?.user;

    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
    const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
    const [errorCount, setErrorCount] = useState(0);

    // Tentukan interval berdasarkan context user
    const getDefaultInterval = () => {
        // Jika di halaman tes, ping lebih sering (2 menit)
        if (window.location.pathname.includes('/soal')) {
            return 120000; // 2 menit
        }

        // Untuk peserta, ping lebih sering (3 menit)
        if (user?.role === 'peserta') {
            return 180000; // 3 menit
        }

        // Untuk admin/teacher, ping normal (5 menit)
        return 300000; // 5 menit
    };

    const finalInterval = interval || getDefaultInterval();

    const { manualPing, isActivePing } = useSessionKeepAlive({
        enabled: enabled && !!user,
        interval: finalInterval,
        endpoint: '/keep-alive',
        onSuccess: () => {
            setConnectionStatus('connected');
            setLastPingTime(new Date());
            setErrorCount(0);
        },
        onError: (error) => {
            setConnectionStatus('disconnected');
            setErrorCount(prev => prev + 1);
            console.warn('Session keep-alive error:', error);
        }
    });

    // Update status saat sedang ping
    useEffect(() => {
        if (isActivePing) {
            setConnectionStatus('connecting');
        }
    }, [isActivePing]);

    // Reset error count setelah beberapa kali error berturut-turut
    useEffect(() => {
        if (errorCount >= 5) {
            console.warn('Multiple session keep-alive failures, may need to refresh page');
        }
    }, [errorCount]);

    // Jangan render jika user tidak login atau disabled
    if (!enabled || !user) {
        return null;
    }

    // Hanya tampilkan status indicator jika diminta (untuk debugging)
    if (!showStatus) {
        return null;
    }

    const getStatusIcon = () => {
        switch (connectionStatus) {
            case 'connected':
                return <Wifi className="h-4 w-4 text-green-500" />;
            case 'connecting':
                return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
            case 'disconnected':
                return <WifiOff className="h-4 w-4 text-red-500" />;
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'Terhubung';
            case 'connecting':
                return 'Menghubungkan...';
            case 'disconnected':
                return 'Terputus';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
                <div className="flex items-center space-x-2 text-sm">
                    {getStatusIcon()}
                    <span className="font-medium">{getStatusText()}</span>
                </div>

                {lastPingTime && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Terakhir: {lastPingTime.toLocaleTimeString()}
                    </div>
                )}

                {errorCount > 0 && (
                    <div className="text-xs text-red-500 mt-1">
                        Error: {errorCount}x
                    </div>
                )}

                <div className="mt-2 flex space-x-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={manualPing}
                        disabled={isActivePing}
                        className="text-xs h-6"
                    >
                        {isActivePing ? 'Ping...' : 'Manual Ping'}
                    </Button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Interval: {Math.round(finalInterval / 1000 / 60)}m
                </div>
            </div>
        </div>
    );
}

/**
 * Hook untuk menggunakan session manager secara kondisional
 */
export function useSessionManager() {
    const { props } = usePage();
    const { auth } = props as any;
    const user = auth?.user;

    // Aktifkan session keep-alive berdasarkan role dan halaman
    const shouldEnable = () => {
        if (!user) return false;

        // Selalu aktif untuk semua user yang login
        return true;
    };

    const getInterval = () => {
        // Interval lebih pendek untuk halaman kritis
        if (window.location.pathname.includes('/soal')) {
            return 120000; // 2 menit untuk halaman tes
        }

        if (user?.role === 'peserta') {
            return 180000; // 3 menit untuk peserta
        }

        return 300000; // 5 menit untuk admin/teacher
    };

    return {
        enabled: shouldEnable(),
        interval: getInterval(),
        showStatus: process.env.NODE_ENV === 'development' // Hanya tampilkan di development
    };
}
