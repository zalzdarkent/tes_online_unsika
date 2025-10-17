import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AccessDeniedModal from '@/components/modal/AccessDeniedModal';

export default function TestAccessDeniedPage() {
    const [showModal, setShowModal] = useState(false);

    const testData = {
        testName: "UTS Sistem Informasi - Teknik Informatika",
        clientIP: "114.10.68.243",  // IP yang sama seperti di screenshot
        accessMode: 'offline' as const,
        message: "Tes ini dikonfigurasi untuk mode offline dan hanya dapat diakses dari jaringan kampus universitas. IP Address Anda (114.10.68.243) tidak terdaftar dalam jaringan yang diizinkan."
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Demo Modal Access Denied</CardTitle>
                    <CardDescription>
                        Klik tombol di bawah untuk melihat modal akses ditolak yang elegant
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Sebelum:</strong> Error muncul sebagai plain text JSON response yang tidak user-friendly
                        </p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-sm text-green-800 dark:text-green-200">
                            <strong>Sesudah:</strong> Modal professional dengan ShadCN UI, informasi lengkap, dan guidance yang jelas
                        </p>
                    </div>

                    <Button 
                        onClick={() => setShowModal(true)}
                        className="w-full"
                        size="lg"
                    >
                        Tampilkan Modal Access Denied
                    </Button>

                    <div className="text-center text-xs text-muted-foreground">
                        IP simulasi: {testData.clientIP} (tidak ada di allowed range)
                    </div>
                </CardContent>
            </Card>

            <AccessDeniedModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                testName={testData.testName}
                clientIP={testData.clientIP}
                accessMode={testData.accessMode}
                message={testData.message}
            />
        </div>
    );
}