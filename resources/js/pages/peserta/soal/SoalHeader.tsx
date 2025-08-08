import { formatTime } from '@/lib/format-time';

interface SoalHeaderProps {
    currentIndex: number;
    totalSoal: number;
    timeLeft: number;
}

export default function SoalHeader({ currentIndex, totalSoal, timeLeft }: SoalHeaderProps) {
    return (
        <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Soal ke {currentIndex + 1} dari {totalSoal}
            </p>
            <div className="rounded-md bg-muted px-3 py-1.5">
                <p className="text-sm font-bold text-muted-foreground">{formatTime(timeLeft)}</p>
            </div>
        </div>
    );
}
