import ConfirmDialogWrapper from '@/components/modal/ConfirmDialogWrapper';
import { Button } from '@/components/ui/button';
import { Soal } from '@/types/soal';
import { Check, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { FC } from 'react';

interface PrevFlagNextButtonsProps {
    currentIndex: number;
    soal: Soal[];
    tandaiSoal: Record<number, boolean>;
    onPrev: () => void;
    onNext: () => void;
    onToggleFlag: () => void;
    onSubmit: () => void;
}

const PrevFlagNextButtons: FC<PrevFlagNextButtonsProps> = ({ currentIndex, soal, tandaiSoal, onPrev, onNext, onToggleFlag, onSubmit }) => {
    const currentSoal = soal[currentIndex];

    return (
        <div className="flex flex-col gap-2 pt-6 sm:flex-row sm:justify-between">
            <Button onClick={onPrev} disabled={currentIndex === 0} variant="outline" className="w-full sm:w-auto">
                <ChevronLeft />
                Sebelumnya
            </Button>

            <Button
                className={
                    tandaiSoal[currentSoal.id]
                        ? 'border-yellow-500 bg-yellow-100 text-yellow-700 dark:border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300'
                        : ''
                }
                onClick={onToggleFlag}
            >
                <Flag />
                {tandaiSoal[currentSoal.id] ? 'Hapus Tanda' : 'Tandai Soal'}
            </Button>

            {currentIndex === soal.length - 1 ? (
                <ConfirmDialogWrapper
                    title="Yakin ingin mengumpulkan?"
                    description="Pastikan semua soal telah dijawab. Jawaban yang dikumpulkan tidak bisa diubah."
                    confirmLabel="Kirim Jawaban"
                    cancelLabel="Batal"
                    onConfirm={onSubmit}
                    trigger={
                        <Button className="w-full sm:w-auto">
                            <Check className="mr-2 h-4 w-4" />
                            Selesaikan
                        </Button>
                    }
                />
            ) : (
                <Button variant="outline" onClick={onNext} className="w-full sm:w-auto">
                    Selanjutnya
                    <ChevronRight />
                </Button>
            )}
        </div>
    );
};

export default PrevFlagNextButtons;
