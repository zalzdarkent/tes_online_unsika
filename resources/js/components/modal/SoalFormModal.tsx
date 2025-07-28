import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { useToast } from '@/hooks/use-toast';

// Tipe soal yang didukung
const SOAL_TYPES = [
  { value: 'single_choice', label: 'Multiple Choice (Satu Jawaban)' },
  { value: 'multi_choice', label: 'Multiple Choice (Banyak Jawaban)' },
  { value: 'essay', label: 'Essay' },
  { value: 'essay_gambar', label: 'Essay + Gambar' },
  { value: 'essay_audio', label: 'Essay + Audio' },
  { value: 'skala', label: 'Rentang Skala' },
  { value: 'equation', label: 'Equation' },
];

export default function SoalFormModal({ trigger, onSuccess, idJadwal }: {
  trigger: React.ReactNode;
  onSuccess?: () => void;
  idJadwal: number;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipeJawaban, setTipeJawaban] = useState('single_choice');
  const [pertanyaan, setPertanyaan] = useState('');
  const [opsi, setOpsi] = useState(['', '', '', '']);
  const [jawabanBenar, setJawabanBenar] = useState('');
  const [jawabanBenarMulti, setJawabanBenarMulti] = useState<string[]>([]);
  const [skor, setSkor] = useState(1);
  const [media, setMedia] = useState<File | null>(null);
  const [skalaMin, setSkalaMin] = useState(1);
  const [skalaMaks, setSkalaMaks] = useState(5);
  const [skalaLabelMin, setSkalaLabelMin] = useState('');
  const [skalaLabelMaks, setSkalaLabelMaks] = useState('');
  const [equation, setEquation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form saat modal ditutup
  const resetForm = () => {
    setTipeJawaban('single_choice');
    setPertanyaan('');
    setOpsi(['', '', '', '']);
    setJawabanBenar('');
    setJawabanBenarMulti([]);
    setSkor(1);
    setMedia(null);
    setSkalaMin(1);
    setSkalaMaks(5);
    setSkalaLabelMin('');
    setSkalaLabelMaks('');
    setEquation('');
    setErrors({});
  };

  // Handler submit
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!pertanyaan.trim()) newErrors.pertanyaan = 'Pertanyaan wajib diisi.';
    if (!skor || skor < 1) newErrors.skor = 'Skor minimal 1.';
    if (tipeJawaban === 'single_choice') {
      opsi.forEach((o, i) => {
        if (!o.trim()) newErrors[`opsi_${i}`] = `Opsi ${String.fromCharCode(65 + i)} wajib diisi.`;
      });
      if (!jawabanBenar) newErrors.jawabanBenar = 'Jawaban benar wajib dipilih.';
    }
    if (tipeJawaban === 'multi_choice') {
      opsi.forEach((o, i) => {
        if (!o.trim()) newErrors[`opsi_${i}`] = `Opsi ${String.fromCharCode(65 + i)} wajib diisi.`;
      });
      if (jawabanBenarMulti.length === 0) newErrors.jawabanBenarMulti = 'Pilih minimal satu jawaban benar.';
    }
    // Validasi untuk skala
    if (tipeJawaban === 'skala') {
      if (skalaMin >= skalaMaks) newErrors.skala = 'Nilai minimum harus lebih kecil dari maksimum.';
      if (!skalaLabelMin.trim()) newErrors.skalaLabelMin = 'Label minimum wajib diisi.';
      if (!skalaLabelMaks.trim()) newErrors.skalaLabelMaks = 'Label maksimum wajib diisi.';
      if (!jawabanBenar.trim()) newErrors.jawabanBenar = 'Jawaban benar (nilai target) wajib diisi.';
      const jawabanBenarNum = Number(jawabanBenar);
      if (isNaN(jawabanBenarNum) || jawabanBenarNum < skalaMin || jawabanBenarNum > skalaMaks) {
        newErrors.jawabanBenar = `Jawaban benar harus berupa angka antara ${skalaMin} dan ${skalaMaks}.`;
      }
    }
    // Validasi wajib untuk essay
    if (
      tipeJawaban === 'essay' ||
      tipeJawaban === 'essay_gambar' ||
      tipeJawaban === 'essay_audio'
    ) {
      if (!jawabanBenar.trim()) newErrors.jawabanBenar = 'Jawaban benar wajib diisi.';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Tampilkan toast error validasi frontend
      toast({
        title: 'Gagal menyimpan soal',
        description: Object.values(newErrors).join(' '),
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    // Kirim data ke backend
    let formData: FormData | null = null;
    if (media) {
      formData = new FormData();
      formData.append('id_jadwal', String(idJadwal));
      formData.append('jenis_soal', tipeJawaban === 'single_choice' ? 'pilihan_ganda' : tipeJawaban === 'essay' ? 'esai' : tipeJawaban);
      formData.append('pertanyaan', pertanyaan);
      formData.append('skor', String(skor));
      if (tipeJawaban === 'single_choice') {
        formData.append('opsi_a', opsi[0]);
        formData.append('opsi_b', opsi[1]);
        formData.append('opsi_c', opsi[2]);
        formData.append('opsi_d', opsi[3]);
        formData.append('jawaban_benar', jawabanBenar);
      }
      if (tipeJawaban === 'multi_choice') {
        formData.append('opsi_a', opsi[0]);
        formData.append('opsi_b', opsi[1]);
        formData.append('opsi_c', opsi[2]);
        formData.append('opsi_d', opsi[3]);
        formData.append('jawaban_benar', jawabanBenarMulti.join(','));
      }
      if (
        tipeJawaban === 'essay' ||
        tipeJawaban === 'essay_gambar' ||
        tipeJawaban === 'essay_audio'
      ) {
        formData.append('jawaban_benar', jawabanBenar);
      }
      if (tipeJawaban === 'skala') {
        formData.append('skala_min', String(skalaMin));
        formData.append('skala_maks', String(skalaMaks));
        formData.append('skala_label_min', skalaLabelMin);
        formData.append('skala_label_maks', skalaLabelMaks);
        formData.append('jawaban_benar', jawabanBenar);
      }
      formData.append('media', media);
      // Tambahkan field lain sesuai kebutuhan
      router.post(`/jadwal/soal`, formData, {
        onSuccess: () => {
          setLoading(false);
          setOpen(false);
          resetForm();
          toast({
            title: 'Berhasil',
            description: 'Soal berhasil ditambahkan!',
          });
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          setLoading(false);
          // Tampilkan toast error dari backend
          toast({
            title: 'Gagal menyimpan soal',
            description: err && typeof err === 'object' ? Object.values(err).join(' ') : String(err),
            variant: 'destructive',
          });
          if (err) setErrors(err);
        },
        preserveScroll: true,
        forceFormData: true,
      });
    } else {
      const payload: any = {
        id_jadwal: idJadwal,
        jenis_soal: tipeJawaban === 'single_choice' ? 'pilihan_ganda' : tipeJawaban === 'essay' ? 'esai' : tipeJawaban,
        pertanyaan,
        skor,
      };
      if (tipeJawaban === 'single_choice') {
        payload.opsi_a = opsi[0];
        payload.opsi_b = opsi[1];
        payload.opsi_c = opsi[2];
        payload.opsi_d = opsi[3];
        payload.jawaban_benar = jawabanBenar;
      }
      if (tipeJawaban === 'multi_choice') {
        payload.opsi_a = opsi[0];
        payload.opsi_b = opsi[1];
        payload.opsi_c = opsi[2];
        payload.opsi_d = opsi[3];
        payload.jawaban_benar = jawabanBenarMulti.join(',');
      }
      if (
        tipeJawaban === 'essay' ||
        tipeJawaban === 'essay_gambar' ||
        tipeJawaban === 'essay_audio'
      ) {
        payload.jawaban_benar = jawabanBenar;
      }
      if (tipeJawaban === 'skala') {
        payload.skala_min = skalaMin;
        payload.skala_maks = skalaMaks;
        payload.skala_label_min = skalaLabelMin;
        payload.skala_label_maks = skalaLabelMaks;
        payload.jawaban_benar = jawabanBenar;
      }
      // Tambahkan field lain sesuai kebutuhan
      router.post(`/jadwal/soal`, payload, {
        onSuccess: () => {
          setLoading(false);
          setOpen(false);
          resetForm();
          toast({
            title: 'Berhasil',
            description: 'Soal berhasil ditambahkan!',
          });
          if (onSuccess) onSuccess();
        },
        onError: (err) => {
          setLoading(false);
          toast({
            title: 'Gagal menyimpan soal',
            description: err && typeof err === 'object' ? Object.values(err).join(' ') : String(err),
            variant: 'destructive',
          });
          if (err) setErrors(err);
        },
        preserveScroll: true,
      });
    }
  };

  // Render opsi input sesuai tipe soal
  const renderOpsiInput = () => {
    if (tipeJawaban === 'single_choice' || tipeJawaban === 'multi_choice') {
      return (
        <div className="space-y-2">
          <label className="block font-medium mb-1">Opsi Jawaban</label>
          {opsi.map((val, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <label className="w-20">Opsi {String.fromCharCode(65 + idx)}</label>
              <Input
                placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                value={val}
                onChange={e => {
                  const newOpsi = [...opsi];
                  newOpsi[idx] = e.target.value;
                  setOpsi(newOpsi);
                }}
              />
              {errors[`opsi_${idx}`] && <span className="text-red-500 text-xs ml-2">{errors[`opsi_${idx}`]}</span>}
              {tipeJawaban === 'multi_choice' ? (
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={jawabanBenarMulti.includes(String.fromCharCode(65 + idx))}
                    onChange={() => {
                      const key = String.fromCharCode(65 + idx);
                      setJawabanBenarMulti(jawabanBenarMulti.includes(key)
                        ? jawabanBenarMulti.filter(j => j !== key)
                        : [...jawabanBenarMulti, key]);
                    }}
                  />
                  <span>Benar</span>
                </label>
              ) : (
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="jawaban_benar"
                    checked={jawabanBenar === String.fromCharCode(65 + idx)}
                    onChange={() => setJawabanBenar(String.fromCharCode(65 + idx))}
                  />
                  <span>Benar</span>
                </label>
              )}
            </div>
          ))}
          {tipeJawaban === 'single_choice' && errors.jawabanBenar && <span className="text-red-500 text-xs">{errors.jawabanBenar}</span>}
          {tipeJawaban === 'multi_choice' && errors.jawabanBenarMulti && <span className="text-red-500 text-xs">{errors.jawabanBenarMulti}</span>}
        </div>
      );
    }
    return null;
  };

  // Render upload media jika essay_gambar/essay_audio
  const renderMediaInput = () => {
    if (tipeJawaban === 'essay_gambar' || tipeJawaban === 'essay_audio') {
      return (
        <div>
          <label className="block font-medium mb-1">{tipeJawaban === 'essay_gambar' ? 'Upload Gambar' : 'Upload Audio'}</label>
          <Input type="file" accept={tipeJawaban === 'essay_gambar' ? 'image/*' : 'audio/*'} onChange={e => setMedia(e.target.files?.[0] || null)} />
        </div>
      );
    }
    return null;
  };

  // Render skala
  const renderSkalaInput = () => {
    if (tipeJawaban === 'skala') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Rentang Minimum</label>
              <Input
                type="number"
                min={1}
                value={skalaMin}
                onChange={e => setSkalaMin(Number(e.target.value))}
                placeholder="1"
              />
              {errors.skala && <span className="text-red-500 text-xs">{errors.skala}</span>}
            </div>
            <div>
              <label className="block font-medium mb-1">Rentang Maksimum</label>
              <Input
                type="number"
                min={2}
                value={skalaMaks}
                onChange={e => setSkalaMaks(Number(e.target.value))}
                placeholder="5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Label Minimum</label>
              <Input
                placeholder="Sangat Tidak Setuju"
                value={skalaLabelMin}
                onChange={e => setSkalaLabelMin(e.target.value)}
              />
              {errors.skalaLabelMin && <span className="text-red-500 text-xs">{errors.skalaLabelMin}</span>}
            </div>
            <div>
              <label className="block font-medium mb-1">Label Maksimum</label>
              <Input
                placeholder="Sangat Setuju"
                value={skalaLabelMaks}
                onChange={e => setSkalaLabelMaks(e.target.value)}
              />
              {errors.skalaLabelMaks && <span className="text-red-500 text-xs">{errors.skalaLabelMaks}</span>}
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Nilai Target</label>
            <Input
              type="number"
              min={skalaMin}
              max={skalaMaks}
              value={jawabanBenar}
              onChange={e => setJawabanBenar(e.target.value)}
              placeholder={`Nilai antara ${skalaMin} - ${skalaMaks}`}
            />
            {errors.jawabanBenar && <span className="text-red-500 text-xs">{errors.jawabanBenar}</span>}
            <div className="text-xs text-gray-500 mt-1">
              Preview: {skalaMin} ({skalaLabelMin}) ... {skalaMaks} ({skalaLabelMaks})
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render equation
  const renderEquationInput = () => {
    if (tipeJawaban === 'equation') {
      return (
        <div>
          <label className="block font-medium mb-1">Equation (LaTeX/Math)</label>
          <Textarea placeholder="Equation (LaTeX/Math)" value={equation} onChange={e => setEquation(e.target.value)} />
        </div>
      );
    }
    return null;
  };

  // Render input jawaban benar untuk essay
  const renderEssayJawabanInput = () => {
    if (tipeJawaban === 'essay' || tipeJawaban === 'essay_gambar' || tipeJawaban === 'essay_audio') {
      return (
        <div>
          <label className="block font-medium mb-1">Jawaban Benar (Kunci)</label>
          <Textarea placeholder="Jawaban benar/kunci" value={jawabanBenar} onChange={e => setJawabanBenar(e.target.value)} />
          {errors.jawabanBenar && <span className="text-red-500 text-xs">{errors.jawabanBenar}</span>}
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Soal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Tipe Soal</label>
            <Select value={tipeJawaban} onValueChange={setTipeJawaban}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Tipe Soal" />
              </SelectTrigger>
              <SelectContent>
                {SOAL_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block font-medium mb-1">Pertanyaan</label>
            <Textarea placeholder="Pertanyaan" value={pertanyaan} onChange={e => setPertanyaan(e.target.value)} required />
            {errors.pertanyaan && <span className="text-red-500 text-xs">{errors.pertanyaan}</span>}
          </div>
          {renderOpsiInput()}
          {renderEssayJawabanInput()}
          {renderMediaInput()}
          {renderSkalaInput()}
          {renderEquationInput()}
          <div>
            <label className="block font-medium mb-1">Skor</label>
            <Input type="number" min={1} value={skor} onChange={e => setSkor(Number(e.target.value))} placeholder="Skor" required />
            {errors.skor && <span className="text-red-500 text-xs">{errors.skor}</span>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetForm}>Batal</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
