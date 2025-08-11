import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { router, useForm } from '@inertiajs/react';
import { ReactNode, useState } from 'react';

interface UserFormModalProps {
    mode: 'create' | 'edit';
    children: ReactNode;
    user?: {
        id: number;
        username: string;
        nama: string;
        email: string;
        role: string;
        alamat?: string | null;
        no_hp?: string | null;
        foto?: string | null;
    };
    onSuccess?: () => void;
}

export default function UserFormModal({ mode, children, user, onSuccess }: UserFormModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const { data, setData, processing, errors, reset } = useForm({
        username: user?.username || '',
        nama: user?.nama || '',
        email: user?.email || '',
        password: '',
        role: user?.role || '',
        alamat: user?.alamat || '',
        no_hp: user?.no_hp || '',
        foto: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitHandler =
            mode === 'create' ? () => router.post(route('users.store'), data) : () => router.put(route('users.update', user?.id), data);

        submitHandler();

        router.on('success', () => {
            setIsOpen(false);
            reset();
            if (onSuccess) onSuccess();
            toast({
                title: 'Berhasil',
                description: `User berhasil ${mode === 'create' ? 'ditambahkan' : 'diperbarui'}`,
            });
        });

        router.on('error', (event: { detail: { errors: Record<string, string> } }) => {
            const errors = event.detail.errors;
            const errorMessage = Object.values(errors).join(', ') || `Gagal ${mode === 'create' ? 'menambahkan' : 'memperbarui'} user`;
            toast({
                variant: 'destructive',
                title: 'Gagal',
                description: errorMessage,
            });
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {/* Trigger button/element */}
            <div onClick={() => setIsOpen(true)}>{children}</div>

            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Tambah User Baru' : 'Edit User'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'create' ? 'Tambahkan user baru ke sistem.' : 'Ubah informasi user yang sudah ada.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
                    <div className="space-y-2">
                        <Label htmlFor="foto">Foto Profil</Label>
                        <div className="space-y-2">
                            {user?.foto && mode === 'edit' && (
                                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                        <img
                                            src={`/storage/${user.foto}`}
                                            alt="Current photo"
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Foto saat ini</span>
                                </div>
                            )}
                            <Input
                                id="foto"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setData('foto', file);
                                    }
                                }}
                                className={errors.foto ? 'border-red-500' : ''}
                            />
                            {errors.foto && <p className="text-sm text-red-500">{errors.foto}</p>}
                            <p className="text-xs text-muted-foreground">Format yang didukung: JPG, PNG, GIF. Maksimal 2MB.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                placeholder="Masukkan username"
                                className={errors.username ? 'border-red-500' : ''}
                            />
                            {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nama">Nama Lengkap</Label>
                            <Input
                                id="nama"
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                placeholder="Masukkan nama lengkap"
                                className={errors.nama ? 'border-red-500' : ''}
                            />
                            {errors.nama && <p className="text-sm text-red-500">{errors.nama}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Masukkan email"
                            className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password {mode === 'edit' && '(Kosongkan jika tidak ingin mengubah)'}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={mode === 'create' ? 'Masukkan password' : 'Kosongkan jika tidak diubah'}
                            className={errors.password ? 'border-red-500' : ''}
                        />
                        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                            <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="teacher">Guru</SelectItem>
                                <SelectItem value="peserta">Peserta</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="no_hp">No. HP</Label>
                        <Input
                            id="no_hp"
                            value={data.no_hp}
                            onChange={(e) => setData('no_hp', e.target.value)}
                            placeholder="Masukkan nomor HP"
                            className={errors.no_hp ? 'border-red-500' : ''}
                        />
                        {errors.no_hp && <p className="text-sm text-red-500">{errors.no_hp}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="alamat">Alamat</Label>
                        <Textarea
                            id="alamat"
                            value={data.alamat}
                            onChange={(e) => setData('alamat', e.target.value)}
                            placeholder="Masukkan alamat"
                            className={errors.alamat ? 'border-red-500' : ''}
                            rows={3}
                        />
                        {errors.alamat && <p className="text-sm text-red-500">{errors.alamat}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : mode === 'create' ? 'Tambah' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
