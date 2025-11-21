import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
    const [selectionUpdateFlag, setSelectionUpdateFlag] = useState(0);

    const editor = useEditor({
        extensions: [StarterKit],
        content: value,
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [editor, value]);

    useEffect(() => {
        if (!editor) return;

        const forceRerender = () => setSelectionUpdateFlag((prev) => prev + 1);

        editor.on('selectionUpdate', forceRerender);
        editor.on('transaction', forceRerender);

        return () => {
            editor.off('selectionUpdate', forceRerender);
            editor.off('transaction', forceRerender);
        };
    }, [editor]);

    if (!editor) return null;

    const buttonBaseClass = 'cursor-pointer px-2 py-1 rounded text-sm hover:bg-muted transition-colors';
    const activeClass = 'text-blue-600 font-semibold';

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2 border-b pb-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`${buttonBaseClass} ${editor.isActive('bold') ? activeClass : ''}`}
                >
                    <span className="font-extrabold">B</span>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`${buttonBaseClass} ${editor.isActive('italic') ? activeClass : ''}`}
                >
                    <span className="italic">I</span>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`${buttonBaseClass} ${editor.isActive('underline') ? activeClass : ''}`}
                >
                    <span className="underline">U</span>
                </button>
            </div>

            <div className="rounded border border-gray-300 p-2 text-sm ring-1 ring-muted transition">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
