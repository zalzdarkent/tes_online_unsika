import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AccessDeniedModal from '@/components/modal/AccessDeniedModal';

export default function TestAccessDeniedModal() {
    const [showModal, setShowModal] = useState(false);

    const testData = {
        testName: "UTS Sistem Informasi - Teknik Informatika",
        clientIP: "192.168.1.100",
        accessMode: 'offline' as const,
        message: "Tes ini hanya dapat diakses dari jaringan kampus. IP Address Anda (192.168.1.100) tidak terdaftar dalam jaringan yang diizinkan."
    };

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Test Access Denied Modal</h1>
            <p className="text-muted-foreground">
                Click the button below to test the Access Denied Modal component.
            </p>

            <Button onClick={() => setShowModal(true)}>
                Show Access Denied Modal
            </Button>

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
