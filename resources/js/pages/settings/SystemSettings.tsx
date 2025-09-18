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
}

export default function SystemSettings({ currentAccess }: SystemSettingsProps) {
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
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
