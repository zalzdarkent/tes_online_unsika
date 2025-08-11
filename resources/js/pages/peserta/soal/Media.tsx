import { Label } from '@/components/ui/label';

export default function Media({ url }: { url: string }) {
    const ext = url.split('.').pop()?.toLowerCase();

    if (!ext) return null;

    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        return (
            <div className="my-3">
                <Label className="mb-2 block text-sm font-medium">Gambar Pendukung</Label>
                <img src={`/storage/${url}`} alt="Gambar Soal" className="h-auto max-h-60 w-auto rounded-md shadow-sm md:max-w-xl" />
            </div>
        );
    }

    if (['mp3', 'ogg', 'wav', 'm4a'].includes(ext)) {
        return (
            <div className="my-3">
                <Label className="mb-2 block text-sm font-medium">Audio Pendukung</Label>
                <audio controls src={`/storage/${url}`} className="w-full max-w-sm" />
            </div>
        );
    }

    return null;
}
