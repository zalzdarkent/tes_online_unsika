import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format-date';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Clock,
    Trophy,
    Users,
    Target,
    TrendingUp,
    BookOpen,
    Brain,
    Award,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';

interface JadwalInfo {
    id: number;
    nama_jadwal: string;
    total_soal_jadwal: number;
    created_at: string;
}

interface StatistikUmum {
    total_peserta: number;
    total_sudah_dikoreksi: number;
    total_draft: number;
    total_belum_dikoreksi: number;
    persentase_selesai: number | string;
}

interface TopPeserta {
    nama: string;
    total_nilai: number | string;
    total_skor: number | string;
}

interface RataRataPerSoal {
    id: number;
    pertanyaan: string;
    skor_maksimal: number | string;
    rata_rata_skor: number | string;
    total_jawaban: number;
    jawaban_benar: number;
    persentase_benar: number | string;
}

interface TimelineKoreksi {
    tanggal: string;
    jumlah_koreksi: number;
}

interface WaktuPengerjaan {
    rata_rata: number;
    tercepat: number;
    terlama: number;
}

interface KualitasPerJenisSoal {
    jenis_soal: string;
    total_jawaban: number;
    rata_rata_skor: number | string;
    rata_rata_skor_maksimal: number | string;
    persentase_pencapaian: number | string;
}

interface Props {
    jadwal: JadwalInfo;
    statistikUmum: StatistikUmum;
    distribusiSkor: Record<string, number>;
    topPeserta: TopPeserta[];
    rataRataPerSoal: RataRataPerSoal[];
    timelineKoreksi: TimelineKoreksi[];
    waktuPengerjaan: WaktuPengerjaan;
    kualitasPerJenisSoal: KualitasPerJenisSoal[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#f97316'];

export default function StatistikKoreksi({
    jadwal,
    statistikUmum,
    distribusiSkor,
    topPeserta,
    rataRataPerSoal,
    timelineKoreksi,
    waktuPengerjaan,
    kualitasPerJenisSoal,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Koreksi Peserta',
            href: '/koreksi',
        },
        {
            title: jadwal.nama_jadwal,
            href: `/koreksi/jadwal/${jadwal.id}/peserta`,
        },
        {
            title: 'Statistik',
            href: `/koreksi/jadwal/${jadwal.id}/statistik`,
        },
    ];

    // Transform data untuk charts
    const distribusiData = Object.entries(distribusiSkor).map(([grade, count]) => ({
        grade,
        count,
    }));

    const soalTersulit = rataRataPerSoal
        .sort((a, b) => {
            const aPersentase = typeof a.persentase_benar === 'number' ? a.persentase_benar : parseFloat(a.persentase_benar || '0');
            const bPersentase = typeof b.persentase_benar === 'number' ? b.persentase_benar : parseFloat(b.persentase_benar || '0');
            return aPersentase - bPersentase;
        })
        .slice(0, 5);

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
    };

