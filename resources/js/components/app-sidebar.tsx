import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { filterMenuByRole } from '@/lib/auth-utils';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Calendar, ClipboardCheck, History, LayoutGrid, UsersRoundIcon } from 'lucide-react';
import AppLogo from './app-logo';

const platformNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
];

const mainNavItems: NavItem[] = [
    {
        title: 'Jadwal Tes',
        href: '/jadwal',
        icon: Calendar,
        roles: ['admin', 'teacher'],
    },
    {
        title: 'Koreksi Peserta',
        href: '/koreksi',
        icon: ClipboardCheck,
        roles: ['admin', 'teacher'],
    },
    //menu untuk peserta
    {
        title: 'Daftar Tes',
        href: '/peserta/daftar-tes',
        icon: Calendar,
        roles: ['peserta'],
    },
    {
        title: 'Riwayat Tes',
        href: '/peserta/riwayat',
        icon: History,
        roles: ['peserta'],
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Kelola User',
        href: '/users',
        icon: UsersRoundIcon,
        roles: ['admin'],
    },
];

export function AppSidebar() {
    const page = usePage<SharedData>();
    const user = page.props.auth.user;

    const filteredPlatformItems = filterMenuByRole(platformNavItems, user);
    const filteredMainItems = filterMenuByRole(mainNavItems, user);
    const filteredAdminItems = filterMenuByRole(adminNavItems, user);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {filteredPlatformItems.length > 0 && <NavMain items={filteredPlatformItems} label="Platform" />}
                {filteredMainItems.length > 0 && <NavMain items={filteredMainItems} label="Main" />}
                {filteredAdminItems.length > 0 && <NavMain items={filteredAdminItems} label="Manajemen User" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
