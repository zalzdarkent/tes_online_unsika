import * as React from 'react';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function Combobox(props: any) {
    return <ComboboxPrimitive.Root data-slot="combobox" {...props} />;
}

export function ComboboxTrigger(props: React.ComponentProps<typeof ComboboxPrimitive.Trigger>) {
    return <ComboboxPrimitive.Trigger data-slot="combobox-trigger" {...props} />;
}

export function ComboboxInput(props: React.ComponentProps<typeof ComboboxPrimitive.Input>) {
    return <ComboboxPrimitive.Input data-slot="combobox-input" {...props} />;
}

type ComboboxContentProps = any & {
    className?: string;
    sideOffset?: React.ComponentProps<typeof ComboboxPrimitive.Positioner>['sideOffset'];
    align?: React.ComponentProps<typeof ComboboxPrimitive.Positioner>['align'];
};

export function ComboboxContent({ className, sideOffset = 4, align = 'start', ...props }: ComboboxContentProps) {
    return (
        <ComboboxPrimitive.Portal>
            <ComboboxPrimitive.Positioner sideOffset={sideOffset} align={align} className="z-50 w-[var(--anchor-width)]">
                <ComboboxPrimitive.Popup
                    data-slot="combobox-content"
                    className={cn(
                        'overflow-hidden rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-xl outline-hidden',
                        className,
                    )}
                    {...props}
                />
            </ComboboxPrimitive.Positioner>
        </ComboboxPrimitive.Portal>
    );
}

export function ComboboxEmpty(props: React.ComponentProps<typeof ComboboxPrimitive.Empty>) {
    return <ComboboxPrimitive.Empty data-slot="combobox-empty" className="px-3 py-6 text-center text-sm text-muted-foreground" {...props} />;
}

export function ComboboxList({ className, ...props }: React.ComponentProps<typeof ComboboxPrimitive.List>) {
    return <ComboboxPrimitive.List data-slot="combobox-list" className={cn('max-h-72 overflow-auto p-2', className)} {...props} />;
}

export function ComboboxItem(props: React.ComponentProps<typeof ComboboxPrimitive.Item>) {
    return <ComboboxPrimitive.Item data-slot="combobox-item" {...props} />;
}

export function ComboboxItemIndicator(props: React.ComponentProps<typeof ComboboxPrimitive.ItemIndicator>) {
    return <ComboboxPrimitive.ItemIndicator data-slot="combobox-item-indicator" {...props} />;
}

export function ComboboxValue(props: React.ComponentProps<typeof ComboboxPrimitive.Value>) {
    return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function LegacyCombobox({
    options,
    value,
    onChange,
    placeholder,
    disabled,
    className,
}: {
    options: string[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}) {
    const selectItem = (nextValue: string) => {
        onChange(nextValue);
    };

    return (
        <Combobox items={options} value={value} onValueChange={(next: string | null) => next && onChange(next)}>
            <ComboboxInput
                disabled={disabled}
                placeholder={placeholder || 'Cari...'}
                className={cn(
                    'h-11 w-full rounded-xl border-border/70 bg-background px-4 text-sm shadow-sm outline-hidden transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
                    className,
                )}
            />

            <ComboboxContent>
                <ScrollArea className="max-h-72">
                    <ComboboxEmpty>Tidak ada hasil</ComboboxEmpty>
                    <ComboboxList className="p-2">
                        {(option: string, index: number) => {
                            const selected = option === value;

                            return (
                                <ComboboxItem
                                    key={option}
                                    value={option}
                                    index={index}
                                    className={cn(
                                        'group mb-1 flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm outline-hidden transition-all last:mb-0',
                                        selected
                                            ? 'border-primary/30 bg-primary/10 text-foreground shadow-sm'
                                            : 'border-transparent bg-background hover:border-border/70 hover:bg-accent/60',
                                    )}
                                >
                                    <span className="truncate">{option}</span>
                                    <span
                                        className={cn(
                                            'ml-3 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-transparent transition-all',
                                            selected
                                                ? 'border-primary/30 bg-primary text-primary-foreground'
                                                : 'border-border/70 bg-muted/40 opacity-0 group-hover:opacity-100',
                                        )}
                                    >
                                        <Check className={cn('size-3.5', selected ? 'opacity-100' : 'opacity-0')} />
                                    </span>
                                </ComboboxItem>
                            );
                        }}
                    </ComboboxList>
                </ScrollArea>
            </ComboboxContent>
        </Combobox>
    );
}

export default LegacyCombobox;