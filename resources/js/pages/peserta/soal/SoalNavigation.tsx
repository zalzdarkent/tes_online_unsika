import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Soal } from '@/types/soal';
import { FC } from 'react';

interface SoalNavigationProps {
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    soal: Soal[];
    jawaban: Record<number, string[]>;
    tandaiSoal: Record<number, boolean>;
    durasi: number;
}

const keterangan = [
    {
        label: 'Sedang Dijawab',
        className: 'border-black bg-white text-black dark:border-white dark:bg-black dark:text-white text-sm',
    },
    {
        label: 'Sudah Dijawab',
        className:
            'border-green-500 bg-green-50 text-green-500 hover:bg-green-100 hover:text-green-500 dark:border-green-300 dark:bg-green-900 dark:text-green-300',
    },
    {
        label: 'Belum Dijawab',
        className: 'border',
    },
    {
        label: 'Ditandai',
        className: 'border-yellow-500 bg-yellow-100 text-yellow-700 dark:border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300',
    },
];

const SoalNavigation: FC<SoalNavigationProps> = ({ currentIndex, setCurrentIndex, soal, jawaban, tandaiSoal, durasi }) => {
    return (
        <>
            <div className="grid grid-cols-5 gap-2 pb-4">
                {soal.map((s, i) => {
                    const isActive = currentIndex === i;
                    const isAnswered = (jawaban[s.id]?.[0] ?? '').trim() !== '';

                    let baseClass = 'px-0 py-2 text-sm';

                    if (isActive) {
                        baseClass += ' bg-white text-black border-2 border-black dark:bg-black dark:text-white dark:border-white';
                    } else if (tandaiSoal[s.id]) {
                        baseClass +=
                            ' border border-yellow-500 bg-yellow-50 text-yellow-500 hover:bg-yellow-100 hover:text-yellow-500 dark:text-yellow-300 dark:bg-yellow-900 dark:border-yellow-300';
                    } else if (isAnswered) {
                        baseClass +=
                            ' border border-green-500 bg-green-50 text-green-500 hover:bg-green-100 hover:text-green-500 dark:text-green-300 dark:bg-green-900 dark:border-green-300';
                    } else {
                        baseClass += ' border ';
                    }

                    return (
                        <Button key={i} variant="ghost" onClick={() => setCurrentIndex(i)} className={baseClass}>
                            {i + 1}
                        </Button>
                    );
                })}
            </div>

            {keterangan.map((nav, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <div className={`size-5 rounded-sm border px-0 py-2 ${nav.className}`} />
                    <div className="text-sm">{nav.label}</div>
                </div>
            ))}

            <Separator className="mt-4" />

            <div>
                <p className="mb-1 font-semibold">Informasi Tes</p>
                <div className="grid grid-cols-2 space-y-1 text-sm text-muted-foreground">
                    <div>Total Soal:</div>
                    <div className="text-right">{soal.length}</div>

                    <div>Terjawab:</div>
                    <div className="text-right">{Object.values(jawaban).filter((j) => (j?.[0] ?? '').trim() !== '').length}</div>

                    <div>Durasi:</div>
                    <div className="text-right">{durasi} menit</div>
                </div>
            </div>
        </>
    );
};

export default SoalNavigation;
