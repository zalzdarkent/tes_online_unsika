import { AlertTriangle, Shield, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AccessDeniedModalProps {
    isOpen: boolean;
    onClose: () => void;
    testName: string;
    clientIP: string;
    accessMode: 'online' | 'offline';
    message: string;
}

export default function AccessDeniedModal({
    isOpen,
    onClose,
    testName,
    clientIP,
    accessMode,
    message
}: AccessDeniedModalProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
                        Akses Ditolak
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Tes tidak dapat diakses dari lokasi Anda saat ini
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Test Info */}
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <div>
                                    <span className="font-semibold">Nama Tes:</span>
                                    <div className="text-sm text-muted-foreground">{testName}</div>
                                </div>
                                <div>
                                    <span className="font-semibold">Mode Akses:</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        {accessMode === 'offline' ? (
                                            <WifiOff className="h-4 w-4 text-orange-600" />
                                        ) : (
                                            <Wifi className="h-4 w-4 text-green-600" />
                                        )}
                                        <span className={`text-sm font-medium ${
                                            accessMode === 'offline' 
                                                ? 'text-orange-600 dark:text-orange-400' 
                                                : 'text-green-600 dark:text-green-400'
                                        }`}>
                                            {accessMode === 'offline' ? 'Offline (Kampus Only)' : 'Online'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Message */}
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            {message}
                        </p>
                    </div>

                    {/* IP Info */}
                    <div className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium">IP Address Anda:</div>
                                <div className="text-sm text-muted-foreground font-mono">{clientIP}</div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(clientIP)}
                                className="text-xs"
                            >
                                {copied ? 'Disalin!' : 'Salin'}
                            </Button>
                        </div>
                    </div>

                    {/* Allowed Networks Info */}
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                        <div className="text-sm">
                            <div className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                                Jaringan yang Diizinkan:
                            </div>
                            <div className="space-y-1 text-blue-700 dark:text-blue-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="font-mono text-xs">103.121.197.1 - 103.121.197.254</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="font-mono text-xs">36.50.94.1 - 36.50.94.254</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Solutions */}
                    <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                        <div className="text-sm">
                            <div className="font-medium text-green-800 dark:text-green-200 mb-2">
                                Solusi:
                            </div>
                            <ul className="space-y-1 text-green-700 dark:text-green-300 text-xs">
                                <li>• Akses dari jaringan Wi-Fi kampus</li>
                                <li>• Gunakan komputer laboratorium kampus</li>
                                <li>• Hubungi penyelenggara tes untuk mengubah ke mode online</li>
                                <li>• Hubungi IT support jika Anda sudah berada di kampus</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} className="w-full">
                        Mengerti
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}