import { Button } from '@/components/ui/button';
import { useForm, router } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import InputError from '@/components/input-error';

// Type untuk data jadwal
type JadwalData = {
    id: number;
    nama_jadwal: string;
    tanggal_mulai: string;
    tanggal_berakhir: string;
    status: string;
    auto_close?: boolean;
    id_jadwal_sebelumnya: number | null;
    created_at: string;
    updated_at: string;
};

type JadwalFormModalProps = {
    mode: 'create' | 'edit';
    trigger: React.ReactNode;
    jadwal?: JadwalData; // Data jadwal untuk edit mode
    allJadwal: JadwalData[]; // Semua jadwal untuk dropdown
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
        time: timeOnly || ''
    };
};

export default function JadwalFormModal({ mode, trigger, jadwal, allJadwal, onSuccess }: JadwalFormModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    console.log("JadwalFormModal rendered:", { mode, jadwal, isOpen });

    const { data, setData, processing, errors, reset, clearErrors } = useForm({
        nama_jadwal: '',
        tanggal_mulai: '',
        tanggal_berakhir: '',
        status: 'Buka' as 'Buka' | 'Tutup',
        auto_close: true as boolean,
        id_jadwal_sebelumnya: null as number | null,
    });

    console.log("Form state:", { data, processing, errors });

    // State terpisah untuk input date dan time
    const [dateTimeInputs, setDateTimeInputs] = useState({
        tanggal_mulai_date: '',
        tanggal_mulai_time: '',
        tanggal_berakhir_date: '',
        tanggal_berakhir_time: '',
    });

    // Function untuk load data edit
    const loadEditData = () => {
        if (mode === 'edit' && jadwal) {
            console.log("Loading edit data for jadwal:", jadwal);

            // Parse tanggal mulai dan berakhir
            const tanggalMulaiParsed = parseDateTime(jadwal.tanggal_mulai);
            const tanggalBerakhirParsed = parseDateTime(jadwal.tanggal_berakhir);

            console.log("Parsed dates:", { tanggalMulaiParsed, tanggalBerakhirParsed });

            // Use individual setData calls to avoid issues
            setData('nama_jadwal', jadwal.nama_jadwal || '');
            setData('tanggal_mulai', jadwal.tanggal_mulai || '');
            setData('tanggal_berakhir', jadwal.tanggal_berakhir || '');
            setData('status', (jadwal.status as 'Buka' | 'Tutup') || 'Buka');
            setData('auto_close', jadwal.auto_close ?? true);
            setData('id_jadwal_sebelumnya', jadwal.id_jadwal_sebelumnya || null);

            // Set date time inputs
            setDateTimeInputs({
                tanggal_mulai_date: tanggalMulaiParsed.date,
                tanggal_mulai_time: tanggalMulaiParsed.time,
                tanggal_berakhir_date: tanggalBerakhirParsed.date,
                tanggal_berakhir_time: tanggalBerakhirParsed.time,
            });

            console.log("Form data loaded:", {
                nama_jadwal: jadwal.nama_jadwal,
                dateTimeInputs: {
                    tanggal_mulai_date: tanggalMulaiParsed.date,
                    tanggal_mulai_time: tanggalMulaiParsed.time,
                    tanggal_berakhir_date: tanggalBerakhirParsed.date,
                    tanggal_berakhir_time: tanggalBerakhirParsed.time,
                }
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
    }, [isOpen, mode, jadwal?.id]);    // Reset form saat modal ditutup
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
    }, [isOpen, reset, clearErrors]);    // Reset form saat modal ditutup
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
        if (!data.nama_jadwal || !dateTimeInputs.tanggal_mulai_date || !dateTimeInputs.tanggal_mulai_time ||
            !dateTimeInputs.tanggal_berakhir_date || !dateTimeInputs.tanggal_berakhir_time) {
            toast({
                variant: "destructive",
                title: "Error!",
                description: "Semua field wajib diisi.",
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
                    variant: "destructive",
                    title: "Error!",
                    description: "Tanggal mulai harus setelah waktu sekarang.",
                });
                return;
            }
        }

        if (endDate <= startDate) {
            toast({
                variant: "destructive",
                title: "Error!",
                description: "Tanggal berakhir harus setelah tanggal mulai.",
            });
            return;
        }

        // Buat payload data yang akan dikirim
        const submitData: Record<string, string | number | boolean | null> = {
            nama_jadwal: data.nama_jadwal,
            tanggal_mulai,
            tanggal_berakhir,
            status: data.status,
            auto_close: data.auto_close,
            id_jadwal_sebelumnya: data.id_jadwal_sebelumnya,
        };

        // Tambahkan method spoofing untuk edit
        if (mode === 'edit') {
            submitData._method = 'PUT';
        }

        console.log(`${mode === 'create' ? 'Creating' : 'Updating'} jadwal with data:`, submitData);

        // Pilih route berdasarkan mode
        const routeName = mode === 'create' ? 'jadwal.store' : 'jadwal.update';
        const routeParams = mode === 'edit' && jadwal ? jadwal.id : undefined;

        router.post(route(routeName, routeParams), submitData, {
            onSuccess: () => {
                toast({
                    variant: "success",
                    title: "Berhasil!",
                    description: `Jadwal berhasil ${mode === 'create' ? 'ditambahkan' : 'diupdate'}.`,
                });
                setIsOpen(false);
                onSuccess();
            },
            onError: (errors: Record<string, string>) => {
                console.log("Validation errors:", errors);
                // Handle validation errors
                if (errors.conflict) {
                    toast({
                        variant: "destructive",
                        title: "Konflik Jadwal!",
                        description: errors.conflict,
                    });
                } else if (errors.error) {
                    toast({
                        variant: "destructive",
                        title: "Error!",
                        description: errors.error,
                    });
                } else if (errors.tanggal_mulai) {
                    toast({
                        variant: "destructive",
                        title: "Error!",
                        description: errors.tanggal_mulai,
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Error!",
                        description: `Terjadi kesalahan saat ${mode === 'create' ? 'menyimpan' : 'mengupdate'} jadwal.`,
                    });
                }
            }
        });
    };

    const title = mode === 'create' ? 'Tambah Jadwal Baru' : 'Edit Jadwal';
    const description = mode === 'create'
        ? 'Isi form di bawah untuk menambahkan jadwal tes baru.'
        : `Edit informasi jadwal tes "${jadwal?.nama_jadwal}".`;
    const submitButtonText = mode === 'create' ? 'Simpan Jadwal' : 'Update Jadwal';

    return (
        <Dialog key={`${mode}-${jadwal?.id || 'new'}`} open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
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
                            {errors.nama_jadwal && (
                                <InputError message={errors.nama_jadwal} />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`${mode}_tanggal_mulai`}>Tanggal & Waktu Mulai</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Input
                                            id={`${mode}_tanggal_mulai_date`}
                                            type="date"
                                            value={dateTimeInputs.tanggal_mulai_date}
                                            onChange={(e) => setDateTimeInputs(prev => ({
                                                ...prev,
                                                tanggal_mulai_date: e.target.value
                                            }))}
                                            required
                                            disabled={processing}
                                            readOnly={false}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            id={`${mode}_tanggal_mulai_time`}
                                            type="time"
                                            value={dateTimeInputs.tanggal_mulai_time}
                                            onChange={(e) => setDateTimeInputs(prev => ({
                                                ...prev,
                                                tanggal_mulai_time: e.target.value
                                            }))}
                                            required
                                            disabled={processing}
                                            readOnly={false}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                {errors.tanggal_mulai && (
                                    <InputError message={errors.tanggal_mulai} />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`${mode}_tanggal_berakhir`}>Tanggal & Waktu Berakhir</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Input
                                            id={`${mode}_tanggal_berakhir_date`}
                                            type="date"
                                            value={dateTimeInputs.tanggal_berakhir_date}
                                            onChange={(e) => setDateTimeInputs(prev => ({
                                                ...prev,
                                                tanggal_berakhir_date: e.target.value
                                            }))}
                                            required
                                            disabled={processing}
                                            readOnly={false}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            id={`${mode}_tanggal_berakhir_time`}
                                            type="time"
                                            value={dateTimeInputs.tanggal_berakhir_time}
                                            onChange={(e) => setDateTimeInputs(prev => ({
                                                ...prev,
                                                tanggal_berakhir_time: e.target.value
                                            }))}
                                            required
                                            disabled={processing}
                                            readOnly={false}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                {errors.tanggal_berakhir && (
                                    <InputError message={errors.tanggal_berakhir} />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor={`${mode}_status`}>Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value: 'Buka' | 'Tutup') => setData('status', value)}
                                    disabled={processing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Buka">Buka</SelectItem>
                                        <SelectItem value="Tutup">Tutup</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <InputError message={errors.status} />
                                )}
                            </div>
                            <div>
                                <Label htmlFor={`${mode}_id_jadwal_sebelumnya`}>Jadwal Sebelumnya</Label>
                                <Select
                                    value={data.id_jadwal_sebelumnya?.toString() || "0"}
                                    onValueChange={(value) => setData('id_jadwal_sebelumnya', value === "0" ? null : parseInt(value))}
                                    disabled={processing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jadwal sebelumnya" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Tidak ada</SelectItem>
                                        {allJadwal && allJadwal.length > 0 ? allJadwal
                                            .filter(j => mode === 'create' || j.id !== jadwal?.id) // Exclude current item in edit mode
                                            .map((j) => (
                                                <SelectItem key={j.id} value={j.id.toString()}>
                                                    {j.nama_jadwal}
                                                </SelectItem>
                                            )) : null}
                                    </SelectContent>
                                </Select>
                                {errors.id_jadwal_sebelumnya && (
                                    <InputError message={errors.id_jadwal_sebelumnya} />
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            className='cursor-pointer'
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className='cursor-pointer'
                            disabled={processing}
                        >
                            {processing ? 'Menyimpan...' : submitButtonText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
