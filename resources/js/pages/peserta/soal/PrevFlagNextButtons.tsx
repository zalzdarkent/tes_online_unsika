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
        <div className="flex justify-between pt-6">
            <Button onClick={onPrev} disabled={currentIndex === 0} variant="outline" className="cursor-pointer">
                <ChevronLeft />
                Sebelumnya
            </Button>

            <Button variant={tandaiSoal[currentSoal.id] ? 'default' : 'outline'} onClick={onToggleFlag}>
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
                        <Button>
                            <Check className="mr-2 h-4 w-4" />
                            Selesaikan
                        </Button>
                    }
                />
            ) : (
                <Button variant="outline" onClick={onNext}>
                    Selanjutnya
                    <ChevronRight />
                </Button>
            )}
        </div>
    );
};

export default PrevFlagNextButtons;
