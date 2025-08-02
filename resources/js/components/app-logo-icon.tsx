import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    const { className, ...rest } = props;
    return (
        <img
            src="/log-unsika.png"
            alt="UNSIKA Logo"
            className={className}
            {...rest}
        />
    );
}
