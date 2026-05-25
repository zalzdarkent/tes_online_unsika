import Heading from '@/components/heading';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function JadwalLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const page = usePage<SharedData>();

    return (
        <div className="px-4 py-6">
            <Heading title="Manajemen Jadwal" description="Kelola jadwal dan kategori tes" />

            <div className="min-w-0 w-full">{children}</div>
        </div>
    );
}
