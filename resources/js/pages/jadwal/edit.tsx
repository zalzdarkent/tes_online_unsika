import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// Helper function untuk parsing tanggal dari database
const parseDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return { date: '', time: '' };

    // Handle format "2025-07-23 10:30:00" atau "2025-07-23T10:30:00"
    let cleanString = dateTimeString;
    if (cleanString.includes('T')) {
        cleanString = cleanString.replace('T', ' ');
    }
    if (cleanString.includes('.')) {
        cleanString = cleanString.split('.')[0];
    }

    const [datePart, timePart] = cleanString.split(' ');
    const timeOnly = timePart ? timePart.substring(0, 5) : ''; // Ambil HH:MM

    return {
        date: datePart || '',
        time: timeOnly || '',
    };
};

// Type untuk data jadwal
type JadwalData = {
    id: number;
    nama_jadwal: string;
    tanggal_mulai: string;
    tanggal_berakhir: string;
    waktu_mulai_tes: string | null;
    status: string;
    auto_close?: boolean;
    access_mode?: 'online' | 'offline';
    id_jadwal_sebelumnya: number | null;
    kategori_tes_id: number | null;
    durasi: number | null;
    created_at: string;
    updated_at: string;
};

// Type untuk kategori tes
type KategoriTesData = {
    id: number;
    nama: string;
};

type EditJadwalProps = {
    jadwal: JadwalData;
    allJadwal: JadwalData[];
    kategoriTes: KategoriTesData[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Jadwal Tes',
        href: '/jadwal',
    },
    {
        title: 'Edit Jadwal',
        href: '#',
    },
];

