import { Soal } from '../soal';

export interface PesertaTesPageProps {
    jadwal: {
        id: number;
        nama_jadwal: string;
        durasi: number;
    };
    soal: Soal[];
    start_time: string;
    jawaban_tersimpan: Record<number, string>;
}
