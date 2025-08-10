import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        console.log('Academic form data being sent:', data);
        console.log('Current user data:', user);

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
                                            // Only allow numbers and limit to exactly 13 characters
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

                                {/* Program Studi */}
                                <div className="space-y-2">
                                    <Label htmlFor="prodi">Program Studi</Label>
                                    <Input
                                        id="prodi"
                                        value={data.prodi}
                                        onChange={(e) => setData('prodi', e.target.value)}
                                        autoComplete="prodi"
                                        placeholder="Masukkan program studi Anda"
                                    />
                                    <InputError message={errors.prodi} />
                                </div>

                                {/* Fakultas */}
                                <div className="space-y-2">
                                    <Label htmlFor="fakultas">Fakultas</Label>
                                    <Input
                                        id="fakultas"
                                        value={data.fakultas}
                                        onChange={(e) => setData('fakultas', e.target.value)}
                                        autoComplete="fakultas"
                                        placeholder="Masukkan fakultas Anda"
                                    />
                                    <p className="text-xs text-muted-foreground">Tidak perlu disingkat. Contoh: Fakultas Ilmu Komputer</p>
                                    <InputError message={errors.fakultas} />
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
