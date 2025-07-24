import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { DialogTrigger } from '@radix-ui/react-dialog';

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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipeJawaban, setTipeJawaban] = useState('single_choice');
  const [pertanyaan, setPertanyaan] = useState('');
  const [opsi, setOpsi] = useState(['', '', '', '']);
  const [jawabanBenar, setJawabanBenar] = useState('');
  const [jawabanBenarMulti, setJawabanBenarMulti] = useState<string[]>([]);
  const [skor, setSkor] = useState(1);
  const [media, setMedia] = useState<File | null>(null);
  const [tipeSkala, setTipeSkala] = useState('');
  const [equation, setEquation] = useState('');

  // Reset form saat modal ditutup
  const resetForm = () => {
    setTipeJawaban('single_choice');
    setPertanyaan('');
    setOpsi(['', '', '', '']);
    setJawabanBenar('');
    setJawabanBenarMulti([]);
    setSkor(1);
    setMedia(null);
    setTipeSkala('');
    setEquation('');
  };

  // Handler submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Kirim data ke backend pakai Inertia/axios/fetch
    // ...
    setLoading(false);
    setOpen(false);
    resetForm();
    if (onSuccess) onSuccess();
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
              {tipeJawaban === 'multi_choice' ? (
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={jawabanBenarMulti.includes(String.fromCharCode(65 + idx))}
                    onChange={e => {
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
        <div>
          <label className="block font-medium mb-1">Tipe Skala</label>
          <Input placeholder="Tipe Skala (misal: likert, rating, dst)" value={tipeSkala} onChange={e => setTipeSkala(e.target.value)} />
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
          </div>
          {renderOpsiInput()}
          {renderMediaInput()}
          {renderSkalaInput()}
          {renderEquationInput()}
          <div>
            <label className="block font-medium mb-1">Skor</label>
            <Input type="number" min={1} value={skor} onChange={e => setSkor(Number(e.target.value))} placeholder="Skor" required />
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
