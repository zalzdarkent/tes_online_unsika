import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// Type untuk data jadwal
type JadwalData = {
    id: number;
    nama_jadwal: string;
    tanggal_mulai: string;
    tanggal_berakhir: string;
    // status: string; // status tidak perlu diinput manual
    auto_close?: boolean;
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

type JadwalFormModalProps = {
    mode: 'create' | 'edit';
    trigger: React.ReactNode;
    jadwal?: JadwalData; // Data jadwal untuk edit mode
    allJadwal: JadwalData[]; // Semua jadwal untuk dropdown
    kategoriTes: KategoriTesData[]; // Data kategori tes untuk dropdown
    onSuccess: () => void; // Callback setelah berhasil
};

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

export default function JadwalFormModal({ mode, trigger, jadwal, allJadwal, kategoriTes, onSuccess }: JadwalFormModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    console.log('JadwalFormModal rendered:', { mode, jadwal, isOpen });

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nama_jadwal: '',
        tanggal_mulai: '',
        tanggal_berakhir: '',
        auto_close: true as boolean,
        id_jadwal_sebelumnya: null as number | null,
        kategori_tes_id: null as number | null,
        durasi: null as number | null,
    });

    console.log('Form state:', { data, processing, errors });

    // State terpisah untuk input date dan time
    const [dateTimeInputs, setDateTimeInputs] = useState({
        tanggal_mulai_date: '',
        tanggal_mulai_time: '',
        tanggal_berakhir_date: '',
        tanggal_berakhir_time: '',
    });

    // Helper untuk update data.tanggal_mulai dan data.tanggal_berakhir setiap kali input berubah
    const updateTanggalMulai = (date: string, time: string) => {
        setDateTimeInputs((prev) => {
            const next = { ...prev, tanggal_mulai_date: date ?? prev.tanggal_mulai_date, tanggal_mulai_time: time ?? prev.tanggal_mulai_time };
            if (next.tanggal_mulai_date && next.tanggal_mulai_time) {
                setData('tanggal_mulai', `${next.tanggal_mulai_date}T${next.tanggal_mulai_time}:00`);
            } else {
                setData('tanggal_mulai', '');
            }
            return next;
        });
    };
    const updateTanggalBerakhir = (date: string, time: string) => {
        setDateTimeInputs((prev) => {
            const next = {
                ...prev,
                tanggal_berakhir_date: date ?? prev.tanggal_berakhir_date,
                tanggal_berakhir_time: time ?? prev.tanggal_berakhir_time,
            };
            if (next.tanggal_berakhir_date && next.tanggal_berakhir_time) {
                setData('tanggal_berakhir', `${next.tanggal_berakhir_date}T${next.tanggal_berakhir_time}:00`);
            } else {
                setData('tanggal_berakhir', '');
            }
            return next;
        });
    };
    // Function untuk load data edit
    const loadEditData = () => {
        if (mode === 'edit' && jadwal) {
            console.log('Loading edit data for jadwal:', jadwal);

            // Parse tanggal mulai dan berakhir
            const tanggalMulaiParsed = parseDateTime(jadwal.tanggal_mulai);
            const tanggalBerakhirParsed = parseDateTime(jadwal.tanggal_berakhir);

            console.log('Parsed dates:', { tanggalMulaiParsed, tanggalBerakhirParsed });

            // Use individual setData calls to avoid issues
            setData('nama_jadwal', jadwal.nama_jadwal || '');
            setData('tanggal_mulai', jadwal.tanggal_mulai || '');
            setData('tanggal_berakhir', jadwal.tanggal_berakhir || '');
            // status tidak perlu di-set manual
            setData('auto_close', jadwal.auto_close ?? true);
            setData('id_jadwal_sebelumnya', jadwal.id_jadwal_sebelumnya || null);
            setData('kategori_tes_id', jadwal.kategori_tes_id || null);
            setData('durasi', jadwal.durasi || null);

            // Set date time inputs
            setDateTimeInputs({
                tanggal_mulai_date: tanggalMulaiParsed.date,
                tanggal_mulai_time: tanggalMulaiParsed.time,
                tanggal_berakhir_date: tanggalBerakhirParsed.date,
                tanggal_berakhir_time: tanggalBerakhirParsed.time,
            });

            console.log('Form data loaded:', {
                nama_jadwal: jadwal.nama_jadwal,
                dateTimeInputs: {
                    tanggal_mulai_date: tanggalMulaiParsed.date,
                    tanggal_mulai_time: tanggalMulaiParsed.time,
                    tanggal_berakhir_date: tanggalBerakhirParsed.date,
                    tanggal_berakhir_time: tanggalBerakhirParsed.time,
                },
            });
        }
    };

    // Load data saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            clearErrors();

            if (mode === 'edit' && jadwal) {
                loadEditData();
            } else {
                // Reset untuk create mode
                reset();
                setDateTimeInputs({
                    tanggal_mulai_date: '',
                    tanggal_mulai_time: '',
                    tanggal_berakhir_date: '',
                    tanggal_berakhir_time: '',
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode, jadwal?.id]); // Reset form saat modal ditutup
    useEffect(() => {
        if (!isOpen) {
            reset();
            setDateTimeInputs({
                tanggal_mulai_date: '',
                tanggal_mulai_time: '',
                tanggal_berakhir_date: '',
                tanggal_berakhir_time: '',
            });
            clearErrors();
        }
    }, [isOpen, reset, clearErrors]); // Reset form saat modal ditutup
    useEffect(() => {
        if (!isOpen) {
            reset();
            setDateTimeInputs({
                tanggal_mulai_date: '',
                tanggal_mulai_time: '',
                tanggal_berakhir_date: '',
                tanggal_berakhir_time: '',
            });
            clearErrors();
        }
    }, [isOpen, reset, clearErrors]);

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

        // Validasi tanggal
        const startDate = new Date(tanggal_mulai);
        const endDate = new Date(tanggal_berakhir);

        if (mode === 'create') {
            const now = new Date();
            if (startDate <= now) {
                toast({
                    variant: 'destructive',
                    title: 'Error!',
                    description: 'Tanggal mulai harus setelah waktu sekarang.',
                });
                return;
            }
        }

        if (endDate <= startDate) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: 'Tanggal berakhir harus setelah tanggal mulai.',
            });
            return;
        }

        // Hitung selisih tanggal mulai dan berakhir dalam menit
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

        // Buat payload data yang akan dikirim
        const submitData: Record<string, string | number | boolean | null> = {
            nama_jadwal: data.nama_jadwal,
            tanggal_mulai,
            tanggal_berakhir,
            auto_close: data.auto_close,
            id_jadwal_sebelumnya: data.id_jadwal_sebelumnya,
            kategori_tes_id: data.kategori_tes_id,
            durasi: data.durasi,
        };

        console.log(`${mode === 'create' ? 'Creating' : 'Updating'} jadwal with data:`, submitData);

        // Pilih route dan method berdasarkan mode
        if (mode === 'create') {
            post(route('jadwal.store'), {
                onSuccess: () => {
                    toast({
                        variant: 'success',
                        title: 'Berhasil!',
                        description: 'Jadwal berhasil ditambahkan.',
                    });
                    setIsOpen(false);
                    onSuccess();
                },
                onError: handleFormErrors,
            });
        } else if (mode === 'edit' && jadwal) {
            put(route('jadwal.update', jadwal.id), {
                onSuccess: () => {
                    toast({
                        variant: 'success',
                        title: 'Berhasil!',
                        description: 'Jadwal berhasil diupdate.',
                    });
                    setIsOpen(false);
                    onSuccess();
                    // Force reload data supaya UI tidak freeze
                    if (typeof router !== 'undefined' && router.reload) {
                        setTimeout(() => router.reload({ only: ['jadwal'] }), 100);
                    }
                },
                onError: handleFormErrors,
            });
        }
    };

    const handleFormErrors = (errors: Record<string, string>) => {
        console.log('Validation errors:', errors);
        // Handle validation errors
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
                description: `Terjadi kesalahan saat ${mode === 'create' ? 'menyimpan' : 'mengupdate'} jadwal.`,
            });
        }
    };

    const title = mode === 'create' ? 'Tambah Jadwal Baru' : 'Edit Jadwal';
    const description =
        mode === 'create' ? 'Isi form di bawah untuk menambahkan jadwal tes baru.' : `Edit informasi jadwal tes "${jadwal?.nama_jadwal}".`;
    const submitButtonText = mode === 'create' ? 'Simpan Jadwal' : 'Update Jadwal';

    return (
        <Dialog key={`${mode}-${jadwal?.id || 'new'}`} open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-background text-foreground shadow-xl sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label htmlFor={`${mode}_nama_jadwal`}>Nama Jadwal</Label>
                            <Input
                                id={`${mode}_nama_jadwal`}
                                type="text"
                                placeholder="Masukkan nama jadwal"
                                value={data.nama_jadwal}
                                onChange={(e) => setData('nama_jadwal', e.target.value)}
                                required
                                disabled={processing}
                                readOnly={false}
                            />
                            {errors.nama_jadwal && <InputError message={errors.nama_jadwal} />}
                        </div>

                        <div className="grid grid-cols-1 space-y-2 md:grid-cols-2 md:gap-4 md:space-y-0">
                            <div className="space-y-2">
                                <Label htmlFor={`${mode}_tanggal_mulai`}>Tanggal & Waktu Mulai</Label>
                                <div className="grid grid-cols-1 space-y-2 md:grid-cols-2 md:gap-2 md:space-y-0">
                                    <div>
                                        <Input
                                            id={`${mode}_tanggal_mulai_date`}
                                            type="date"
                                            value={dateTimeInputs.tanggal_mulai_date}
                                            onChange={(e) => updateTanggalMulai(e.target.value, dateTimeInputs.tanggal_mulai_time)}
                                            required
                                            disabled={processing}
                                            readOnly={false}
                                            className="flex justify-center"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            id={`${mode}_tanggal_mulai_time`}
                                            type="time"
                                            value={dateTimeInputs.tanggal_mulai_time}
                                            onChange={(e) => updateTanggalMulai(dateTimeInputs.tanggal_mulai_date, e.target.value)}
                                            required
                                            disabled={processing}
                                            readOnly={false}
                                            className="flex justify-center"
                                        />
                                    </div>
                                </div>
                                {errors.tanggal_mulai && <InputError message={errors.tanggal_mulai} />}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`${mode}_tanggal_berakhir`}>Tanggal & Waktu Berakhir</Label>
                                <div className="grid grid-cols-1 space-y-2 md:grid-cols-2 md:gap-2 md:space-y-0">
                                    <div>
                                        <Input
                                            id={`${mode}_tanggal_berakhir_date`}
                                            type="date"
                                            value={dateTimeInputs.tanggal_berakhir_date}
                                            onChange={(e) => updateTanggalBerakhir(e.target.value, dateTimeInputs.tanggal_berakhir_time)}
                                            required
                                            disabled={processing}
                                            readOnly={false}
                                            className="flex justify-center"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            id={`${mode}_tanggal_berakhir_time`}
                                            type="time"
                                            value={dateTimeInputs.tanggal_berakhir_time}
                                            onChange={(e) => updateTanggalBerakhir(dateTimeInputs.tanggal_berakhir_date, e.target.value)}
                                            required
                                            disabled={processing}
                                            readOnly={false}
                                            className="flex justify-center"
                                        />
                                    </div>
                                </div>
                                {errors.tanggal_berakhir && <InputError message={errors.tanggal_berakhir} />}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor={`${mode}_kategori_tes_id`}>Kategori Tes</Label>
                                <Select
                                    value={data.kategori_tes_id?.toString() || '0'}
                                    onValueChange={(value) => setData('kategori_tes_id', value === '0' ? null : parseInt(value))}
                                    disabled={processing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori tes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Tidak ada</SelectItem>
                                        {kategoriTes && kategoriTes.length > 0
                                            ? kategoriTes.map((kategori) => (
                                                  <SelectItem key={kategori.id} value={kategori.id.toString()}>
                                                      {kategori.nama}
                                                  </SelectItem>
                                              ))
                                            : null}
                                    </SelectContent>
                                </Select>
                                {errors.kategori_tes_id && <InputError message={errors.kategori_tes_id} />}
                            </div>
                            <div>
                                <Label htmlFor={`${mode}_durasi`}>Durasi (menit)</Label>
                                <Input
                                    id={`${mode}_durasi`}
                                    type="number"
                                    placeholder="Masukkan durasi dalam menit"
                                    value={data.durasi?.toString() || ''}
                                    onChange={(e) => setData('durasi', e.target.value ? parseInt(e.target.value) : null)}
                                    min="1"
                                    max="1440"
                                    disabled={processing}
                                    readOnly={false}
                                />
                                {errors.durasi && <InputError message={errors.durasi} />}
                                <div className="mt-1 text-xs text-muted-foreground">Maksimal 1440 menit (24 jam)</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor={`${mode}_id_jadwal_sebelumnya`}>Jadwal Sebelumnya</Label>
                                <Select
                                    value={data.id_jadwal_sebelumnya?.toString() || '0'}
                                    onValueChange={(value) => setData('id_jadwal_sebelumnya', value === '0' ? null : parseInt(value))}
                                    disabled={processing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jadwal sebelumnya" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Tidak ada</SelectItem>
                                        {allJadwal && allJadwal.length > 0
                                            ? allJadwal
                                                  .filter((j) => mode === 'create' || j.id !== jadwal?.id) // Exclude current item in edit mode
                                                  .map((j) => (
                                                      <SelectItem key={j.id} value={j.id.toString()}>
                                                          {j.nama_jadwal}
                                                      </SelectItem>
                                                  ))
                                            : null}
                                    </SelectContent>
                                </Select>
                                {errors.id_jadwal_sebelumnya && <InputError message={errors.id_jadwal_sebelumnya} />}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" className="cursor-pointer" variant="outline" onClick={() => setIsOpen(false)} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" className="cursor-pointer" disabled={processing}>
                            {processing ? 'Menyimpan...' : submitButtonText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
