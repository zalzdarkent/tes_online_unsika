import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Camera, GraduationCap, User } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan Profil',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    username: string;
    nama: string;
    email: string;
    alamat: string;
    no_hp: string;
    foto: File | null;
    prodi: string;
    fakultas: string;
    universitas: string;
    npm: string;
    _method?: string;
};

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user as {
        username: string;
        nama?: string;
        email: string;
        alamat?: string;
        no_hp?: string;
        foto?: string;
        prodi?: string;
        fakultas?: string;
        universitas?: string;
        npm?: string;
    };

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm<ProfileForm>({
        username: user.username || '',
        nama: user.nama || '',
        email: user.email || '',
        alamat: user.alamat || '',
        no_hp: user.no_hp || '',
        foto: null,
        prodi: user.prodi || '',
        fakultas: user.fakultas || '',
        universitas: user.universitas || '',
        npm: user.npm || '',
        _method: 'patch',
    });

    // State for foto preview
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);

    // Cleanup preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (fotoPreview) {
                URL.revokeObjectURL(fotoPreview);
            }
        };
    }, [fotoPreview]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        console.log('Form data being sent:', data);

        // Use POST with _method: 'patch' for file uploads
        post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                // Clean up preview URL after successful submit
                if (fotoPreview) {
                    URL.revokeObjectURL(fotoPreview);
                    setFotoPreview(null);
                }
                // Reset foto in form data
                setData('foto', null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Profil" />

            <SettingsLayout>
                <div className="space-y-6">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Personal Information Card */}
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Pribadi
                                </CardTitle>
                                <CardDescription>Perbarui informasi pribadi Anda</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Foto Profile */}
                                <div className="space-y-2">
                                    <Label htmlFor="foto" className="flex items-center gap-2">
                                        <Camera className="h-4 w-4" />
                                        Foto Profil
                                    </Label>
                                    <div className="space-y-3">
                                        {/* Current Photo or Preview */}
                                        {(fotoPreview || user.foto) && (
                                            <div className="flex items-center gap-3">
                                                <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-muted">
                                                    <img
                                                        src={fotoPreview || `/storage/${user.foto}`}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {fotoPreview ? 'New photo preview' : 'Current photo'}
                                                </div>
                                            </div>
                                        )}
                                        <Input
                                            id="foto"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    // Cleanup previous preview URL
                                                    if (fotoPreview) {
                                                        URL.revokeObjectURL(fotoPreview);
                                                    }

                                                    setData('foto', file);
                                                    // Create new preview URL
                                                    const previewUrl = URL.createObjectURL(file);
                                                    setFotoPreview(previewUrl);
                                                }
                                            }}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground">Format yang didukung: JPG, PNG, GIF. Ukuran maksimum: 2MB.</p>
                                    </div>
                                    <InputError message={errors.foto} />
                                </div>

                                {/* Username */}
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="Masukkan username Anda"
                                    />
                                    <InputError message={errors.username} />
                                </div>

                                {/* Nama Lengkap */}
                                <div className="space-y-2">
                                    <Label htmlFor="nama">Nama Lengkap</Label>
                                    <Input
                                        id="nama"
                                        value={data.nama}
                                        onChange={(e) => setData('nama', e.target.value)}
                                        required
                                        autoComplete="name"
                                        placeholder="Masukkan nama lengkap Anda"
                                    />
                                    <InputError message={errors.nama} />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Alamat Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        autoComplete="email"
                                        placeholder="Masukkan alamat email Anda"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* No HP */}
                                <div className="space-y-2">
                                    <Label htmlFor="no_hp" className="flex items-center gap-2">
                                        Nomor Handphone
                                    </Label>
                                    <Input
                                        id="no_hp"
                                        type="tel"
                                        value={data.no_hp}
                                        onChange={(e) => setData('no_hp', e.target.value)}
                                        autoComplete="tel"
                                        placeholder="Masukkan nomor handphone Anda"
                                    />
                                    <p className="text-xs text-muted-foreground">Diawali dengan 62. Tanpa strip. Contoh: 6281234567890</p>
                                    <InputError message={errors.no_hp} />
                                </div>

                                {/* Alamat */}
                                <div className="space-y-2">
                                    <Label htmlFor="alamat" className="flex items-center gap-2">
                                        Alamat Lengkap
                                    </Label>
                                    <Textarea
                                        id="alamat"
                                        value={data.alamat}
                                        onChange={(e) => setData('alamat', e.target.value)}
                                        placeholder="Masukkan alamat lengkap Anda"
                                        rows={3}
                                    />
                                    <InputError message={errors.alamat} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* academic information */}
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
                                        onChange={(e) => setData('npm', e.target.value)}
                                        required
                                        autoComplete="nama"
                                        placeholder="Masukkan NPM/NIM Anda"
                                    />
                                    <InputError message={errors.prodi} />
                                </div>

                                {/* program studi */}
                                <div className="space-y-2">
                                    <Label htmlFor="prodi">Program Studi</Label>
                                    <Input
                                        id="prodi"
                                        value={data.prodi}
                                        onChange={(e) => setData('prodi', e.target.value)}
                                        required
                                        autoComplete="nama"
                                        placeholder="Masukkan program studi Anda"
                                    />
                                    <InputError message={errors.prodi} />
                                </div>

                                {/* fakultas */}
                                <div className="space-y-2">
                                    <Label htmlFor="fakultas">Fakultas</Label>
                                    <Input
                                        id="fakultas"
                                        value={data.fakultas}
                                        onChange={(e) => setData('fakultas', e.target.value)}
                                        required
                                        autoComplete="fakultas"
                                        placeholder="Masukkan fakultas Anda"
                                    />
                                    <p className="text-xs text-muted-foreground">Tidak perlu disingkat. Contoh: Fakultas Ilmu Komputer</p>
                                    <InputError message={errors.fakultas} />
                                </div>

                                {/* universitas */}
                                <div className="space-y-2">
                                    <Label htmlFor="universitas">Universitas</Label>
                                    <Input
                                        id="universitas"
                                        value={data.universitas}
                                        onChange={(e) => setData('universitas', e.target.value)}
                                        required
                                        autoComplete="universitas"
                                        placeholder="Masukkan asal universitas Anda"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Tidak perlu disingkat. Contoh: Universitas Singaperbangsa Karawang
                                    </p>
                                    <InputError message={errors.fakultas} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Email Verification Notice */}
                        {mustVerifyEmail && user.email === null && (
                            <Card className="border-amber-200 bg-amber-50">
                                <CardContent className="pt-6">
                                    <p className="text-sm text-amber-800">
                                        Your email address is unverified.{' '}
                                        <Link
                                            href={route('verification.send')}
                                            method="post"
                                            as="button"
                                            className="text-amber-900 underline hover:no-underline"
                                        >
                                            Click here to resend the verification email.
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 text-sm font-medium text-green-600">
                                            A new verification link has been sent to your email address.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Submit Button */}
                        <div className="flex items-center gap-4">
                            <Button disabled={processing} size="lg">
                                {processing ? 'Memperbarui...' : 'Perbarui'}
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm font-medium text-green-600">Perubahan berhasil disimpan!</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
