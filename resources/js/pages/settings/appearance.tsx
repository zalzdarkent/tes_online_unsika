import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import ThemeAccentPicker from '@/components/theme-accent-picker';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pengaturan Tampilan',
        href: '/settings/appearance',
    },
];

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Tampilan" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Pengaturan Tampilan" description="Perbarui mode tampilan dan warna aksen akun Anda." />
                    <AppearanceTabs />
                    <ThemeAccentPicker />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
