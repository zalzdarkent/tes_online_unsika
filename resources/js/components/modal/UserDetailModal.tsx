import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Calendar, IdCard, Library, Mail, MapPin, Phone, University, User, UserCheck } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface UserDetailModalProps {
    children: ReactNode;
    user: {
        id: number;
        username: string;
        nama: string;
        email: string;
        role: string;
        alamat?: string;
        no_hp?: string;
        foto?: string;
        created_at: string;
        updated_at?: string;
        prodi?: string;
        fakultas?: string;
        universitas?: string;
        npm?: string;
    };
}

const roleLabels = {
    admin: 'Administrator',
    teacher: 'Guru',
    peserta: 'Peserta',
};

const roleColors = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    teacher: 'bg-blue-100 text-blue-800 border-blue-200',
    peserta: 'bg-green-100 text-green-800 border-green-200',
};

export default function UserDetailModal({ children, user }: UserDetailModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const role = user.role as keyof typeof roleLabels;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <div onClick={() => setIsOpen(true)}>{children}</div>

            <DialogContent className="max-w-4xl w-[90vw]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Detail User
                    </DialogTitle>
                    <DialogDescription>Informasi lengkap tentang pengguna sistem</DialogDescription>
                </DialogHeader>

                <div className="max-h-[75vh] space-y-6 overflow-y-auto pr-2">
                    {/* Header Profile */}
                    <div className="flex items-start gap-4 rounded-lg bg-muted/50 p-4">
                        <div className="flex-shrink-0">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                {user.foto ? (
                                    <img
                                        src={`/storage/${user.foto}`}
                                        alt={user.nama}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <User className={`h-8 w-8 text-primary ${user.foto ? 'hidden' : ''}`} />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-semibold text-foreground">{user.nama}</h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            <div className="mt-2">
                                <Badge variant="outline" className={`${roleColors[role]} font-medium`}>
                                    <UserCheck className="mr-1 h-3 w-3" />
                                    {roleLabels[role]}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Grid Layout for Contact & Academic Information */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Informasi Kontak</h4>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">Email</p>
                                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                                        <Phone className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">No. HP</p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.no_hp || <span className="text-muted-foreground/60 italic">Belum diisi</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
                                        <MapPin className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">Alamat</p>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {user.alamat || <span className="text-muted-foreground/60 italic">Belum diisi</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Informasi Akademik</h4>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                        <IdCard className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">NPM</p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.npm || <span className="text-muted-foreground/60 italic">Belum diisi</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                                        <BookOpen className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">Program Studi</p>
                                        <p className="text-sm text-muted-foreground">
                                            {user.prodi || <span className="text-muted-foreground/60 italic">Belum diisi</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
                                        <Library className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">Fakultas</p>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {user.fakultas || <span className="text-muted-foreground/60 italic">Belum diisi</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100">
                                        <University className="h-4 w-4 text-yellow-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">Universitas</p>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {user.universitas || <span className="text-muted-foreground/60 italic">Belum diisi</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Account Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Informasi Akun</h4>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                    <User className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">User ID</p>
                                    <p className="font-mono text-sm text-muted-foreground">#{user.id.toString().padStart(4, '0')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
                                    <Calendar className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">Tanggal Bergabung</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(user.created_at)}</p>
                                </div>
                            </div>

                            {user.updated_at && user.updated_at !== user.created_at && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100">
                                        <Calendar className="h-4 w-4 text-yellow-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">Terakhir Diperbarui</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(user.updated_at)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end border-t pt-4">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Tutup
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
