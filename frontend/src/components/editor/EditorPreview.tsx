'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import FontFamily from '@tiptap/extension-font-family';
import { useEffect } from 'react';

export function EditorPreview({ content }: { content: any }) {
  const editor = useEditor({
    editable: false,
    content: content,
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      FontFamily,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert prose-blue max-w-none focus:outline-none px-8 py-10',
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div className="w-[816px] max-w-full mx-auto bg-white dark:bg-[#171A20] min-h-[1056px] border border-[#EEEEEE] dark:border-[#393C41] shadow-2xl overflow-y-auto">
      <div className="bg-[#FAFAFA] dark:bg-[#121418] border-b border-[#EEEEEE] dark:border-[#393C41] px-6 py-3 flex items-center justify-center sticky top-0 z-10 shadow-sm">
        <span className="text-sm font-semibold text-[#5C5E62] dark:text-[#A0A0A0] uppercase tracking-wider">Preview Mode</span>
      </div>
      <EditorContent editor={editor} className="min-h-[1056px] px-[96px] py-[64px]" />
    </div>
  );
}
