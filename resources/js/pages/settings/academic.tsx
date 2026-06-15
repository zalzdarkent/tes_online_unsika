import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { GraduationCap } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Info Akademik',
        href: '/settings/academic',
    },
];

type AcademicForm = {
    username: string;
    nama: string;
    email: string;
    alamat: string;
    no_hp: string;
    prodi: string;
    fakultas: string;
    universitas: string;
    npm: string;
    redirect_to: string;
    _method?: string;
};

export default function Academic() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user as {
        username: string;
        nama?: string;
        email: string;
        alamat?: string;
        no_hp?: string;
        prodi?: string;
        fakultas?: string;
        universitas?: string;
        npm?: string;
        
    };

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm<AcademicForm>({
        username: user.username || '',
        nama: user.nama || '',
        email: user.email || '',
        alamat: user.alamat || '',
        no_hp: user.no_hp || '',
        prodi: user.prodi || '',
        fakultas: user.fakultas || '',
        universitas: user.universitas || '',
        npm: user.npm || '',
        
        redirect_to: 'academic',
        _method: 'patch',
    });

    const submit = async (e: FormEvent) => {
        e.preventDefault();

        console.log('Academic form data being sent:', data);
        console.log('Current user data:', user);

        const windowWithRefresh = window as unknown as { refreshCSRFToken?: () => Promise<string | null> };
        if (windowWithRefresh.refreshCSRFToken) {
            await windowWithRefresh.refreshCSRFToken();
        }

        // Use POST with _method: 'patch' for academic info update
        post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Academic info updated successfully');
            },
            onError: (errors) => {
                console.log('Update failed with errors:', errors);
            },
        });
    };

    const fakultasOptions = [
        'Fakultas Hukum',
        'Fakultas Ekonomi',
        'Fakultas Keguruan dan Ilmu Pendidikan',
        'Fakultas Pertanian',
        'Fakultas Teknik',
        'Fakultas Ilmu Komputer',
        'Fakultas Ilmu Sosial dan Ilmu Politik',
        'Fakultas Agama Islam',
        'Fakultas Ilmu Kesehatan',
    ];

    const prodiMap: Record<string, string[]> = {
        'Fakultas Hukum': [
            'Ilmu Hukum (S1)',
            'Ilmu Hukum (S2)',
        ],
        'Fakultas Ekonomi': [
            'Manajemen (S1)',
            'Manajemen (S2)',
            'Akuntansi (D3)',
            'Akuntansi (S1)',
        ],
        'Fakultas Keguruan dan Ilmu Pendidikan': [
            'Pend. Matematika (S1)',
            'Pend. Matematika (S2)',
            'Pend. Luar Sekolah (S1)',
            'Pend. Bahasa & Sastra Indonesia (S1)',
            'Pend. Jasmani, Kesehatan & Rekreasi (S1)',
            'Pend. Jasmani, Kesehatan & Rekreasi (S2)',
            'Pend. Bahasa Inggris (S1)',
            'Pend. Masyarakat (S1)',
            'Administrasi Pendidikan (S2)',
        ],
        'Fakultas Pertanian': [
            'Agroteknologi (S1)',
            'Agrobisnis (S1)',
            'Ilmu Pertanian (S2)',
        ],
        'Fakultas Teknik': [
            'Teknik Mesin (D3)',
            'Teknik Mesin (S1)',
            'Teknik Kimia (S1)',
            'Teknik Elektro (S1)',
            'Teknik Industri (S1)',
            'Teknik Lingkungan (S1)',
            'Teknik Sipil (S1)',
            'Fisika (S1)',
        ],
        'Fakultas Ilmu Komputer': [
            'Informatika (S1)',
            'Sistem Informasi (S1)',
        ],
        'Fakultas Ilmu Sosial dan Ilmu Politik': [
            'Ilmu Komunikasi (S1)',
            'Ilmu Pemerintahan (S1)',
            'Hubungan Internasional (S1)',
        ],
        'Fakultas Agama Islam': [
            'Pend. Agama Islam (S1)',
            'Pend. Agama Islam (S2)',
            'Manajemen Pendidikan Islam (S1)',
            'Pendidikan Islam Anak Usia Dini (S1)',
        ],
        'Fakultas Ilmu Kesehatan': [
            'Kebidanan (D3)',
            'Ilmu Keolahragaan (S1)',
            'Ilmu Gizi (S1)',
            'Farmasi (S1)',
            'Administrasi Rumah Sakit (S1)',
        ],
    };

    const availableProdi = (() => {
        const fakultas = data.fakultas;
        if (!fakultas) return [];
        return prodiMap[fakultas] ?? [];
    })();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Info Akademik" />

            <SettingsLayout>
                <div className="space-y-6">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Academic Information Card */}
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    Informasi Akademik
                                </CardTitle>
                                <CardDescription>Perbarui informasi akademik Anda</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* NPM/NIM */}
                                <div className="space-y-2">
                                    <Label htmlFor="npm">NPM/NIM</Label>
                                    <Input
                                        id="npm"
                                        value={data.npm}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*$/.test(value) && value.length <= 13) {
                                                setData('npm', value);
                                            }
                                        }}
                                        autoComplete="npm"
                                        placeholder="Masukkan NPM/NIM Anda (tepat 13 digit angka)"
                                        maxLength={13}
                                        inputMode="numeric"
                                        pattern="[0-9]{13}"
                                        className={data.npm && data.npm.length !== 13 && data.npm.length > 0 ? 'border-orange-300 focus:border-orange-500' : ''}
                                    />
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground">NPM/NIM harus tepat 13 digit angka</p>
                                        <span className={`text-xs font-mono ${
                                            data.npm.length === 13 ? 'text-green-600' :
                                            data.npm.length > 0 ? 'text-orange-600' : 'text-muted-foreground'
                                        }`}>
                                            {data.npm.length}/13
                                        </span>
                                    </div>
                                    {data.npm && data.npm.length > 0 && data.npm.length !== 13 && (
                                        <p className="text-xs text-orange-600">NPM/NIM harus tepat 13 digit</p>
                                    )}
                                    <InputError message={errors.npm} />
                                </div>
                                
                                {/* Universitas */}
                                <div className="space-y-2">
                                    <Label htmlFor="universitas">Universitas</Label>
                                    <Input
                                        id="universitas"
                                        value={data.universitas}
                                        onChange={(e) => setData('universitas', e.target.value)}
                                        autoComplete="universitas"
                                        placeholder="Masukkan asal universitas Anda"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Tidak perlu disingkat. Contoh: Universitas Singaperbangsa Karawang
                                    </p>
                                    <InputError message={errors.universitas} />
                                </div>

                                {/* Fakultas */}
                                <div className="space-y-2">
                                    <Label htmlFor="fakultas">Fakultas</Label>
                                    <Select
                                        value={data.fakultas}
                                        onValueChange={(v) => {
                                            setData('fakultas', v);
                                            setData('prodi', '');
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih fakultas..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fakultasOptions.map((opt) => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Pilih fakultas Anda dari daftar.</p>
                                    <InputError message={errors.fakultas} />
                                </div>



                                {/* Program Studi */}
                                <div className="space-y-2">
                                    <Label htmlFor="prodi">Program Studi</Label>
                                    <Select value={data.prodi} onValueChange={(v) => setData('prodi', v)}>
                                        <SelectTrigger className={`w-full ${availableProdi.length === 0 ? 'opacity-60 pointer-events-none' : ''}`}>
                                            <SelectValue placeholder={availableProdi.length === 0 ? 'Pilih fakultas terlebih dahulu' : 'Pilih program studi'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableProdi.map((p) => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.prodi} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex items-center gap-4">
                            <Button disabled={processing} size="lg">
                                {processing ? 'Memperbarui...' : 'Perbarui Info Akademik'}
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm font-medium text-green-600">Info akademik berhasil disimpan!</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
