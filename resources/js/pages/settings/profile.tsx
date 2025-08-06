import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Camera } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
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
    };

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm<ProfileForm>({
        username: user.username || '',
        nama: user.nama || '',
        email: user.email || '',
        alamat: user.alamat || '',
        no_hp: user.no_hp || '',
        foto: null,
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
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your profile information and personal details" />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Personal Information Card */}
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription>
                                        Update your basic personal information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Foto Profile */}
                                    <div className="space-y-2">
                                        <Label htmlFor="foto" className="flex items-center gap-2">
                                            <Camera className="h-4 w-4" />
                                            Profile Photo
                                        </Label>
                                        <div className="space-y-3">
                                            {/* Current Photo or Preview */}
                                            {(fotoPreview || user.foto) && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border">
                                                        <img
                                                            src={fotoPreview || `/storage/${user.foto}`}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
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
                                            <p className="text-xs text-muted-foreground">
                                                Upload a new profile photo. Supported formats: JPG, PNG, GIF. Max size: 2MB.
                                            </p>
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
                                            placeholder="Enter your username"
                                        />
                                        <InputError message={errors.username} />
                                    </div>

                                    {/* Nama Lengkap */}
                                    <div className="space-y-2">
                                        <Label htmlFor="nama">Full Name</Label>
                                        <Input
                                            id="nama"
                                            value={data.nama}
                                            onChange={(e) => setData('nama', e.target.value)}
                                            required
                                            autoComplete="name"
                                            placeholder="Enter your full name"
                                        />
                                        <InputError message={errors.nama} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contact Information Card */}
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Contact Information
                                    </CardTitle>
                                    <CardDescription>
                                        Update your contact details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            autoComplete="email"
                                            placeholder="Enter your email address"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* No HP */}
                                    <div className="space-y-2">
                                        <Label htmlFor="no_hp" className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            Phone Number
                                        </Label>
                                        <Input
                                            id="no_hp"
                                            type="tel"
                                            value={data.no_hp}
                                            onChange={(e) => setData('no_hp', e.target.value)}
                                            autoComplete="tel"
                                            placeholder="Enter your phone number"
                                        />
                                        <InputError message={errors.no_hp} />
                                    </div>

                                    {/* Alamat */}
                                    <div className="space-y-2">
                                        <Label htmlFor="alamat" className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Address
                                        </Label>
                                        <Textarea
                                            id="alamat"
                                            value={data.alamat}
                                            onChange={(e) => setData('alamat', e.target.value)}
                                            placeholder="Enter your complete address"
                                            rows={3}
                                        />
                                        <InputError message={errors.alamat} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

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
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-green-600 font-medium">Changes saved successfully!</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
