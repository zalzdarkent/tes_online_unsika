import { Soal } from '../soal';

export interface PesertaTesPageProps {
    jadwal: {
        id: number;
        nama_jadwal: string;
        durasi: number | null;
    };
    soal: Soal[];
    start_time: string;
}
