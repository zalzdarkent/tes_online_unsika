import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

interface NavMainProps {
    items: NavItem[];
    label?: string;
}

export function NavMain({ items = [], label = "Platform" }: NavMainProps) {
    const page = usePage();

    const isItemActive = (item: NavItem) => {
        return item.children?.some((child) => (child.href ? page.url.startsWith(child.href) : false)) ?? false;
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {item.children && item.children.length > 0 ? (
                            <Collapsible defaultOpen={isItemActive(item)} className="group/collapsible">
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton asChild isActive={false} tooltip={{ children: item.title }}>
                                        <button type="button" className="w-full">
                                            <span className="flex min-w-0 items-center gap-2">
                                                {item.icon && <item.icon className="size-4 shrink-0" />}
                                                <span>{item.title}</span>
                                            </span>
                                            <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                                        </button>
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.children.map((child) => (
                                            <SidebarMenuSubItem key={child.title}>
                                                <SidebarMenuSubButton asChild isActive={child.href ? page.url.startsWith(child.href) : false}>
                                                    <Link href={child.href ?? '#'} prefetch={Boolean(child.href)}>
                                                        <span>{child.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        ) : (
                            <SidebarMenuButton asChild isActive={item.href ? page.url.startsWith(item.href) : false} tooltip={{ children: item.title }}>
                                <Link href={item.href ?? '#'} prefetch={Boolean(item.href)}>
                                    {item.icon && <item.icon className="size-4 shrink-0" />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
