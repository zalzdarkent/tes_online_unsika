import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Soal } from '@/types/soal';
import { Menu } from 'lucide-react';
import { FC } from 'react';
import SoalNavigation from './SoalNavigation';

interface SoalSidebarProps {
    jadwalNama: string;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    soal: Soal[];
    jawaban: Record<number, string[]>;
    tandaiSoal: Record<number, boolean>;
    durasi: number;
    // handleAnswer: () => void;
}

const SoalSidebar: FC<SoalSidebarProps> = ({
    jadwalNama,
    currentIndex,
    setCurrentIndex,
    soal,
    jawaban,
    tandaiSoal,
    durasi,
    // handleAnswer
}) => {
    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden h-screen w-64 overflow-y-auto border-r p-4 md:block">
                <h2 className="mb-2 text-xl font-semibold">{jadwalNama}</h2>
                <div className="space-y-2">
                    <p className="font-semibold">Navigasi Soal</p>
                    <SoalNavigation
                        currentIndex={currentIndex}
                        setCurrentIndex={(i) => {
                            // handleAnswer();
                            setCurrentIndex(i);
                        }}
                        soal={soal}
                        jawaban={jawaban}
                        tandaiSoal={tandaiSoal}
                        durasi={durasi}
                    />
                </div>
            </div>

            {/* Mobile Sidebar */}
            <Sheet>
                <div className="absolute top-4 left-4 z-10 md:hidden">
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                </div>
                <SheetContent side="left" className="h-screen overflow-y-auto p-4">
                    <SheetHeader>
                        <SheetTitle className="text-2xl">{jadwalNama}</SheetTitle>
                    </SheetHeader>
                    <SoalNavigation
                        currentIndex={currentIndex}
                        setCurrentIndex={setCurrentIndex}
                        soal={soal}
                        jawaban={jawaban}
                        tandaiSoal={tandaiSoal}
                        durasi={durasi}
                    />
                </SheetContent>
            </Sheet>
        </>
    );
};

export default SoalSidebar;
