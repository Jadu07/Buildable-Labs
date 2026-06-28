'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import FontFamily from '@tiptap/extension-font-family';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { FontSize } from './extensions/FontSize';

import * as Y from 'yjs';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api.service';
import { YjsSocketProvider } from '../../utils/YjsSocketProvider';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../constants/api';
import { EditorToolbar } from './EditorToolbar';
import { EditorContextMenu } from './EditorContextMenu';
import { MenuBar } from './MenuBar';
import { PageSetupModal } from './PageSetupModal';
import { stringToColor, getAvatarUrl } from '../../utils/avatar';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  documentId: string;
  initialContent?: string;
  isEditable?: boolean;
}



/**
 * The actual editor. Only mounts when ydoc + provider are fully synced.
 */
function EditorCore({ documentId, initialContent, provider, ydoc, isConnected, isFirstUser, isEditable = true }: {
  documentId: string;
  initialContent?: string;
  provider: YjsSocketProvider;
  ydoc: Y.Doc;
  isConnected: boolean;
  isFirstUser: boolean;
  isEditable?: boolean;
}) {
  const { user } = useAuth();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [awarenessUsers, setAwarenessUsers] = useState<any[]>([]);
  const [isUsersPanelOpen, setIsUsersPanelOpen] = useState(false);
  
  const [isPageSetupOpen, setIsPageSetupOpen] = useState(false);
  const [pageMargins, setPageMargins] = useState({ top: 96, right: 96, bottom: 96, left: 96 });

  const previousUsersRef = useRef<Set<number>>(new Set());
  const isInitialLoad = useRef(true);
  const hasInjectedTemplate = useRef(false);

  // Track connected collaborators via Yjs awareness
  useEffect(() => {
    const awareness = provider.awareness;
    const updateUsers = () => {
      const states = awareness.getStates();
      const users: any[] = [];
      const currentClientIds = new Set<number>();

      states.forEach((state: any, clientId: number) => {
        if (state.user && clientId !== awareness.clientID) {
          users.push({ clientId, ...state.user, isTyping: state.isTyping });
          currentClientIds.add(clientId);
          
          if (!isInitialLoad.current && !previousUsersRef.current.has(clientId)) {
            toast.success(`${state.user.name || 'A user'} joined`, { 
              icon: '👋',
              style: { borderRadius: '8px', background: '#171A20', color: '#fff', fontSize: '14px' }
            });
          }
        }
      });

      previousUsersRef.current = currentClientIds;
      isInitialLoad.current = false;
      setAwarenessUsers(users);
    };
    awareness.on('change', updateUsers);
    updateUsers();
    return () => { awareness.off('change', updateUsers); };
  }, [provider]);

  const saveToBackend = useCallback(async (content: string) => {
    try {
      await api.put(`/documents/${documentId}`, { content });
    } catch {
      // Silent fail
    }
  }, [documentId]);

  const userName = user?.name || user?.email || 'Anonymous';
  const userColor = user?.color || stringToColor(userName);

  const editor = useEditor({
    editable: isEditable,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: false, // Yjs handles undo/redo
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      CharacterCount,
      Image.configure({
        allowBase64: true,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: userName,
          color: userColor,
          email: user?.email,
          avatarUrl: user?.avatarUrl,
        },
        render(user) {
          const cursor = document.createElement('span');
          cursor.classList.add('collaboration-cursor__caret');
          cursor.setAttribute('style', `border-color: ${user.color}`);

          const label = document.createElement('div');
          label.classList.add('collaboration-cursor__label');
          label.setAttribute('style', `background-color: ${user.color}; display: flex; align-items: center; border-radius: 4px; padding: 2px 6px; font-weight: 500;`);

          const textSpan = document.createElement('span');
          textSpan.textContent = user.name;
          label.appendChild(textSpan);

          cursor.insertBefore(label, null);
          return cursor;
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
      }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Write something amazing...',
      }),
      Typography,
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      FontFamily,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      FontSize,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert prose-blue max-w-none focus:outline-none min-h-[800px] px-8 py-10',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveToBackend(html);
        provider.pushFullState();
      }, 3000);

      // Typing awareness - only trigger if we are the ones focused/typing!
      if (ed.isFocused) {
        provider.awareness.setLocalStateField('isTyping', true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          provider.awareness.setLocalStateField('isTyping', false);
        }, 2000);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  // Bulletproof initial content injection for templates
  useEffect(() => {
    if (editor && isConnected && initialContent && !hasInjectedTemplate.current) {
      hasInjectedTemplate.current = true;
      // Small timeout to ensure Yjs has fully settled
      setTimeout(() => {
        if (editor.getText().trim() === '') {
          editor.commands.setContent(initialContent);
          provider.pushFullState();
        }
      }, 300);
    }
  }, [editor, isConnected, initialContent, provider]);

  useEffect(() => {
    const handleRestore = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (editor && customEvent.detail) {
        editor.commands.setContent(customEvent.detail);
        provider.pushFullState();
      }
    };
    window.addEventListener('RESTORE_DOCUMENT', handleRestore);
    return () => window.removeEventListener('RESTORE_DOCUMENT', handleRestore);
  }, [editor, provider]);

  if (!editor) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const allUsers = [
    { clientId: provider.awareness.clientID, name: userName, color: userColor, email: user?.email, avatarUrl: user?.avatarUrl },
    ...awarenessUsers
  ];

  const getEditingText = () => {
    const typingUsers = awarenessUsers.filter(u => u.isTyping);
    if (typingUsers.length === 0) return null;
    const names = typingUsers.map(u => u.name?.split(' ')[0] || 'Someone');
    if (names.length === 1) return `${names[0]} is typing`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
    return `${names[0]} and ${names.length - 1} others are typing`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F4F4F4] dark:bg-[#171A20]">
      {/* Tesla Style Unified Header area */}
      {isEditable && (
        <div className="flex-none flex flex-col bg-white dark:bg-[#171A20] border-b border-[#EEEEEE] dark:border-[#393C41]">
          <MenuBar editor={editor} onPageSetupClick={() => setIsPageSetupOpen(true)} />
          <div className="px-3 py-1.5 flex items-center border-t border-[#EEEEEE] dark:border-[#393C41]">
            <EditorToolbar editor={editor} />
          </div>
        </div>
      )}
      
      {/* Scrolling Document Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 relative bg-[#F4F4F4] dark:bg-[#171A20]">
        {/* Users Panel */}
        <div className="absolute top-4 right-6 flex flex-col items-end z-20">
          <button 
            onClick={() => setIsUsersPanelOpen(!isUsersPanelOpen)}
            className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white dark:bg-[#1C1F26] border border-[#EEEEEE] dark:border-[#393C41] shadow-sm hover:shadow hover:border-[#D1D1D1] dark:hover:border-[#4A4E56] transition-all cursor-pointer"
            title={`${allUsers.length} User${allUsers.length !== 1 ? 's' : ''} Online`}
          >
            <img 
              src={allUsers[0].avatarUrl || getAvatarUrl(allUsers[0].name, allUsers[0].email)}
              alt={allUsers[0].name}
              className="w-7 h-7 rounded-full border-2 bg-white dark:bg-[#171A20]"
              style={{ borderColor: allUsers[0].color || '#3E6AE1' }}
            />
            <span className="text-[13px] font-medium text-[#171A20] dark:text-white max-w-[100px] truncate hidden sm:block">
              {allUsers[0].name}
            </span>
            
            {allUsers.length > 1 && (
              <>
                <div className="w-[1px] h-4 bg-[#EEEEEE] dark:bg-[#393C41] mx-0.5"></div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#5C5E62] dark:text-[#A0A0A0]" />
                  <span className="text-[12px] font-bold text-[#5C5E62] dark:text-[#D0D1D2]">
                    +{allUsers.length - 1}
                  </span>
                </div>
              </>
            )}
          </button>

          {isUsersPanelOpen && (
            <div className="mt-2 bg-white dark:bg-[#171A20] border border-[#EEEEEE] dark:border-[#393C41] rounded-[8px] shadow-xl w-60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 border-b border-[#EEEEEE] dark:border-[#393C41] flex items-center justify-between text-xs font-semibold text-[#171A20] dark:text-white bg-[#FAFAFA] dark:bg-[#121418]">
                <span>Collaborators ({allUsers.length})</span>
              </div>
              <div className="p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                {allUsers.map((u, i) => {
                  const avatarUrl = u.avatarUrl || getAvatarUrl(u.name, u.email);
                  return (
                    <div key={u.clientId || i} className="flex items-center gap-3 px-2 py-2 rounded-[6px] hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] transition-colors group cursor-default">
                      <div className="relative">
                        <img 
                          src={avatarUrl}
                          alt={u.name}
                          className="w-8 h-8 rounded-full border-2 bg-white dark:bg-[#171A20] transition-colors"
                          style={{ borderColor: u.color || '#3E6AE1' }}
                        />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 ml-1">
                        <span className="text-[13px] font-medium text-[#171A20] dark:text-white truncate">
                          {u.name} {u.clientId === provider.awareness.clientID && <span className="text-[#888] font-normal ml-1">(You)</span>}
                        </span>
                        <span className="text-[11px] text-[#5C5E62] dark:text-[#A0A0A0] truncate">
                          {u.email || 'Online now'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* The Paper Document (Infinitely extending) */}
        <div 
          className={`w-[816px] max-w-full mx-auto min-h-[1056px] border border-[#EEEEEE] dark:border-[#393C41] mb-16 relative bg-white dark:bg-[#171A20] shadow-sm ${!isEditable ? 'opacity-95' : ''}`}
        >
          <EditorContent 
            editor={editor} 
            className="min-h-[1056px] outline-none prose max-w-none dark:prose-invert focus:outline-none" 
            style={{ 
              paddingTop: pageMargins.top, 
              paddingRight: pageMargins.right, 
              paddingBottom: pageMargins.bottom, 
              paddingLeft: pageMargins.left 
            }}
          />
          {isEditable && <EditorContextMenu editor={editor} />}
        </div>

        {/* Presence Indicator */}
        {getEditingText() && (
          <div className="fixed bottom-6 left-6 bg-[#171A20]/95 dark:bg-[#FAFAFA]/95 backdrop-blur-md border border-white/10 dark:border-black/5 px-4 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-none">
            <div className="flex -space-x-1.5">
              {awarenessUsers.filter(u => u.isTyping).slice(0, 3).map((u, i) => (
                <img 
                  key={i}
                  src={u.avatarUrl || getAvatarUrl(u.name, u.email)}
                  className="w-5 h-5 rounded-full border border-black/20 bg-white"
                  alt={u.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-white dark:text-[#171A20] tracking-wide">
                {getEditingText()}
              </span>
              <div className="flex gap-[3px] items-center ml-0.5">
                <span className="w-1 h-1 bg-white/70 dark:bg-black/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1 h-1 bg-white/70 dark:bg-black/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1 h-1 bg-white/70 dark:bg-black/50 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}


        {/* Word Count Chip */}
        <div className="fixed bottom-6 right-6 bg-white dark:bg-[#171A20] border border-[#EEEEEE] dark:border-[#393C41] rounded-full px-4 py-2 text-[13px] font-medium text-[#171A20] dark:text-white z-20 flex items-center gap-2 shadow-sm transition-all hover:shadow-md cursor-default">
          <span>{editor.storage.characterCount.words()} words</span>
          <span className="text-[#EEEEEE] dark:text-[#393C41]">|</span>
          <span>{editor.storage.characterCount.characters()} chars</span>
        </div>
      </div>

      <PageSetupModal
        isOpen={isPageSetupOpen}
        onClose={() => setIsPageSetupOpen(false)}
        margins={pageMargins}
        onSave={setPageMargins}
      />
    </div>
  );
}

/**
 * Main wrapper. Creates socket → provider → waits for sync → renders editor.
 */
export function TipTapEditor({ documentId, initialContent, isEditable = true }: TipTapEditorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<YjsSocketProvider | null>(null);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
  }
  const ydoc = ydocRef.current;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // 1. Create socket
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    // 2. Create provider (wires up all Yjs <-> Socket listeners)
    const p = new YjsSocketProvider(socket, documentId, ydoc);
    setProvider(p);

    socket.on('connect', () => {
      console.log('[Collab] Connected:', socket.id);
      setIsConnected(true);
      socket.emit('join-document', documentId);
    });

    socket.on('disconnect', () => {
      console.log('[Collab] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Collab] Connection error:', err.message);
    });

    // 3. Wait for initial sync to complete
    p.waitForSync().then((firstUser) => {
      console.log('[Collab] Synced. First user:', firstUser);
      setIsFirstUser(firstUser);
      setIsSynced(true);
    });

    return () => {
      p.destroy();
      socket.emit('leave-document', documentId);
      socket.disconnect();
      setProvider(null);
      setIsSynced(false);
      setIsConnected(false);
    };
  }, [documentId, ydoc]);

  // Show loading until provider is created AND initial sync is done
  if (!provider || !isSynced) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <EditorCore
      documentId={documentId}
      initialContent={initialContent}
      provider={provider}
      ydoc={ydoc}
      isConnected={isConnected}
      isFirstUser={isFirstUser}
      isEditable={isEditable}
    />
  );
}
