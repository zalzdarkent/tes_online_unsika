import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReactNode, useState } from "react";
import { Calendar, Mail, MapPin, Phone, User, UserCheck } from "lucide-react";

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
    };
}

const roleLabels = {
    admin: 'Administrator',
    teacher: 'Guru',
    peserta: 'Peserta'
};

const roleColors = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    teacher: 'bg-blue-100 text-blue-800 border-blue-200',
    peserta: 'bg-green-100 text-green-800 border-green-200'
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
            minute: '2-digit'
        });
    };

    const role = user.role as keyof typeof roleLabels;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <div onClick={() => setIsOpen(true)}>{children}</div>

            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Detail User
                    </DialogTitle>
                    <DialogDescription>
                        Informasi lengkap tentang pengguna sistem
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Profile */}
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                                {user.foto ? (
                                    <img
                                        src={`/storage/${user.foto}`}
                                        alt={user.nama}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <User className={`w-8 h-8 text-primary ${user.foto ? 'hidden' : ''}`} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                                {user.nama}
                            </h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            <div className="mt-2">
                                <Badge
                                    variant="outline"
                                    className={`${roleColors[role]} font-medium`}
                                >
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    {roleLabels[role]}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Informasi Kontak
                        </h4>

                        <div className="grid gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">Email</p>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">No. HP</p>
                                    <p className="text-sm text-muted-foreground">
                                        {user.no_hp || <span className="italic text-muted-foreground/60">Belum diisi</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">Alamat</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {user.alamat || <span className="italic text-muted-foreground/60">Belum diisi</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Account Information */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Informasi Akun
                        </h4>

                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">Tanggal Bergabung</p>
                                <p className="text-sm text-muted-foreground">{formatDate(user.created_at)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">User ID</p>
                                <p className="text-sm text-muted-foreground font-mono">#{user.id.toString().padStart(4, '0')}</p>
                            </div>
                        </div>

                        {user.updated_at && user.updated_at !== user.created_at && (
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-yellow-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground">Terakhir Diperbarui</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(user.updated_at)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Tutup
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
