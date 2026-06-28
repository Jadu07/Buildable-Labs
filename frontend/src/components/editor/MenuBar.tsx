import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface MenuBarProps {
  editor: Editor;
  onPageSetupClick?: () => void;
}

export function MenuBar({ editor, onPageSetupClick }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleAction = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  const menuItems = [
    {
      name: 'File',
      items: [
        { label: 'New document', action: () => window.open('/dashboard', '_blank') },
        ...(onPageSetupClick ? [{ label: 'Page setup', action: onPageSetupClick }] : []),
        { label: 'Print', action: () => window.print() },
      ],
    },
    {
      name: 'Edit',
      items: [
        { label: 'Undo', action: () => editor.chain().focus().undo().run() },
        { label: 'Redo', action: () => editor.chain().focus().redo().run() },
        { label: 'Select All', action: () => editor.chain().focus().selectAll().run() },
      ],
    },
    {
      name: 'View',
      items: [
        { label: 'Toggle Fullscreen', action: () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            }
          }
        }},
      ],
    },
    {
      name: 'Insert',
      items: [
        { label: 'Image', action: () => {
          const url = window.prompt('Enter image URL:');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }},
        { label: 'Table (3x3)', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
        { label: 'Horizontal Rule', action: () => editor.chain().focus().setHorizontalRule().run() },
      ],
    },
    {
      name: 'Format',
      items: [
        { label: 'Bold', action: () => editor.chain().focus().toggleBold().run() },
        { label: 'Italic', action: () => editor.chain().focus().toggleItalic().run() },
        { label: 'Underline', action: () => editor.chain().focus().toggleUnderline().run() },
        { label: 'Clear Formatting', action: () => editor.chain().focus().unsetAllMarks().clearNodes().run() },
      ],
    },
  ];

  return (
    <div className="flex items-center gap-1 px-4 py-1 text-[14px] text-[#171A20] dark:text-white relative bg-white dark:bg-[#171A20]" ref={menuRef}>
      {menuItems.map((menu) => (
        <div key={menu.name} className="relative">
          <button
            onClick={() => toggleMenu(menu.name)}
            className={`px-3 py-1.5 rounded-[4px] transition-colors cursor-pointer border-none bg-transparent font-medium ${
              activeMenu === menu.name 
                ? 'bg-[#F4F4F4] dark:bg-[#393C41]' 
                : 'hover:bg-[#F4F4F4] dark:hover:bg-[#393C41]'
            }`}
          >
            {menu.name}
          </button>
          
          {activeMenu === menu.name && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#171A20] border border-[#EEEEEE] dark:border-[#393C41] rounded-[4px] shadow-sm py-1 z-50">
              {menu.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAction(item.action)}
                  className="w-full text-left px-4 py-2 text-[14px] text-[#171A20] dark:text-white hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] transition-colors border-none bg-transparent cursor-pointer font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
