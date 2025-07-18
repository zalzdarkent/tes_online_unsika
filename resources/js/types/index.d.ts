import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    roles?: string | string[]; // Role requirements untuk menu item
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    username: string;
    password?: string; // Optional karena hidden di model
    role: 'admin' | 'teacher' | 'peserta';
    nama: string | null;
    email: string | null;
    foto: string | null;
    created_at: string;
    remember_token?: string; // Optional karena hidden di model
    [key: string]: unknown; // This allows for additional properties...
}
