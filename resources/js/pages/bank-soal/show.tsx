import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import JadwalLayout from '@/layouts/jadwal/layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Globe, Lock, User, Calendar, Target, BarChart3 } from 'lucide-react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

type QuestionBankData = {
    id: number;
    title: string;
    pertanyaan: string;
    jenis_soal: string;
    tipe_jawaban: string;
    difficulty_level: string;
    skor: number;
    usage_count: number;
    actual_usage_count: number;
    is_public: boolean;
    opsi_a?: string;
    opsi_b?: string;
    opsi_c?: string;
    opsi_d?: string;
    jawaban_benar?: string;
    media?: string;
    equation?: string;
    explanation?: string;
    tags?: string[];
    kategori?: {
        id: number;
        nama: string;
    };
    user: {
        id: number;
        nama: string;
    };
    created_at: string;
    updated_at: string;
};

type QuestionBankShowProps = {
    questionBank: QuestionBankData;
};

const DIFFICULTY_LABELS = {
    easy: 'Mudah',
    medium: 'Sedang',
    hard: 'Sulit',
    expert: 'Expert'
};

const DIFFICULTY_COLORS = {
    easy: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    hard: 'bg-orange-100 text-orange-800 border-orange-300',
    expert: 'bg-red-100 text-red-800 border-red-300'
};

const JENIS_SOAL_LABELS = {
    pilihan_ganda: 'Pilihan Ganda',
    multi_choice: 'Multi Pilihan',
    esai: 'Essay',
    essay_gambar: 'Essay Gambar',
    essay_audio: 'Essay Audio',
    skala: 'Skala',
    equation: 'Equation'
};

export default function BankSoalShow({ questionBank }: QuestionBankShowProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderQuestion = () => {
        if (questionBank.equation) {
            return (
                <div className="space-y-4">
                    <div dangerouslySetInnerHTML={{ __html: questionBank.pertanyaan }} />
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <BlockMath math={questionBank.equation} />
                    </div>
                </div>
            );
        }

        return <div dangerouslySetInnerHTML={{ __html: questionBank.pertanyaan }} />;
    };

    const renderAnswerOptions = () => {
        if (!['pilihan_ganda', 'multi_choice'].includes(questionBank.jenis_soal)) {
            return null;
        }

        const options = [
            { key: 'A', value: questionBank.opsi_a },
            { key: 'B', value: questionBank.opsi_b },
            { key: 'C', value: questionBank.opsi_c },
            { key: 'D', value: questionBank.opsi_d }
        ].filter(option => option.value);

        const correctAnswers = questionBank.jawaban_benar?.toLowerCase().split(',').map(a => a.trim()) || [];

        return (
            <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Pilihan Jawaban:</h4>
                <div className="space-y-2">
                    {options.map((option) => {
                        const isCorrect = correctAnswers.includes(option.key.toLowerCase());
                        return (
                            <div
                                key={option.key}
                                className={`p-3 rounded-lg border ${
                                    isCorrect
                                        ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`font-medium ${
                                        isCorrect ? 'text-green-200' : 'text-gray-200'
                                    }`}>
                                        {option.key}.
                                    </span>
                                    <div className={`flex-1 ${
                                        isCorrect ? 'text-green-200' : 'text-gray-200'
                                    }`}>
                                        <div dangerouslySetInnerHTML={{ __html: option.value || '' }} />
                                        {isCorrect && <span className="ml-2 text-xs">(✓ Benar)</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderCorrectAnswer = () => {
        if (['pilihan_ganda', 'multi_choice'].includes(questionBank.jenis_soal)) {
            return null; // Sudah ditampilkan di options
        }

        if (!questionBank.jawaban_benar) {
            return null;
        }

        return (
            <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Jawaban Benar:</h4>
                <div className="bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700 p-4 rounded-lg">
                    {questionBank.jenis_soal === 'equation' && questionBank.jawaban_benar ? (
                        <InlineMath math={questionBank.jawaban_benar} />
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: questionBank.jawaban_benar }} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title={`Detail Soal - ${questionBank.title}`} />
            <AppLayout>
                <JadwalLayout>
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/bank-soal">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Kembali
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-bold text-black dark:text-white">{questionBank.title}</h1>
                                    <p className="text-sm text-black dark:text-white">Detail Soal Bank Soal</p>
                                </div>
                            </div>

                            <Button asChild>
                                <Link href={`/bank-soal/${questionBank.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Soal
                                </Link>
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Question Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="h-5 w-5" />
                                            Pertanyaan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="prose max-w-none text-gray-900 dark:text-gray-100">
                                            {renderQuestion()}
                                        </div>

                                        {/* Media if exists */}
                                        {questionBank.media && (
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100">Media:</h4>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    {questionBank.media.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                        <img
                                                            src={`/storage/${questionBank.media}`}
                                                            alt="Question media"
                                                            className="max-w-full h-auto rounded"
                                                        />
                                                    ) : (
                                                        <a
                                                            href={`/storage/${questionBank.media}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            Download Media
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Answer Options */}
                                {renderAnswerOptions() && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            {renderAnswerOptions()}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Correct Answer */}
                                {renderCorrectAnswer() && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            {renderCorrectAnswer()}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Explanation */}
                                {questionBank.explanation && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Penjelasan</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-blue-50 dark:bg-gray-900 border border-blue-200 dark:border-gray-600 p-4 rounded-lg">
                                                <div className="text-gray-900 dark:text-white" dangerouslySetInnerHTML={{ __html: questionBank.explanation }} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-6">
                                {/* Question Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Informasi Soal</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-white">Jenis Soal:</span>
                                            <Badge variant="outline">
                                                {JENIS_SOAL_LABELS[questionBank.jenis_soal as keyof typeof JENIS_SOAL_LABELS]}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-white">Tingkat Kesulitan:</span>
                                            <Badge className={DIFFICULTY_COLORS[questionBank.difficulty_level as keyof typeof DIFFICULTY_COLORS]}>
                                                {DIFFICULTY_LABELS[questionBank.difficulty_level as keyof typeof DIFFICULTY_LABELS]}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-white">Skor:</span>
                                            <span className="font-mono font-medium">{questionBank.skor}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-white">Kategori:</span>
                                            {questionBank.kategori ? (
                                                <Badge variant="secondary">{questionBank.kategori.nama}</Badge>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-white">Visibilitas:</span>
                                            <div className="flex items-center gap-1">
                                                {questionBank.is_public ? (
                                                    <>
                                                        <Globe className="h-4 w-4 text-blue-500" />
                                                        <span className="text-sm text-blue-600 dark:text-blue-400">Public</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Private</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Usage Statistics */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <BarChart3 className="h-5 w-5" />
                                            Statistik
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-white">Digunakan:</span>
                                            <span className="font-medium">{questionBank.actual_usage_count}x</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Creator Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <User className="h-5 w-5" />
                                            Pembuat
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{questionBank.user.nama}</p>
                                        </div>

                                        <Separator />

                                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>Dibuat: {formatDate(questionBank.created_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>Diperbarui: {formatDate(questionBank.updated_at)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Tags */}
                                {questionBank.tags && questionBank.tags.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Tags</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {questionBank.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        #{tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </JadwalLayout>
            </AppLayout>
        </>
    );
}
