import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface ConfirmDialogProps {
    title: string;
    description: string;
    onConfirm: () => void;
    trigger: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
}

export default function ConfirmDialogWrapper({
    title,
    description,
    onConfirm,
    trigger,
    confirmLabel = 'Ya',
    cancelLabel = 'Batal',
}: ConfirmDialogProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button onClick={onConfirm}>{confirmLabel}</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
