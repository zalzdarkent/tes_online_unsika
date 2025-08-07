import { toast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Users, Signal, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle, BarChart3, BookOpen, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isAdmin, isPeserta } from '@/lib/auth-utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Types untuk data yang dikirim dari backend
type DashboardData = {
    stats: {
        total_peserta: number;
        peserta_online: number;
        tes_aktif: number;
        growth_percentage: number;
        // Data khusus untuk peserta
        tes_tersedia?: number;
        tes_selesai?: number;
        rata_rata_skor?: number;
    };
    aktivitas_terbaru: Array<{
        nama_jadwal: string;
        deskripsi: string;
        status: string;
        kategori: string;
    }>;
    ringkasan_hari_ini: {
        tes_dimulai: number;
        tes_selesai: number;
        peserta_baru: number;
        total_login: number;
        tingkat_keberhasilan: number;
        // Data khusus untuk peserta
        tes_dikerjakan?: number;
        skor_tertinggi?: number;
        waktu_rata_rata?: string;
    };
};

export default function Dashboard() {
    const { props } = usePage<{ errors?: Record<string, string>; auth: { user: User } } & DashboardData>();
    const { stats, aktivitas_terbaru, ringkasan_hari_ini, auth } = props;
    const user = auth.user;

    useEffect(() => {
        if (props.errors?.error) {
            toast({
                variant: 'destructive',
                title: 'Error!',
                description: props.errors.error,
            });
        }
    }, [props.errors]);

    // Helper function untuk warna badge berdasarkan status
    const getBadgeVariant = (status: string) => {
        switch (status) {
            case 'Sedang Berlangsung': return 'default';
            case 'Akan Datang': return 'secondary';
            case 'Selesai': return 'outline';
            default: return 'secondary';
        }
    };

    // Helper function untuk warna background berdasarkan status
    const getActivityColors = (status: string) => {
        switch (status) {
            case 'Sedang Berlangsung':
                return {
                    bg: 'bg-green-50 dark:bg-green-950/20',
                    border: 'border-green-200 dark:border-green-800',
                    iconBg: 'bg-green-100 dark:bg-green-900',
                    iconColor: 'text-green-600 dark:text-green-400',
                    textColor: 'text-green-900 dark:text-green-100',
                    descColor: 'text-green-600 dark:text-green-300'
                };
            case 'Akan Datang':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-950/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    iconBg: 'bg-blue-100 dark:bg-blue-900',
                    iconColor: 'text-blue-600 dark:text-blue-400',
                    textColor: 'text-blue-900 dark:text-blue-100',
                    descColor: 'text-blue-600 dark:text-blue-300'
                };
            case 'Selesai':
                return {
                    bg: 'bg-gray-50 dark:bg-gray-950/20',
                    border: 'border-gray-200 dark:border-gray-800',
                    iconBg: 'bg-gray-100 dark:bg-gray-900',
                    iconColor: 'text-gray-600 dark:text-gray-400',
                    textColor: 'text-gray-900 dark:text-gray-100',
                    descColor: 'text-gray-600 dark:text-gray-300'
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-950/20',
                    border: 'border-gray-200 dark:border-gray-800',
                    iconBg: 'bg-gray-100 dark:bg-gray-900',
                    iconColor: 'text-gray-600 dark:text-gray-400',
                    textColor: 'text-gray-900 dark:text-gray-100',
                    descColor: 'text-gray-600 dark:text-gray-300'
                };
        }
    };

    // Helper function untuk icon berdasarkan status
    const getActivityIcon = (status: string) => {
        switch (status) {
            case 'Sedang Berlangsung': return Signal;
            case 'Akan Datang': return AlertCircle;
            case 'Selesai': return CheckCircle;
            default: return AlertCircle;
        }
    };

    // Render dashboard berbeda berdasarkan role
    if (isPeserta(user)) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="space-y-6 p-6">
                    {/* Header Section for Peserta */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard Peserta</h1>
                        <p className="text-muted-foreground">
                            Selamat datang {user.nama}! Pantau tes yang tersedia dan hasil Anda di sini.
                        </p>
                    </div>

                    {/* Peserta Stats Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tes Tersedia</CardTitle>
                                <BookOpen className="h-5 w-5 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.tes_tersedia || 0}</div>
                                <div className="flex items-center space-x-1 text-sm opacity-80">
                                    <Calendar className="h-4 w-4" />
                                    <span>Siap untuk dikerjakan</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tes Selesai</CardTitle>
                                <Trophy className="h-5 w-5 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.tes_selesai || 0}</div>
                                <div className="flex items-center space-x-1 text-sm opacity-80">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Total telah dikerjakan</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Rata-rata Skor</CardTitle>
                                <BarChart3 className="h-5 w-5 opacity-80" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.rata_rata_skor || '0'}%</div>
                                <div className="flex items-center space-x-1 text-sm opacity-80">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Performa keseluruhan</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Peserta Content Grid */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Tes Terbaru yang Tersedia */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-blue-500" />
                                    Tes Terbaru
                                </CardTitle>
                                <CardDescription>
                                    Tes yang baru tersedia untuk Anda
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {aktivitas_terbaru.length > 0 ? (
                                    aktivitas_terbaru.slice(0, 3).map((tes, index) => {
                                        const colors = getActivityColors(tes.status);
                                        const IconComponent = getActivityIcon(tes.status);

                                        return (
                                            <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
                                                <div className="flex items-center space-x-3">
                                                    <div className={`h-10 w-10 rounded-full ${colors.iconBg} flex items-center justify-center`}>
                                                        <IconComponent className={`h-5 w-5 ${colors.iconColor}`} />
                                                    </div>
                                                    <div>
                                                        <p className={`font-medium ${colors.textColor}`}>{tes.nama_jadwal}</p>
                                                        <p className={`text-sm ${colors.descColor}`}>{tes.deskripsi}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={getBadgeVariant(tes.status)}>
                                                    {tes.status}
                                                </Badge>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Belum ada tes yang tersedia</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Hasil Terbaru */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-purple-500" />
                                    Hasil Terbaru
                                </CardTitle>
                                <CardDescription>
                                    Hasil tes yang baru saja Anda kerjakan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                                            <span className="text-sm font-medium">Tes Hari Ini</span>
                                        </div>
                                        <span className="font-bold text-blue-600">{ringkasan_hari_ini.tes_dikerjakan || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm font-medium">Skor Tertinggi</span>
                                        </div>
                                        <span className="font-bold text-green-600">{ringkasan_hari_ini.skor_tertinggi || 0}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                                            <span className="text-sm font-medium">Waktu Rata-rata</span>
                                        </div>
                                        <span className="font-bold text-orange-600">{ringkasan_hari_ini.waktu_rata_rata || '0'} menit</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ringkasan_hari_ini.tingkat_keberhasilan || 0}%</div>
                                        <div className="text-sm text-muted-foreground">Tingkat Keberhasilan</div>
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(ringkasan_hari_ini.tingkat_keberhasilan || 0, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Dashboard untuk Admin dan Teacher (existing layout)
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dashboard {isAdmin(user) ? 'Administrator' : 'Teacher'}
                    </h1>
                    <p className="text-muted-foreground">
                        Selamat datang {user.nama}! {isAdmin(user)
                            ? 'Pantau aktivitas dan statistik sistem secara keseluruhan.'
                            : 'Pantau tes dan aktivitas peserta Anda.'}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {isAdmin(user) ? 'Total Peserta' : 'Peserta Tes Saya'}
                            </CardTitle>
                            <Users className="h-5 w-5 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_peserta.toLocaleString()}</div>
                            <div className="flex items-center space-x-1 text-sm opacity-80">
                                <TrendingUp className="h-4 w-4" />
                                <span>{stats.growth_percentage > 0 ? '+' : ''}{stats.growth_percentage}% dari bulan lalu</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {isAdmin(user) ? 'Peserta Online' : 'Peserta Aktif'}
                            </CardTitle>
                            <Signal className="h-5 w-5 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.peserta_online}</div>
                            <div className="flex items-center space-x-1 text-sm opacity-80">
                                <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                                <span>Sedang aktif sekarang</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {isAdmin(user) ? 'Tes Aktif' : 'Tes Saya Aktif'}
                            </CardTitle>
                            <Calendar className="h-5 w-5 opacity-80" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.tes_aktif}</div>
                            <div className="flex items-center space-x-1 text-sm opacity-80">
                                <Clock className="h-4 w-4" />
                                <span>Sedang berlangsung</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Activity Card */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-blue-500" />
                                        {isAdmin(user) ? 'Aktivitas Terbaru' : 'Tes Terbaru Saya'}
                                    </CardTitle>
                                    <CardDescription>
                                        {isAdmin(user)
                                            ? 'Pantau status tes dan aktivitas peserta'
                                            : 'Status tes yang Anda kelola'}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {aktivitas_terbaru.length > 0 ? (
                                aktivitas_terbaru.map((aktivitas, index) => {
                                    const colors = getActivityColors(aktivitas.status);
                                    const IconComponent = getActivityIcon(aktivitas.status);

                                    return (
                                        <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
                                            <div className="flex items-center space-x-3">
                                                <div className={`h-10 w-10 rounded-full ${colors.iconBg} flex items-center justify-center`}>
                                                    <IconComponent className={`h-5 w-5 ${colors.iconColor}`} />
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${colors.textColor}`}>{aktivitas.nama_jadwal}</p>
                                                    <p className={`text-sm ${colors.descColor}`}>{aktivitas.deskripsi}</p>
                                                    {aktivitas.kategori !== 'Umum' && (
                                                        <p className={`text-xs ${colors.descColor} opacity-75`}>Kategori: {aktivitas.kategori}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant={getBadgeVariant(aktivitas.status)}>
                                                {aktivitas.status}
                                            </Badge>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>{isAdmin(user) ? 'Belum ada aktivitas tes terbaru' : 'Belum ada tes yang Anda buat'}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stats Card */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-purple-500" />
                                Ringkasan Hari Ini
                            </CardTitle>
                            <CardDescription>
                                {isAdmin(user)
                                    ? 'Statistik aktivitas sistem hari ini'
                                    : 'Statistik tes Anda hari ini'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Tes Dimulai</span>
                                    </div>
                                    <span className="font-bold text-blue-600">{ringkasan_hari_ini.tes_dimulai}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Tes Selesai</span>
                                    </div>
                                    <span className="font-bold text-green-600">{ringkasan_hari_ini.tes_selesai}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                                        <span className="text-sm font-medium">
                                            {isAdmin(user) ? 'Peserta Baru' : 'Partisipan Baru'}
                                        </span>
                                    </div>
                                    <span className="font-bold text-orange-600">{ringkasan_hari_ini.peserta_baru}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Total Login</span>
                                    </div>
                                    <span className="font-bold text-purple-600">{ringkasan_hari_ini.total_login}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ringkasan_hari_ini.tingkat_keberhasilan}%</div>
                                    <div className="text-sm text-muted-foreground">Tingkat Keberhasilan</div>
                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(ringkasan_hari_ini.tingkat_keberhasilan, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
