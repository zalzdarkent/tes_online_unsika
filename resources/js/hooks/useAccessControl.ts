import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface AccessDeniedError {
    error: 'OFFLINE_MODE_RESTRICTED';
    details: {
        client_ip: string;
        test_name: string;
        access_mode: 'online' | 'offline';
    };
    message: string;
}

interface ErrorResponse {
    response?: {
        status: number;
        data: AccessDeniedError;
    };
}

type HandleableError = ErrorResponse | AxiosError | AccessDeniedError | Error;

interface UseAccessControlReturn {
    showAccessDeniedModal: boolean;
    accessDeniedData: AccessDeniedError | null;
    handleAccessDenied: (error: HandleableError) => void;
    closeAccessDeniedModal: () => void;
}

export default function useAccessControl(): UseAccessControlReturn {
    const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
    const [accessDeniedData, setAccessDeniedData] = useState<AccessDeniedError | null>(null);

    const isAccessDeniedError = (data: unknown): data is AccessDeniedError => {
        return typeof data === 'object' && data !== null &&
               'error' in data && (data as AccessDeniedError).error === 'OFFLINE_MODE_RESTRICTED';
    };

    const hasErrorResponse = (error: unknown): error is ErrorResponse => {
        return typeof error === 'object' && error !== null && 'response' in error;
    };

    const handleAccessDenied = useCallback((error: HandleableError) => {
        // Handle direct AccessDeniedError objects (from frontend)
        if (isAccessDeniedError(error)) {
            setAccessDeniedData(error);
            setShowAccessDeniedModal(true);
            return;
        }

        // Handle Inertia error responses
        if (hasErrorResponse(error) && error.response?.status === 403) {
            const errorData = error.response.data;
            
            if (isAccessDeniedError(errorData)) {
                setAccessDeniedData(errorData);
                setShowAccessDeniedModal(true);
                return;
            }
        }

        // Handle Axios error responses
        if (error instanceof AxiosError && error.response?.status === 403) {
            const errorData = error.response.data;
            
            if (isAccessDeniedError(errorData)) {
                setAccessDeniedData(errorData);
                setShowAccessDeniedModal(true);
                return;
            }
        }

        // If it's not an access control error, let it bubble up
        throw error;
    }, []);    const closeAccessDeniedModal = useCallback(() => {
        setShowAccessDeniedModal(false);
        setAccessDeniedData(null);
    }, []);

    return {
        showAccessDeniedModal,
        accessDeniedData,
        handleAccessDenied,
        closeAccessDeniedModal,
    };
}
