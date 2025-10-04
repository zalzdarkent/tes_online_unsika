import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'System Settings',
        href: '/settings/system',
    },
];

interface SystemSettingsProps {
    currentAccess: 'public' | 'private';
    adminBypassActive?: boolean;
}

export default function SystemSettings({ currentAccess, adminBypassActive = false }: SystemSettingsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        access: currentAccess,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        post('/settings/system/update-access', {
            onSuccess: () => {
                toast({
                    title: 'Success',
                    description: 'System access setting updated successfully.',
                });
                setIsSubmitting(false);
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to update system access setting.',
                    variant: 'destructive',
                });
                setIsSubmitting(false);
            },
        });
    };

    const handleDeactivateBypass = () => {
        post('/admin-bypass/deactivate', {
            onSuccess: () => {
                toast({
                    title: 'Success',
                    description: 'Admin bypass deactivated successfully.',
                });
            },
            onError: () => {
                toast({
                    title: 'Error',
                    description: 'Failed to deactivate admin bypass.',
                    variant: 'destructive',
                });
            },
        });
    };

    const handleAccessChange = (newAccess: 'public' | 'private') => {
        setData('access', newAccess);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="System Settings"
                        description="Manage system access and security settings. Only admin can access this page."
                    />

                    {/* Admin Bypass Status Card */}
                    {adminBypassActive && (
                        <Card className="border-orange-200 bg-orange-50">
                            <CardHeader>
                                <CardTitle className="text-orange-800">Admin IP Bypass Active</CardTitle>
                                <CardDescription className="text-orange-700">
                                    You are currently accessing the system with admin bypass enabled. This allows access from any IP address.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="outline"
                                    onClick={handleDeactivateBypass}
                                    className="border-orange-300 text-orange-800 hover:bg-orange-100"
                                >
                                    Deactivate Admin Bypass
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Access Control</CardTitle>
                            <CardDescription>
                                Control who can access the system. When set to private, only devices with university IP addresses can access the system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <RadioGroup
                                        value={data.access}
                                        onValueChange={(value) => handleAccessChange(value as 'public' | 'private')}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value="public" id="public" />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label
                                                    htmlFor="public"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Public Access
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Anyone from anywhere can access the system
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value="private" id="private" />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label
                                                    htmlFor="private"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    Private Access (University IP Only)
                                                </Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Only devices with university IP addresses (103.121.197.x and 36.50.94.x ranges) can access the system
                                                </p>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {errors.access && (
                                    <div className="text-sm text-red-600">
                                        {errors.access}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={processing || isSubmitting}
                                    className="w-full sm:w-auto"
                                >
                                    {processing || isSubmitting ? 'Updating...' : 'Update Access Setting'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* IP Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>University IP Ranges</CardTitle>
                            <CardDescription>
                                The following IP ranges are allowed when private mode is enabled:
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 text-sm">
                                <div>
                                    <span className="font-medium">Range 1:</span> 103.121.197.1 - 103.121.197.254
                                </div>
                                <div>
                                    <span className="font-medium">Range 2:</span> 36.50.94.1 - 36.50.94.254
                                </div>
                                <div>
                                    <span className="font-medium">Local:</span> 127.0.0.1, ::1 (for development)
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Bypass Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Bypass Information</CardTitle>
                            <CardDescription>
                                Information about admin bypass functionality when private mode is enabled.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 text-sm">
                                <div>
                                    <span className="font-medium">Purpose:</span> Allows administrators to access the system from any IP address when private mode is active.
                                </div>
                                <div>
                                    <span className="font-medium">Access:</span> Visit <code className="bg-muted px-1 py-0.5 rounded text-xs">/admin-bypass</code> when blocked by IP restrictions.
                                </div>
                                <div>
                                    <span className="font-medium">Requirements:</span> Valid admin credentials + bypass code.
                                </div>
                                <div>
                                    <span className="font-medium">Duration:</span> Bypass remains active for 24 hours or until manually deactivated.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
