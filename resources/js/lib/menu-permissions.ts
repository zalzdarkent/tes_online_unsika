import { type NavItem } from '@/types';

export interface MenuPermission {
    [key: string]: string[]; // menu key -> allowed roles
}

export const MENU_PERMISSIONS: MenuPermission = {
    'dashboard': ['admin', 'teacher', 'peserta'],
    'jadwal': ['admin', 'teacher'],
    'koreksi': ['admin', 'teacher'],
    'admin': ['admin'], // Admin panel hanya untuk admin
    // Tambah menu lain sesuai kebutuhan
};

export function filterMenuByRole(items: NavItem[], userRole: string): NavItem[] {
    return items.filter(item => {
        const menuKey = item.href.replace('/', '');
        const allowedRoles = MENU_PERMISSIONS[menuKey];

        if (!allowedRoles) {
            // Jika menu tidak ada di permissions, default hanya admin yang bisa akses
            return userRole === 'admin';
        }

        return allowedRoles.includes(userRole);
    });
}

export function canAccessMenu(menuHref: string, userRole: string): boolean {
    const menuKey = menuHref.replace('/', '');
    const allowedRoles = MENU_PERMISSIONS[menuKey];

    if (!allowedRoles) {
        return userRole === 'admin';
    }

    return allowedRoles.includes(userRole);
}
