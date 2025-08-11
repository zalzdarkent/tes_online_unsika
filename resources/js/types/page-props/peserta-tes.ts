import { Soal } from '../soal';

export interface PesertaTesPageProps {
    jadwal: {
        id: number;
        nama_jadwal: string;
        durasi: number;
    };
    soal: Soal[];
    jawaban_tersimpan: Record<number, string>;
    end_time_timestamp: number;
}
