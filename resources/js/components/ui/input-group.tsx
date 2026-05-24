import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="input-group" className={cn('group/input-group flex w-full items-stretch rounded-md', className)} {...props} />;
}

function InputGroupAddon({ className, align = 'inline-start', ...props }: React.ComponentProps<'div'> & { align?: 'inline-start' | 'inline-end' }) {
    return (
        <div
            data-slot="input-group-addon"
            data-align={align}
            className={cn(
                'text-muted-foreground flex items-center justify-center border border-input bg-background px-3 text-sm shadow-xs',
                align === 'inline-start' ? 'rounded-l-md border-r-0' : 'rounded-r-md border-l-0',
                className,
            )}
            {...props}
        />
    );
}

function InputGroupInput({ className, ...props }: React.ComponentProps<typeof Input>) {
    return <Input data-slot="input-group-input" className={cn('rounded-none border-input shadow-none focus-visible:ring-0', className)} {...props} />;
}

type InputGroupButtonProps = Omit<React.ComponentProps<typeof Button>, 'size'> & {
    size?: React.ComponentProps<typeof Button>['size'] | 'icon-xs';
};

function InputGroupButton({ className, size = 'icon-xs', variant = 'ghost', ...props }: InputGroupButtonProps) {
    return (
        <Button
            data-slot="input-group-button"
            variant={variant}
            size={size === 'icon-xs' ? 'icon' : size}
            className={cn('rounded-none border border-input border-l-0 shadow-xs', size === 'icon-xs' && 'size-8 p-0', className)}
            {...props}
        />
    );
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput };