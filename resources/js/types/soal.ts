export interface Soal {
    id: number;
    id_jadwal: number;
    jenis_soal: 'pilihan_ganda' | 'multi_choice' | 'esai' | 'essay_gambar' | 'essay_audio' | 'skala' | 'equation';
    tipe_jawaban: 'single_choice' | 'multi_choice' | 'essay' | 'essay_gambar' | 'essay_audio' | 'skala' | 'equation';
    pertanyaan: string;
    opsi_a?: string;
    opsi_b?: string;
    opsi_c?: string;
    opsi_d?: string;
    jawaban_benar: string; // This is the value/text of the correct answer
    jawaban_benar_opsi?: string; // This is the option letter (A/B/C/D) for debugging
    media?: string;
    skala_min?: number;
    skala_maks?: number;
    skala_label_min?: string;
    skala_label_maks?: string;
    equation?: string;
    skor: number;
    created_at: string;
    updated_at: string;
}
