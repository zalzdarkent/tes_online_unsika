import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { Check, Eye, EyeOff, LoaderCircle, X } from 'lucide-react';
import { FormEventHandler, useCallback, useEffect, useState } from 'react';

import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type RegisterForm = {
    username: string;
    nama: string;
    email: string;
    password: string;
    password_confirmation: string;
    foto?: File | null;
    alamat: string | null;
    no_hp?: string | null;
};

type ValidationState = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<Omit<RegisterForm, 'foto'>> & Pick<RegisterForm, 'foto'>>({
        username: '',
        nama: '',
        email: '',
        password: '',
        password_confirmation: '',
        foto: null,
        alamat: null,
        no_hp: null,
    });

    const [usernameValidation, setUsernameValidation] = useState<{
        state: ValidationState;
        message: string;
    }>({
        state: 'idle',
        message: '',
    });

    const [emailValidation, setEmailValidation] = useState<{
        state: ValidationState;
        message: string;
    }>({
        state: 'idle',
        message: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const [passwordMatchValidation, setPasswordMatchValidation] = useState<{
        state: 'idle' | 'match' | 'no-match';
        message: string;
    }>({
        state: 'idle',
        message: '',
    });

    // Custom debounce function
    const debounce = useCallback((func: (username: string) => void, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (username: string) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(username), delay);
        };
    }, []);

    // Function untuk check username availability
    const checkUsernameAvailability = useCallback(async (username: string) => {
        if (!username || username.length < 3) {
            setUsernameValidation({
                state: 'idle',
                message: '',
            });
            return;
        }

        setUsernameValidation({
            state: 'checking',
            message: 'Memeriksa ketersediaan username...',
        });

        try {
            // Menggunakan axios untuk API call
            const response = await axios.post(
                route('check-username'),
                {
                    username: username,
                },
                {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                },
            );

            const result = response.data;

            if (result.available) {
                setUsernameValidation({
                    state: 'available',
                    message: 'Username tersedia!',
                });
            } else {
                setUsernameValidation({
                    state: 'taken',
                    message: 'Username sudah digunakan',
                });
            }
        } catch (error) {
            console.error('Username check error:', error);
            setUsernameValidation({
                state: 'error',
                message: 'Gagal memeriksa username',
            });
        }
    }, []);

    // Function untuk check email availability
    const checkEmailAvailability = useCallback(async (email: string) => {
        // Basic email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            setEmailValidation({
                state: 'idle',
                message: '',
            });
            return;
        }

        if (!emailRegex.test(email)) {
            setEmailValidation({
                state: 'error',
                message: 'Format email tidak valid',
            });
            return;
        }

        setEmailValidation({
            state: 'checking',
            message: 'Memeriksa ketersediaan email...',
        });

        try {
            // Menggunakan axios untuk API call
            const response = await axios.post(
                route('check-email'),
                {
                    email: email,
                },
                {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                },
            );

            const result = response.data;

            if (result.available) {
                setEmailValidation({
                    state: 'available',
                    message: 'Email tersedia!',
                });
            } else {
                setEmailValidation({
                    state: 'taken',
                    message: 'Email sudah digunakan',
                });
            }
        } catch (error) {
            console.error('Email check error:', error);
            setEmailValidation({
                state: 'error',
                message: 'Gagal memeriksa email',
            });
        }
    }, []);

    // Debounced version of username check
    const debouncedCheckUsername = useCallback(debounce(checkUsernameAvailability, 500), [checkUsernameAvailability, debounce]);

    // Debounced version of email check
    const debouncedCheckEmail = useCallback(debounce(checkEmailAvailability, 500), [checkEmailAvailability, debounce]);

    // Effect untuk trigger validation saat username berubah
    useEffect(() => {
        if (data.username) {
            debouncedCheckUsername(data.username);
        }
    }, [data.username, debouncedCheckUsername]);

    // Effect untuk trigger validation saat email berubah
    useEffect(() => {
        if (data.email) {
            debouncedCheckEmail(data.email);
        }
    }, [data.email, debouncedCheckEmail]);

    // Effect untuk check password match
    useEffect(() => {
        if (data.password && data.password_confirmation) {
            if (data.password === data.password_confirmation) {
                setPasswordMatchValidation({
                    state: 'match',
                    message: 'Password cocok!',
                });
            } else {
                setPasswordMatchValidation({
                    state: 'no-match',
                    message: 'Password tidak cocok',
                });
            }
        } else if (data.password_confirmation) {
            setPasswordMatchValidation({
                state: 'no-match',
                message: 'Password tidak cocok',
            });
        } else {
            setPasswordMatchValidation({
                state: 'idle',
                message: '',
            });
        }
    }, [data.password, data.password_confirmation]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Check if username is available before submitting
        if (usernameValidation.state === 'taken') {
            setUsernameValidation({
                state: 'taken',
                message: 'Username sudah digunakan, tidak dapat mendaftar',
            });
            return;
        }

        if (usernameValidation.state === 'checking') {
            setUsernameValidation({
                state: 'checking',
                message: 'Tunggu hingga validasi username selesai',
            });
            return;
        }

        // Check if email is available before submitting
        if (emailValidation.state === 'taken') {
            setEmailValidation({
                state: 'taken',
                message: 'Email sudah digunakan, tidak dapat mendaftar',
            });
            return;
        }

        if (emailValidation.state === 'checking') {
            setEmailValidation({
                state: 'checking',
                message: 'Tunggu hingga validasi email selesai',
            });
            return;
        }

        // Check if passwords match before submitting
        if (passwordMatchValidation.state === 'no-match') {
            setPasswordMatchValidation({
                state: 'no-match',
                message: 'Password tidak cocok, tidak dapat mendaftar',
            });
            return;
        }

        if (data.password !== data.password_confirmation) {
            setPasswordMatchValidation({
                state: 'no-match',
                message: 'Password harus sama dengan konfirmasi password',
            });
            return;
        }

        post(route('register'), {
            forceFormData: true, // Untuk file upload
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <Head title="Register" />

            <Card className="mx-auto w-full max-w-2xl">
                <CardHeader className="space-y-4">
                    <div className="flex justify-center">
                        <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                            <div className="mb-1 flex h-16 w-16 items-center justify-center">
                                <AppLogoIcon className="h-full w-full object-contain" />
                            </div>
                        </Link>
                    </div>
                    <CardTitle className="text-center text-2xl">Create an account</CardTitle>
                    <CardDescription className="text-center">Enter your details below to create your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-6" onSubmit={submit}>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <Input
                                        id="username"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="username"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        disabled={processing}
                                        placeholder="Username"
                                        className={cn(
                                            'pr-10 transition-all duration-200',
                                            usernameValidation.state === 'available' && 'border-green-500 focus:border-green-500',
                                            usernameValidation.state === 'taken' && 'border-red-500 focus:border-red-500',
                                            usernameValidation.state === 'error' && 'border-red-500 focus:border-red-500',
                                        )}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        {usernameValidation.state === 'checking' && <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />}
                                        {usernameValidation.state === 'available' && (
                                            <Check className="h-4 w-4 text-green-500 duration-200 animate-in fade-in-0 zoom-in-95" />
                                        )}
                                        {(usernameValidation.state === 'taken' || usernameValidation.state === 'error') && (
                                            <X className="h-4 w-4 text-red-500 duration-200 animate-in fade-in-0 zoom-in-95" />
                                        )}
                                    </div>
                                </div>
                                {usernameValidation.message && (
                                    <div
                                        className={cn(
                                            'text-sm font-medium duration-200 animate-in fade-in-0 slide-in-from-top-1',
                                            usernameValidation.state === 'available' && 'text-green-600',
                                            usernameValidation.state === 'taken' && 'text-red-600',
                                            usernameValidation.state === 'error' && 'text-red-600',
                                            usernameValidation.state === 'checking' && 'text-gray-500',
                                        )}
                                    >
                                        {usernameValidation.message}
                                    </div>
                                )}
                                <InputError message={errors.username} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="nama">Nama Lengkap</Label>
                                <Input
                                    id="nama"
                                    type="text"
                                    required
                                    tabIndex={2}
                                    autoComplete="name"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    disabled={processing}
                                    placeholder="Nama lengkap"
                                />
                                <InputError message={errors.nama} className="mt-2" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        tabIndex={3}
                                        autoComplete="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        disabled={processing}
                                        placeholder="email@example.com"
                                        className={cn(
                                            'pr-10 transition-all duration-200',
                                            emailValidation.state === 'available' && 'border-green-500 focus:border-green-500',
                                            emailValidation.state === 'taken' && 'border-red-500 focus:border-red-500',
                                            emailValidation.state === 'error' && 'border-red-500 focus:border-red-500',
                                        )}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        {emailValidation.state === 'checking' && <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />}
                                        {emailValidation.state === 'available' && (
                                            <Check className="h-4 w-4 text-green-500 duration-200 animate-in fade-in-0 zoom-in-95" />
                                        )}
                                        {(emailValidation.state === 'taken' || emailValidation.state === 'error') && (
                                            <X className="h-4 w-4 text-red-500 duration-200 animate-in fade-in-0 zoom-in-95" />
                                        )}
                                    </div>
                                </div>
                                {emailValidation.message && (
                                    <div
                                        className={cn(
                                            'text-sm font-medium duration-200 animate-in fade-in-0 slide-in-from-top-1',
                                            emailValidation.state === 'available' && 'text-green-600',
                                            emailValidation.state === 'taken' && 'text-red-600',
                                            emailValidation.state === 'error' && 'text-red-600',
                                            emailValidation.state === 'checking' && 'text-gray-500',
                                        )}
                                    >
                                        {emailValidation.message}
                                    </div>
                                )}
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="foto">Foto (Optional)</Label>
                                <Input
                                    id="foto"
                                    type="file"
                                    accept="image/*"
                                    tabIndex={7}
                                    onChange={(e) => setData('foto', e.target.files?.[0] || null)}
                                    disabled={processing}
                                />
                                <InputError message={errors.foto} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="alamat">Alamat (Optional)</Label>
                                <div className="relative">
                                    <textarea
                                        id="alamat"
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        tabIndex={5}
                                        value={data.alamat || ''}
                                        onChange={(e) => setData('alamat', e.target.value)}
                                        disabled={processing}
                                        placeholder="Alamat lengkap (opsional)"
                                    />
                                </div>
                                <InputError message={errors.alamat} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="no_hp">No. HP (Optional)</Label>
                                <div className="relative">
                                    <Input
                                        id="no_hp"
                                        type="tel"
                                        tabIndex={6}
                                        value={data.no_hp || ''}
                                        onChange={(e) => setData('no_hp', e.target.value)}
                                        disabled={processing}
                                        placeholder="Nomor HP (opsional)"
                                    />
                                </div>
                                <InputError message={errors.no_hp} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        disabled={processing}
                                        placeholder="Password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        required
                                        tabIndex={5}
                                        autoComplete="new-password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        disabled={processing}
                                        placeholder="Confirm password"
                                        className={cn(
                                            'pr-20 transition-all duration-200',
                                            passwordMatchValidation.state === 'match' && 'border-green-500 focus:border-green-500',
                                            passwordMatchValidation.state === 'no-match' && 'border-red-500 focus:border-red-500',
                                        )}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
                                        {/* Password match indicator */}
                                        {passwordMatchValidation.state === 'match' && (
                                            <Check className="h-4 w-4 text-green-500 duration-200 animate-in fade-in-0 zoom-in-95" />
                                        )}
                                        {passwordMatchValidation.state === 'no-match' && (
                                            <X className="h-4 w-4 text-red-500 duration-200 animate-in fade-in-0 zoom-in-95" />
                                        )}

                                        {/* Eye toggle button */}
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                            tabIndex={-1}
                                        >
                                            {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                {passwordMatchValidation.message && (
                                    <div
                                        className={cn(
                                            'text-sm font-medium duration-200 animate-in fade-in-0 slide-in-from-top-1',
                                            passwordMatchValidation.state === 'match' && 'text-green-600',
                                            passwordMatchValidation.state === 'no-match' && 'text-red-600',
                                        )}
                                    >
                                        {passwordMatchValidation.message}
                                    </div>
                                )}
                                <InputError message={errors.password_confirmation} />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            tabIndex={8}
                            disabled={
                                processing ||
                                usernameValidation.state === 'checking' ||
                                usernameValidation.state === 'taken' ||
                                usernameValidation.state === 'error' ||
                                emailValidation.state === 'checking' ||
                                emailValidation.state === 'taken' ||
                                emailValidation.state === 'error' ||
                                passwordMatchValidation.state === 'no-match'
                            }
                        >
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Create account
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={route('login')} tabIndex={9}>
                                Log in
                            </TextLink>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