    const formatPertanyaan = (pertanyaan: string, maxLength = 60) => {
        return pertanyaan.length > maxLength ? pertanyaan.substring(0, maxLength) + '...' : pertanyaan;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Statistik Koreksi - ${jadwal.nama_jadwal}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.visit(`/koreksi/jadwal/${jadwal.id}/peserta`)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                            <h1 className="text-2xl font-bold">Statistik Koreksi</h1>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {jadwal.nama_jadwal} • {jadwal.total_soal_jadwal} Soal • Dibuat {formatDateTime(jadwal.created_at)}
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Peserta</CardTitle>
                            <Users className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistikUmum.total_peserta}</div>
                            <p className="text-xs text-blue-100 mt-1">
                                Mengikuti tes ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sudah Dikoreksi</CardTitle>
                            <Target className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistikUmum.total_sudah_dikoreksi}</div>
                            <p className="text-xs text-green-100 mt-1">
                                {typeof statistikUmum.persentase_selesai === 'number'
                                    ? statistikUmum.persentase_selesai.toFixed(1)
                                    : parseFloat(statistikUmum.persentase_selesai || '0').toFixed(1)
                                }% selesai
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Draft</CardTitle>
                            <BookOpen className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistikUmum.total_draft}</div>
                            <p className="text-xs text-yellow-100 mt-1">
                                Perlu finalisasi
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Belum Dikoreksi</CardTitle>
                            <Clock className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistikUmum.total_belum_dikoreksi}</div>
                            <p className="text-xs text-gray-100 mt-1">
                                Menunggu koreksi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Koreksi */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Progress Koreksi
                        </CardTitle>
                        <CardDescription>
                            Kemajuan koreksi secara keseluruhan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Sudah Dikoreksi ({statistikUmum.total_sudah_dikoreksi})</span>
                                <span className="font-medium">{typeof statistikUmum.persentase_selesai === 'number'
                                    ? statistikUmum.persentase_selesai.toFixed(1)
                                    : parseFloat(statistikUmum.persentase_selesai || '0').toFixed(1)
                                }%</span>
                            </div>
                            <Progress value={typeof statistikUmum.persentase_selesai === 'number'
                                ? statistikUmum.persentase_selesai
                                : parseFloat(statistikUmum.persentase_selesai || '0')
                            } className="h-3" />
                        </div>
                    </CardContent>
                </Card>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Distribusi Skor */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-purple-600" />
                                Distribusi Nilai
                            </CardTitle>
                            <CardDescription>
                                Sebaran nilai peserta yang sudah dikoreksi
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {distribusiData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={distribusiData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="count"
                                            label
                                        >
                                            {distribusiData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} peserta`, `Grade ${name}`]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-gray-500">
                                    Belum ada data distribusi nilai
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Peserta */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-600" />
                                Top 10 Peserta
                            </CardTitle>
                            <CardDescription>
                                Peserta dengan nilai tertinggi
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topPeserta.length > 0 ? (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {topPeserta.map((peserta, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                                    index === 0 ? 'bg-yellow-500' :
                                                    index === 1 ? 'bg-gray-400' :
                                                    index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                                                }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{peserta.nama}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Skor: {typeof peserta.total_skor === 'number'
                                                            ? peserta.total_skor
                                                            : parseFloat(peserta.total_skor || '0')
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-green-600">
                                                    {typeof peserta.total_nilai === 'number'
                                                        ? peserta.total_nilai.toFixed(1)
                                                        : parseFloat(peserta.total_nilai || '0').toFixed(1)
                                                    }
                                                </div>
                                                <div className="text-xs text-gray-500">nilai</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-gray-500">
                                    Belum ada data peserta yang dikoreksi
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Timeline Koreksi */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                Timeline Koreksi
                            </CardTitle>
                            <CardDescription>
                                Jumlah koreksi per hari (30 hari terakhir)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {timelineKoreksi.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={timelineKoreksi}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="tanggal"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            labelFormatter={(value) => new Date(value).toLocaleDateString('id-ID', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="jumlah_koreksi"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-gray-500">
                                    Belum ada data timeline koreksi
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Kualitas per Jenis Soal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="h-5 w-5 text-indigo-600" />
                                Kualitas per Jenis Soal
                            </CardTitle>
                            <CardDescription>
                                Persentase pencapaian berdasarkan jenis soal
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {kualitasPerJenisSoal.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={kualitasPerJenisSoal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="jenis_soal" tick={{ fontSize: 12 }} />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Pencapaian']} />
                                        <Bar dataKey="persentase_pencapaian" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-gray-500">
                                    Belum ada data kualitas per jenis soal
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Statistik Waktu Pengerjaan */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-green-600" />
                            Statistik Waktu Pengerjaan
                        </CardTitle>
                        <CardDescription>
                            Analisis durasi pengerjaan tes oleh peserta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                <div className="text-2xl font-bold text-blue-600">
                                    {formatDuration(waktuPengerjaan.rata_rata)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Rata-rata
                                </div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                                <div className="text-2xl font-bold text-green-600">
                                    {formatDuration(waktuPengerjaan.tercepat)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Tercepat
                                </div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <div className="text-2xl font-bold text-red-600">
                                    {formatDuration(waktuPengerjaan.terlama)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Terlama
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Soal Tersulit */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-red-600" />
                            5 Soal Tersulit
                        </CardTitle>
                        <CardDescription>
                            Soal dengan persentase jawaban benar terendah
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {soalTersulit.length > 0 ? (
                            <div className="space-y-4">
                                {soalTersulit.map((soal, index) => (
                                    <div key={soal.id} className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm text-gray-500">Soal #{soal.id}</span>
                                            </div>
                                            <p className="text-sm font-medium mb-2">
                                                {formatPertanyaan(soal.pertanyaan)}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                                <span>{soal.jawaban_benar} dari {soal.total_jawaban} benar</span>
                                                <span>Rata-rata skor: {typeof soal.rata_rata_skor === 'number'
                                                    ? soal.rata_rata_skor.toFixed(1)
                                                    : parseFloat(soal.rata_rata_skor || '0').toFixed(1)
                                                }/{soal.skor_maksimal}</span>
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className="text-lg font-bold text-red-600">
                                                {typeof soal.persentase_benar === 'number'
                                                    ? soal.persentase_benar.toFixed(1)
                                                    : parseFloat(soal.persentase_benar || '0').toFixed(1)
                                                }%
                                            </div>
                                            <div className="text-xs text-gray-500">benar</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                Belum ada data analisis soal
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
