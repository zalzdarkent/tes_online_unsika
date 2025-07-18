import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FlashMessage {
    error?: string;
    success?: string;
    info?: string;
}

export function FlashMessages() {
    const { props } = usePage();
    const flash = props as FlashMessage;
    const [messages, setMessages] = useState<FlashMessage>({});

    useEffect(() => {
        if (flash.error || flash.success || flash.info) {
            setMessages({
                error: flash.error,
                success: flash.success,
                info: flash.info,
            });

            // Auto hide after 5 seconds
            const timer = setTimeout(() => {
                setMessages({});
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [flash]);

    const dismissMessage = (type: keyof FlashMessage) => {
        setMessages(prev => ({
            ...prev,
            [type]: undefined,
        }));
    };

    if (!messages.error && !messages.success && !messages.info) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md space-y-2">
            {messages.error && (
                <Alert variant="destructive" className="relative">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{messages.error}</AlertDescription>
                    <button
                        onClick={() => dismissMessage('error')}
                        className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Alert>
            )}

            {messages.success && (
                <Alert className="relative border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>{messages.success}</AlertDescription>
                    <button
                        onClick={() => dismissMessage('success')}
                        className="absolute top-2 right-2 p-1 hover:bg-green-100 rounded"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Alert>
            )}

            {messages.info && (
                <Alert className="relative border-blue-200 bg-blue-50 text-blue-800">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription>{messages.info}</AlertDescription>
                    <button
                        onClick={() => dismissMessage('info')}
                        className="absolute top-2 right-2 p-1 hover:bg-blue-100 rounded"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Alert>
            )}
        </div>
    );
}