export default function EditJadwal({ jadwal, allJadwal, kategoriTes }: EditJadwalProps) {
    const { toast } = useToast();

    const { data, setData, put, processing } = useForm({
        nama_jadwal: jadwal.nama_jadwal || '',
        tanggal_mulai: jadwal.tanggal_mulai || '',
        tanggal_berakhir: jadwal.tanggal_berakhir || '',
        waktu_mulai_tes: jadwal.waktu_mulai_tes || '',
        auto_close: jadwal.auto_close ?? true,
        access_mode: jadwal.access_mode || 'online',
        id_jadwal_sebelumnya: jadwal.id_jadwal_sebelumnya || null,
        kategori_tes_id: jadwal.kategori_tes_id || null,
        durasi: jadwal.durasi || null,
    });

    // State terpisah untuk input date dan time
    const [dateTimeInputs, setDateTimeInputs] = useState({
        tanggal_mulai_date: '',
        tanggal_mulai_time: '',
        tanggal_berakhir_date: '',
        tanggal_berakhir_time: '',
        waktu_mulai_tes_date: '',
        waktu_mulai_tes_time: '',
    });

    // Load data saat komponen dimount
    useEffect(() => {
        // Parse tanggal mulai dan berakhir
        const tanggalMulaiParsed = parseDateTime(jadwal.tanggal_mulai);
        const tanggalBerakhirParsed = parseDateTime(jadwal.tanggal_berakhir);
        const waktuMulaiTesParsed = jadwal.waktu_mulai_tes ? parseDateTime(jadwal.waktu_mulai_tes) : { date: '', time: '' };

        // Set date time inputs
        setDateTimeInputs({
            tanggal_mulai_date: tanggalMulaiParsed.date,
            tanggal_mulai_time: tanggalMulaiParsed.time,
            tanggal_berakhir_date: tanggalBerakhirParsed.date,
            tanggal_berakhir_time: tanggalBerakhirParsed.time,
            waktu_mulai_tes_date: waktuMulaiTesParsed.date,
            waktu_mulai_tes_time: waktuMulaiTesParsed.time,
        });
    }, [jadwal]);

    // Helper untuk update data.tanggal_mulai dan data.tanggal_berakhir setiap kali input berubah
    const updateTanggalMulai = (date: string, time: string) => {
        const newDate = date ?? dateTimeInputs.tanggal_mulai_date;
        const newTime = time ?? dateTimeInputs.tanggal_mulai_time;

        const updatedInputs = {
            ...dateTimeInputs,
            tanggal_mulai_date: newDate,
            tanggal_mulai_time: newTime,
        };
        setDateTimeInputs(updatedInputs);

        if (newDate && newTime) {
            setData('tanggal_mulai', `${newDate}T${newTime}:00`);
        } else {
            setData('tanggal_mulai', '');
        }
    };

    const updateTanggalBerakhir = (date: string, time: string) => {
        const newDate = date ?? dateTimeInputs.tanggal_berakhir_date;
        const newTime = time ?? dateTimeInputs.tanggal_berakhir_time;

        const updatedInputs = {
            ...dateTimeInputs,
            tanggal_berakhir_date: newDate,
            tanggal_berakhir_time: newTime,
        };
        setDateTimeInputs(updatedInputs);

        if (newDate && newTime) {
            setData('tanggal_berakhir', `${newDate}T${newTime}:00`);
        } else {
            setData('tanggal_berakhir', '');
        }
    };

    const updateWaktuMulaiTes = (date: string, time: string) => {
        const newDate = date ?? dateTimeInputs.waktu_mulai_tes_date;
        const newTime = time ?? dateTimeInputs.waktu_mulai_tes_time;

        const updatedInputs = {
            ...dateTimeInputs,
            waktu_mulai_tes_date: newDate,
            waktu_mulai_tes_time: newTime,
        };
        setDateTimeInputs(updatedInputs);

        if (newDate && newTime) {
            setData('waktu_mulai_tes', `${newDate}T${newTime}:00`);
        } else {
            setData('waktu_mulai_tes', '');
        }
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi frontend sederhana
        if (
            !data.nama_jadwal ||
            !dateTimeInputs.tanggal_mulai_date ||
            !dateTimeInputs.tanggal_mulai_time ||
            !dateTimeInputs.tanggal_berakhir_date ||
            !dateTimeInputs.tanggal_berakhir_time ||
            !data.durasi
        ) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Semua field wajib diisi.',
            });
            return;
        }

        // Gabungkan tanggal dan waktu
        const tanggal_mulai = `${dateTimeInputs.tanggal_mulai_date}T${dateTimeInputs.tanggal_mulai_time}:00`;
        const tanggal_berakhir = `${dateTimeInputs.tanggal_berakhir_date}T${dateTimeInputs.tanggal_berakhir_time}:00`;

        let waktu_mulai_tes = '';
        if (dateTimeInputs.waktu_mulai_tes_date && dateTimeInputs.waktu_mulai_tes_time) {
            waktu_mulai_tes = `${dateTimeInputs.waktu_mulai_tes_date}T${dateTimeInputs.waktu_mulai_tes_time}:00`;
        }

        // Validasi tanggal
        const startDate = new Date(tanggal_mulai);
        const endDate = new Date(tanggal_berakhir);

        if (endDate <= startDate) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Tanggal berakhir harus setelah tanggal mulai.',
            });
            return;
        }

        // Validasi waktu mulai tes jika diisi
        if (waktu_mulai_tes) {
            const testStartDate = new Date(waktu_mulai_tes);

            if (testStartDate < startDate) {
                toast({
                    variant: 'destructive',
                    title: 'Error!',
                    description: 'Waktu mulai tes tidak boleh sebelum tanggal mulai jadwal.',
                });
                return;
            }

            if (testStartDate > endDate) {
                toast({
                    variant: 'destructive',
                    title: 'Error!',
                    description: 'Waktu mulai tes tidak boleh setelah tanggal berakhir jadwal.',
                });
                return;
            }
        }

        const diffInMilliseconds = endDate.getTime() - startDate.getTime();
        const diffInMinutes = diffInMilliseconds / (1000 * 60);

        // Validasi durasi tidak melebihi selisih waktu
        if (data.durasi! > diffInMinutes) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: `Durasi tidak boleh melebihi selisih waktu mulai dan berakhir.`,
            });
            return;
        }

        // Update jadwal
        put(route('jadwal.update', jadwal.id), {
            onSuccess: () => {
                toast({
                    variant: 'success',
                    title: 'Berhasil!',
                    description: 'Jadwal berhasil diupdate.',
                });
            },
            onError: (errors: Record<string, string>) => {
                if (errors.conflict) {
                    toast({
                        variant: 'destructive',
                        title: 'Konflik Jadwal!',
                        description: errors.conflict,
                    });
                } else if (errors.error) {
                    toast({
                        variant: 'destructive',
                        title: 'Error!',
                        description: errors.error,
                    });
                } else if (errors.tanggal_mulai) {
                    toast({
                        variant: 'destructive',
                        title: 'Error!',
                        description: errors.tanggal_mulai,
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error!',
                        description: 'Terjadi kesalahan saat mengupdate jadwal.',
                    });
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Jadwal" />
            <div className="flex h-full flex-1 flex-col gap-4 p-8">
                <div className="rounded-lg border bg-card p-8 shadow">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Edit Jadwal</h1>
                        <p className="text-muted-foreground">Edit informasi jadwal tes "{jadwal.nama_jadwal}"</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <label htmlFor="nama_jadwal" className="text-sm font-medium">
                                    Nama Jadwal
                                </label>
                                <Input
                                    id="nama_jadwal"
                                    type="text"
                                    placeholder="Masukkan nama jadwal"
                                    value={data.nama_jadwal}
                                    onChange={(e) => setData('nama_jadwal', e.target.value)}
                                    required
                                    className="text-sm"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tanggal & Waktu Mulai</label>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <Input
                                            type="date"
                                            value={dateTimeInputs.tanggal_mulai_date}
                                            onChange={(e) => updateTanggalMulai(e.target.value, dateTimeInputs.tanggal_mulai_time)}
                                            required
                                            className="text-sm"
                                        />

                                        <Input
                                            type="time"
                                            value={dateTimeInputs.tanggal_mulai_time}
                                            onChange={(e) => updateTanggalMulai(dateTimeInputs.tanggal_mulai_date, e.target.value)}
                                            required
                                            className="text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tanggal & Waktu Berakhir</label>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <Input
                                            type="date"
                                            value={dateTimeInputs.tanggal_berakhir_date}
                                            onChange={(e) => updateTanggalBerakhir(e.target.value, dateTimeInputs.tanggal_berakhir_time)}
                                            required
                                            className="text-sm"
                                        />
                                        <Input
                                            type="time"
                                            value={dateTimeInputs.tanggal_berakhir_time}
                                            onChange={(e) => updateTanggalBerakhir(dateTimeInputs.tanggal_berakhir_date, e.target.value)}
                                            required
                                            className="text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Waktu Mulai Tes (Opsional)</label>
                                <p className="text-xs text-muted-foreground mb-2">
                                    Waktu spesifik kapan peserta yang sudah disetujui bisa mulai mengerjakan tes. Jika tidak diisi, peserta bisa mulai kapan saja dalam rentang jadwal.
                                </p>
                                <div className="grid gap-2 md:grid-cols-2">
                                    <Input
                                        type="date"
                                        value={dateTimeInputs.waktu_mulai_tes_date}
                                        onChange={(e) => updateWaktuMulaiTes(e.target.value, dateTimeInputs.waktu_mulai_tes_time)}
                                        className="text-sm"
                                        placeholder="Pilih tanggal"
                                    />
                                    <Input
                                        type="time"
                                        value={dateTimeInputs.waktu_mulai_tes_time}
                                        onChange={(e) => updateWaktuMulaiTes(dateTimeInputs.waktu_mulai_tes_date, e.target.value)}
                                        className="text-sm"
                                        placeholder="Pilih waktu"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <label htmlFor="kategori_tes_id" className="text-sm font-medium">
                                        Kategori Tes
                                    </label>
                                    <Select
                                        value={data.kategori_tes_id?.toString() || 'none'}
                                        onValueChange={(value) => setData('kategori_tes_id', value === 'none' ? null : Number(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Tidak Ada</SelectItem>
                                            {kategoriTes.map((kategori) => (
                                                <SelectItem key={kategori.id} value={kategori.id.toString()}>
                                                    {kategori.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="durasi" className="text-sm font-medium">
                                        Durasi (menit)
                                    </label>
                                    <Input
                                        id="durasi"
                                        type="number"
                                        min="1"
                                        max="1440"
                                        placeholder="Durasi dalam menit"
                                        value={data.durasi || ''}
                                        onChange={(e) => setData('durasi', e.target.value ? Number(e.target.value) : null)}
                                        className="text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="access_mode" className="text-sm font-medium">
                                        Mode Akses
                                    </label>
                                    <Select
                                        value={data.access_mode}
                                        onValueChange={(value: 'online' | 'offline') => setData('access_mode', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih mode akses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="online">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-green-600">Online</span>
                                                    {/* <span className="text-xs text-muted-foreground">Dapat diakses dari mana saja</span> */}
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="offline">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-orange-600">Offline</span>
                                                    {/* <span className="text-xs text-muted-foreground">Hanya dari jaringan kampus</span> */}
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {/* <p className="text-xs text-muted-foreground">
                                        {data.access_mode === 'online' ?
                                            'Tes dapat diakses dari mana saja' :
                                            'Tes hanya dapat diakses dari jaringan kampus'
                                        }
                                    </p> */}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="id_jadwal_sebelumnya" className="text-sm font-medium">
                                    Jadwal Sebelumnya
                                </label>
                                <Select
                                    value={data.id_jadwal_sebelumnya?.toString() || 'none'}
                                    onValueChange={(value) => setData('id_jadwal_sebelumnya', value === 'none' ? null : Number(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Jadwal Sebelumnya" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tidak Ada</SelectItem>
                                        {allJadwal
                                            .filter((j) => j.id !== jadwal.id)
                                            .map((j) => (
                                                <SelectItem key={j.id} value={j.id.toString()}>
                                                    {j.nama_jadwal}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.visit(route('jadwal.index'))} disabled={processing}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
