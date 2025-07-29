import DOMPurify from 'dompurify';

interface RichTextViewerProps {
    content: string;
}

export default function RichTextViewer({ content }: RichTextViewerProps) {
    const sanitized = DOMPurify.sanitize(content);

    return <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
