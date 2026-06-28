import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, Link as LinkIcon, Image as ImageIcon, Table as TableIcon,
  ChevronDown
} from 'lucide-react';

const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Comic Sans', value: '"Comic Sans MS", "Comic Sans", cursive' },
  { name: 'Serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { name: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
];

const FONT_SIZES = [
  '8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '60px', '72px'
];

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    if (url === null) {
      return;
    }
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          editor.chain().focus().setImage({ src: event.target.result as string }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 bg-transparent w-full relative">
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <div className="flex items-center gap-1 pr-2 border-r border-[#EEEEEE] dark:border-[#393C41]">
        {/* Font Family Dropdown */}
        <div className="relative group">
          <button className="flex items-center justify-between gap-1 h-7 px-2 text-sm text-[#5C5E62] dark:text-[#A0A0A0] hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] rounded-[4px] min-w-[100px] border border-transparent hover:border-[#EEEEEE] dark:hover:border-[#4A4E56] transition-colors cursor-pointer">
            <span className="truncate max-w-[80px]">
              {FONT_FAMILIES.find(f => editor.isActive('textStyle', { fontFamily: f.value }))?.name || 'Font'}
            </span>
            <ChevronDown size={14} />
          </button>
          <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-50 min-w-[120px]">
            <div className="bg-white dark:bg-[#2C2E33] border border-[#EEEEEE] dark:border-[#393C41] rounded-[6px] shadow-lg py-1">
              <button 
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] text-[#171A20] dark:text-white"
                onClick={() => editor.chain().focus().unsetFontFamily().run()}
              >
                Default
              </button>
              {FONT_FAMILIES.map(font => (
                <button 
                  key={font.name}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] text-[#171A20] dark:text-white"
                  style={{ fontFamily: font.value }}
                  onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Font Size Dropdown */}
        <div className="relative group">
          <button className="flex items-center justify-between gap-1 h-7 px-2 text-sm text-[#5C5E62] dark:text-[#A0A0A0] hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] rounded-[4px] min-w-[60px] border border-transparent hover:border-[#EEEEEE] dark:hover:border-[#4A4E56] transition-colors cursor-pointer">
            <span>
              {editor.getAttributes('textStyle').fontSize?.replace('px', '') || 'Size'}
            </span>
            <ChevronDown size={14} />
          </button>
          <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-50">
            <div className="bg-white dark:bg-[#2C2E33] border border-[#EEEEEE] dark:border-[#393C41] rounded-[6px] shadow-lg py-1 max-h-[200px] overflow-y-auto min-w-[60px]">
              <button 
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] text-[#171A20] dark:text-white"
                onClick={() => editor.chain().focus().unsetFontSize().run()}
              >
                Default
              </button>
              {FONT_SIZES.map(size => (
                <button 
                  key={size}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] text-[#171A20] dark:text-white"
                  onClick={() => editor.chain().focus().setFontSize(size).run()}
                >
                  {size.replace('px', '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-[#EEEEEE] dark:border-[#393C41]">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          isActive={editor.isActive('heading', { level: 1 })}
          icon={<Heading1 size={16} />} 
          title="Heading 1"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          isActive={editor.isActive('heading', { level: 2 })}
          icon={<Heading2 size={16} />} 
          title="Heading 2"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
          isActive={editor.isActive('heading', { level: 3 })}
          icon={<Heading3 size={16} />} 
          title="Heading 3"
        />
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-[#EEEEEE] dark:border-[#393C41]">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          isActive={editor.isActive('bold')}
          icon={<Bold size={16} />} 
          title="Bold (Cmd+B)"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          isActive={editor.isActive('italic')}
          icon={<Italic size={16} />} 
          title="Italic (Cmd+I)"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          isActive={editor.isActive('underline')}
          icon={<UnderlineIcon size={16} />} 
          title="Underline (Cmd+U)"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleStrike().run()} 
          isActive={editor.isActive('strike')}
          icon={<Strikethrough size={16} />} 
          title="Strikethrough"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleCode().run()} 
          isActive={editor.isActive('code')}
          icon={<Code size={16} />} 
          title="Code"
        />
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-[#EEEEEE] dark:border-[#393C41]">
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('left').run()} 
          isActive={editor.isActive({ textAlign: 'left' }) || (!editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }) && !editor.isActive({ textAlign: 'justify' }))}
          icon={<AlignLeft size={16} />} 
          title="Align Left"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('center').run()} 
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={<AlignCenter size={16} />} 
          title="Align Center"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('right').run()} 
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={<AlignRight size={16} />} 
          title="Align Right"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
          isActive={editor.isActive({ textAlign: 'justify' })}
          icon={<AlignJustify size={16} />} 
          title="Justify"
        />
      </div>

      <div className="flex items-center gap-1 px-2 border-r border-[#EEEEEE] dark:border-[#393C41]">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          isActive={editor.isActive('bulletList')}
          icon={<List size={16} />} 
          title="Bullet List"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          isActive={editor.isActive('orderedList')}
          icon={<ListOrdered size={16} />} 
          title="Ordered List"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleTaskList().run()} 
          isActive={editor.isActive('taskList')}
          icon={<CheckSquare size={16} />} 
          title="Task List"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          isActive={editor.isActive('blockquote')}
          icon={<Quote size={16} />} 
          title="Blockquote"
        />
      </div>

      <div className="flex items-center gap-1 px-2">
        <ToolbarButton 
          onClick={toggleLink} 
          isActive={editor.isActive('link')}
          icon={<LinkIcon size={16} />} 
          title="Insert Link"
        />
        <ToolbarButton 
          onClick={addImage} 
          icon={<ImageIcon size={16} />} 
          title="Insert Image"
        />
        <ToolbarButton 
          onClick={insertTable} 
          icon={<TableIcon size={16} />} 
          title="Insert Table"
        />
      </div>
    </div>
  );
}

function ToolbarButton({ 
  onClick, 
  isActive = false, 
  icon, 
  title, 
  disabled = false 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  icon: React.ReactNode; 
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 flex items-center justify-center rounded-[4px] transition-all border-none bg-transparent
        ${isActive 
          ? 'bg-[#F4F4F4] dark:bg-[#393C41] text-[#171A20] dark:text-white' 
          : 'text-[#5C5E62] hover:bg-[#F4F4F4] hover:text-[#171A20] dark:text-[#D0D1D2] dark:hover:bg-[#393C41] dark:hover:text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {icon}
    </button>
  );
}
