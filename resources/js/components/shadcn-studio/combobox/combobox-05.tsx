'use client';

import { useId } from 'react';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { CircleCheckIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput as ComboboxInputPrimitive, ComboboxList } from '@/components/ui/combobox';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';

const frameworks = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro'] as const;

type ComboboxInputProps = Omit<React.ComponentProps<typeof ComboboxInputPrimitive>, 'className'> & {
    className?: string;
    showTrigger?: boolean;
    avatarSrc?: string;
    fallback?: string;
};

const ComboboxInput = ({ className, children, disabled = false, showTrigger = true, avatarSrc, fallback, ...props }: ComboboxInputProps) => {
    return (
        <InputGroup className={className}>
            {avatarSrc && (
                <InputGroupAddon>
                    <Avatar className="size-5">
                        <AvatarImage src={avatarSrc} alt="User Avatar" />
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                </InputGroupAddon>
            )}
            <ComboboxInputPrimitive render={<InputGroupInput disabled={disabled} />} {...props} />
            <InputGroupAddon align="inline-end">
                {showTrigger && (
                    <InputGroupButton size="icon-xs" variant="ghost" asChild data-slot="input-group-button" className="data-pressed:bg-transparent" disabled={disabled}>
                        <ComboboxPrimitive.Trigger />
                    </InputGroupButton>
                )}
            </InputGroupAddon>
            {children}
        </InputGroup>
    );
};

const ComboboxCustomCheckIconDemo = () => {
    const id = useId();

    return (
        <div className="w-full max-w-xs space-y-2">
            <Label htmlFor={id}>Combobox with custom check icon</Label>
            <Combobox id={id} items={frameworks}>
                <ComboboxInput placeholder="Select a framework" />
                <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                        {(item) => (
                            <ComboboxPrimitive.Item
                                key={item}
                                value={item}
                                className="data-[highlighted=true]:bg-accent data-[highlighted=true]:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0"
                            >
                                {item}
                                <ComboboxPrimitive.ItemIndicator
                                    data-slot="combobox-item-indicator"
                                    render={<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />}
                                >
                                    <CircleCheckIcon className="pointer-events-none size-4 fill-blue-500 stroke-white pointer-coarse:size-5" />
                                </ComboboxPrimitive.ItemIndicator>
                            </ComboboxPrimitive.Item>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </div>
    );
};

export default ComboboxCustomCheckIconDemo;