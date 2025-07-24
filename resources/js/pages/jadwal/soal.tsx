import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import SoalFormModal from '@/components/modal/SoalFormModal';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

// Type untuk data soal
interface SoalData {
  id: number;
  id_jadwal: number;
  jenis_soal: string;
  pertanyaan: string;
  opsi_a?: string;
  opsi_b?: string;
  opsi_c?: string;
  opsi_d?: string;
  jawaban_benar: string;
  skor: number;
  created_at: string;
  updated_at: string;
}

interface JadwalData {
  id: number;
  nama_jadwal: string;
  tanggal_mulai: string;
  tanggal_berakhir: string;
}

interface SoalPageProps {
  jadwal: JadwalData;
  soal: SoalData[];
}

export default function SoalPage({ jadwal, soal }: SoalPageProps) {
  const { toast } = useToast();
  const [selectedSoal, setSelectedSoal] = useState<SoalData | null>(null);

  // Kolom DataTable
  const columns = [
    {
      accessorKey: 'id',
      header: 'No',
      cell: ({ row }: any) => row.index + 1,
    },
    {
      accessorKey: 'jenis_soal',
      header: 'Jenis',
      cell: ({ row }: any) => {
        const jenis = row.getValue('jenis_soal');
        switch (jenis) {
          case 'pilihan_ganda':
            return 'Pilihan Ganda';
          case 'multi_choice':
            return 'Pilihan Ganda (Multi Jawaban)';
          case 'esai':
            return 'Esai';
          case 'essay_gambar':
            return 'Esai + Gambar';
          case 'essay_audio':
            return 'Esai + Audio';
          case 'skala':
            return 'Skala';
          case 'equation':
            return 'Equation';
          default:
            return jenis;
        }
      },
    },
    {
      accessorKey: 'pertanyaan',
      header: 'Pertanyaan',
      cell: ({ row }: any) => <span>{row.getValue('pertanyaan')}</span>,
    },
    {
      accessorKey: 'jawaban_benar',
      header: 'Jawaban Benar',
      cell: ({ row }: any) => <span>{row.getValue('jawaban_benar')}</span>,
    },
    {
      accessorKey: 'skor',
      header: 'Skor',
      cell: ({ row }: any) => <span>{row.getValue('skor')}</span>,
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }: any) => {
        // const soalItem = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
          </div>
        );
      },
    },
  ];

  return (
    <AppLayout breadcrumbs={[
      { title: 'Jadwal Tes', href: '/jadwal' },
      { title: jadwal.nama_jadwal, href: `/jadwal/${jadwal.id}/soal` },
      { title: 'Soal', href: '#' },
    ]}>
      <Head title={`Soal - ${jadwal.nama_jadwal}`} />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Soal untuk Jadwal: {jadwal.nama_jadwal}</h2>
            <div className="text-sm text-muted-foreground">
              Tanggal: {jadwal.tanggal_mulai} s/d {jadwal.tanggal_berakhir}
            </div>
          </div>
          <SoalFormModal
            trigger={
              <Button className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Soal
              </Button>
            }
            idJadwal={jadwal.id}
            onSuccess={() => {
              // TODO: reload data jika perlu
            }}
          />
        </div>
        <DataTable
          columns={columns}
          data={soal}
          searchColumn="pertanyaan"
          searchPlaceholder="Cari pertanyaan..."
          emptyMessage={<div className="text-center w-full py-8 text-gray-500">Belum ada soal untuk jadwal ini.</div>}
        />
      </div>
    </AppLayout>
  );
}
