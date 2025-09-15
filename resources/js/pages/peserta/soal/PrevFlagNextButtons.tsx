import ConfirmDialogWrapper from '@/components/modal/ConfirmDialogWrapper';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
        <div className="fixed right-0 bottom-5 left-[var(--sidebar-width)] mx-auto px-4 py-2 md:left-64 md:max-w-4xl md:px-8 md:py-4">
            <Separator />
            <div className="flex items-center justify-between gap-2 pt-6">
                <Button onClick={onPrev} disabled={currentIndex === 0} variant="outline" className="" title="Sebelumnya">
                    <ChevronLeft />
                    <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                <Button
                    className={
                        tandaiSoal[currentSoal.id]
                            ? 'border-yellow-500 bg-yellow-100 text-yellow-700 dark:border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300'
                            : ''
                    }
                    onClick={onToggleFlag}
                    title={`${tandaiSoal[currentSoal.id] ? 'Hapus Tanda' : 'Tandai Soal'}`}
                >
                    <Flag />
                    <span className="hidden sm:inline">{tandaiSoal[currentSoal.id] ? 'Hapus Tanda' : 'Tandai Soal'}</span>
                </Button>

                {currentIndex === soal.length - 1 ? (
                    <ConfirmDialogWrapper
                        title="Yakin ingin mengumpulkan?"
                        description="Pastikan semua soal telah dijawab. Jawaban yang dikumpulkan tidak bisa diubah."
                        confirmLabel="Kirim Jawaban"
                        cancelLabel="Batal"
                        onConfirm={onSubmit}
                        trigger={
                            <Button className="" title="Selesaikan">
                                <Check className="mr-2 h-4 w-4" />
                                Selesaikan
                            </Button>
                        }
                    />
                ) : (
                    <Button variant="outline" onClick={onNext} className="" title="Selanjutnya">
                        <span className="hidden sm:inline">Selanjutnya</span>
                        <ChevronRight />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PrevFlagNextButtons;
