import clsx from 'clsx';
import DOMPurify from 'dompurify';

interface RichTextViewerProps {
    content: string;
    className?: string;
}

export default function RichTextViewer({ content, className }: RichTextViewerProps) {
    const sanitized = DOMPurify.sanitize(content);

    return (
        <div className={clsx('prose dark:prose-invert max-w-none whitespace-pre-wrap', className)} dangerouslySetInnerHTML={{ __html: sanitized }} />
    );
}
