import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Copy, Scissors, ClipboardPaste, Link as LinkIcon, 
  Trash2, Table as TableIcon, Columns, Rows
} from 'lucide-react';

interface EditorContextMenuProps {
  editor: Editor | null;
}

export function EditorContextMenu({ editor }: EditorContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (event: MouseEvent) => {
      // Only handle if clicking inside the editor
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement && editorElement.contains(event.target as Node)) {
        event.preventDefault();
        setIsOpen(true);
        setPosition({ x: event.clientX, y: event.clientY });
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editor]);

  if (!isOpen || !editor) return null;

  // Make sure menu doesn't go offscreen
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`,
    zIndex: 50,
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const inTable = editor.isActive('table');

  return (
    <div 
      ref={menuRef}
      style={menuStyle}
      className="w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 transform -translate-y-2"
    >
      <ContextMenuItem 
        icon={<Copy size={16} />} 
        label="Copy" 
        onClick={() => {
          document.execCommand('copy');
          setIsOpen(false);
        }} 
      />
      <ContextMenuItem 
        icon={<Scissors size={16} />} 
        label="Cut" 
        onClick={() => {
          document.execCommand('cut');
          setIsOpen(false);
        }} 
      />
      <ContextMenuItem 
        icon={<ClipboardPaste size={16} />} 
        label="Paste" 
        onClick={() => {
          // Paste relies on browser permission, usually we tell them to use Cmd+V
          alert('Please use Ctrl+V or Cmd+V to paste due to browser security restrictions.');
          setIsOpen(false);
        }} 
      />
      
      <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1"></div>
      
      <ContextMenuItem 
        icon={<LinkIcon size={16} />} 
        label="Add Link" 
        onClick={() => handleAction(() => {
          const previousUrl = editor.getAttributes('link').href;
          const url = window.prompt('URL', previousUrl);
          if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }
        })} 
      />

      <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1"></div>

      {inTable ? (
        <>
          <ContextMenuItem 
            icon={<Rows size={16} />} 
            label="Insert Row Above" 
            onClick={() => handleAction(() => editor.chain().focus().addRowBefore().run())} 
          />
          <ContextMenuItem 
            icon={<Rows size={16} />} 
            label="Insert Row Below" 
            onClick={() => handleAction(() => editor.chain().focus().addRowAfter().run())} 
          />
          <ContextMenuItem 
            icon={<Columns size={16} />} 
            label="Insert Column Left" 
            onClick={() => handleAction(() => editor.chain().focus().addColumnBefore().run())} 
          />
          <ContextMenuItem 
            icon={<Columns size={16} />} 
            label="Insert Column Right" 
            onClick={() => handleAction(() => editor.chain().focus().addColumnAfter().run())} 
          />
          <ContextMenuItem 
            icon={<Trash2 size={16} className="text-red-500" />} 
            label="Delete Table" 
            onClick={() => handleAction(() => editor.chain().focus().deleteTable().run())} 
          />
        </>
      ) : (
        <ContextMenuItem 
          icon={<TableIcon size={16} />} 
          label="Insert Table" 
          onClick={() => handleAction(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())} 
        />
      )}
    </div>
  );
}

function ContextMenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left"
    >
      <span className="text-zinc-500 dark:text-zinc-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
