// components/SoalOpsi.tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Soal } from '@/types/soal';
import { FC } from 'react';
import { BlockMath } from 'react-katex';
import Media from './Media';

interface SoalOpsiProps {
    soal: Soal;
    jawaban: Record<number, string[]>;
    setJawaban: (jawaban: Record<number, string[]>) => void;
}

const SoalOpsi: FC<SoalOpsiProps> = ({ soal: s, jawaban, setJawaban }) => {
    const opsi = [
        { label: 'A', text: s.opsi_a },
        { label: 'B', text: s.opsi_b },
        { label: 'C', text: s.opsi_c },
        { label: 'D', text: s.opsi_d },
    ].filter((o) => o.text !== undefined);

    if (s.jenis_soal === 'pilihan_ganda') {
        return (
            <div>
                {s.media && <Media url={s.media} />}

                <RadioGroup
                    className="mt-4 space-y-2"
                    value={jawaban[s.id]?.[0] || ''}
                    onValueChange={(val) => setJawaban({ ...jawaban, [s.id]: [val] })}
                >
                    {opsi.map((o, i) => {
                        const isSelected = jawaban[s.id]?.[0] === o.label;
                        return (
                            <div
                                key={i}
                                onClick={() => setJawaban({ ...jawaban, [s.id]: [o.label] })}
                                className={`flex cursor-pointer items-center space-x-2 rounded-md border p-3 transition-all hover:bg-muted/70 ${
                                    isSelected ? 'border-primary' : 'border-muted'
                                }`}
                            >
                                <RadioGroupItem value={o.label} id={`soal_${s.id}_${o.label}`} className="pointer-events-none" />
                                <Label htmlFor={`soal_${s.id}_${o.label}`} className="cursor-pointer select-none">
                                    {o.label}. {o.text}
                                </Label>
                            </div>
                        );
                    })}
                </RadioGroup>
            </div>
        );
    }

    if (s.jenis_soal === 'multi_choice') {
        return (
            <div className="mt-4 space-y-4">
                {s.media && <Media url={s.media} />}

                {opsi.map((o, i) => {
                    const selected = jawaban[s.id] || [];
                    return (
                        <div key={i} className="flex items-center space-x-2">
                            <Checkbox
                                id={`soal_${s.id}_${o.label}`}
                                checked={selected.includes(o.label)}
                                onCheckedChange={(checked) => {
                                    const next = checked ? [...selected, o.label] : selected.filter((item) => item !== o.label);
                                    setJawaban({ ...jawaban, [s.id]: next });
                                }}
                            />
                            <Label htmlFor={`soal_${s.id}_${o.label}`}>
                                {o.label}. {o.text}
                            </Label>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (['esai', 'essay_gambar', 'essay_audio'].includes(s.jenis_soal)) {
        return (
            <div className="mt-4 max-w-full space-y-3">
                {s.media && <Media url={s.media} />}

                <div>
                    <Label htmlFor={`soal_${s.id}_essay`} className="mb-2 block text-sm font-medium">
                        Jawaban Anda
                    </Label>
                    <Textarea
                        id={`soal_${s.id}_essay`}
                        placeholder="Tulis jawaban Anda di sini..."
                        value={jawaban[s.id]?.[0] || ''}
                        onChange={(e) => setJawaban({ ...jawaban, [s.id]: [e.target.value] })}
                        className="min-h-[120px] w-full max-w-full resize-y"
                    />
                </div>
            </div>
        );
    }

    if (s.jenis_soal === 'skala') {
        const skalaMin = s.skala_min ?? 1;
        const skalaMaks = s.skala_maks ?? 5;
        const labelMin = s.skala_label_min ?? 'Sangat Tidak Setuju';
        const labelMaks = s.skala_label_maks ?? 'Sangat Setuju';

        const range = Array.from({ length: skalaMaks - skalaMin + 1 }, (_, i) => skalaMin + i);

        return (
            <div className="mt-4">
                {s.media && <Media url={s.media} />}

                <RadioGroup value={jawaban[s.id]?.[0] || ''} onValueChange={(val) => setJawaban({ ...jawaban, [s.id]: [val] })} className="space-y-2">
                    <div
                        className="grid items-center gap-y-2"
                        style={{
                            gridTemplateColumns: `auto repeat(${range.length}, minmax(0, 1fr)) auto`,
                        }}
                    >
                        <div className="text-center text-sm">{labelMin}</div>
                        {range.map((val) => (
                            <div key={`angka_${val}`} className="text-center text-sm">
                                {val}
                            </div>
                        ))}
                        <div className="text-center text-sm">{labelMaks}</div>
                        <div></div>
                        {range.map((val) => (
                            <div key={`radio_${val}`} className="flex justify-center">
                                <RadioGroupItem value={String(val)} id={`skala_${s.id}_${val}`} className="size-6 cursor-pointer md:size-8" />
                            </div>
                        ))}
                        <div></div>
                    </div>
                </RadioGroup>
            </div>
        );
    }

    if (s.jenis_soal === 'equation') {
        return (
            <div className="mt-4 space-y-4">
                {s.media && <Media url={s.media} />}

                <div className="rounded-md border p-4">{typeof s.equation === 'string' && <BlockMath math={s.equation} errorColor="#cc0000" />}</div>
                <div className="space-y-2">
                    <Label htmlFor={`soal_${s.id}_jawaban`} className="block font-medium">
                        Jawaban Anda
                    </Label>
                    <Textarea
                        id={`soal_${s.id}_jawaban`}
                        placeholder="Tulis jawaban Anda di sini..."
                        value={jawaban[s.id]?.[0] || ''}
                        onChange={(e) => setJawaban({ ...jawaban, [s.id]: [e.target.value] })}
                    />
                </div>
            </div>
        );
    }

    return null;
};

export default SoalOpsi;
