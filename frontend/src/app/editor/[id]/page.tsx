'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { TipTapEditor } from '../../../components/editor/TipTapEditor';
import api from '../../../services/api.service';
import { Document } from '../../../types';
import toast from 'react-hot-toast';
import { ShareModal } from '../../../components/editor/ShareModal';
import { HistorySidebar } from '../../../components/editor/HistorySidebar';
import { Share2, Globe, Lock, FileText, User, Clock, History } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '../../../components/ui/Logo';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { getAvatarUrl } from '../../../utils/avatar';

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const getTemplateContent = (template: string | null) => {
    switch (template) {
      case 'meeting-notes':
        return `<h2>Meeting Notes</h2><p><strong>Date:</strong> [Today's Date]</p><p><strong>Attendees:</strong> [List of attendees]</p><h3>Agenda</h3><ul><li><p>Topic 1</p></li><li><p>Topic 2</p></li></ul><h3>Action Items</h3><ul data-type="taskList"><li data-type="taskItem"><p>Action 1</p></li></ul>`;
      case 'project-proposal':
        return `<h2>Project Proposal</h2><p><strong>Project Name:</strong> [Name]</p><h3>Overview</h3><p>Briefly describe the project background and objectives here.</p><h3>Goals</h3><ul><li><p>Goal 1</p></li><li><p>Goal 2</p></li></ul><h3>Timeline & Milestones</h3><p>Expected delivery date: [Date]</p>`;
      case 'brainstorming':
        return `<h2>Brainstorming Session</h2><h3>Topic: [Topic]</h3><p>Let's drop some ideas below:</p><ul><li><p>Idea 1: </p></li><li><p>Idea 2: </p></li></ul>`;
      case 'resume':
        return `<h2>[Your Name]</h2><p>[Your Address] | [Your Email] | [Your Phone]</p><h3>Summary</h3><p>A brief summary of your professional background and goals.</p><h3>Experience</h3><ul><li><p><strong>[Job Title]</strong> at [Company Name] (Year - Year)</p><p>Description of your responsibilities and achievements.</p></li></ul><h3>Education</h3><ul><li><p><strong>[Degree]</strong> from [University Name] (Year)</p></li></ul>`;
      case 'invoice':
        return `<h2>INVOICE</h2><p><strong>Invoice Number:</strong> #001</p><p><strong>Date:</strong> [Today's Date]</p><h3>Bill To:</h3><p>[Client Name]<br>[Client Address]</p><table style="min-width: 100%"><tbody><tr><th><p>Description</p></th><th><p>Amount</p></th></tr><tr><td><p>Service or Product</p></td><td><p>$0.00</p></td></tr><tr><td><p><strong>Total</strong></p></td><td><p><strong>$0.00</strong></p></td></tr></tbody></table><p>Thank you for your business!</p>`;
      default:
        return '';
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && id) {
      fetchDocument(id);
    }
  }, [user, id]);

  const fetchDocument = async (docId: string) => {
    try {
      const res = await api.get(`/documents/${docId}`);
      setDocument(res.data.data);
    } catch (error: any) {
      toast.error('Failed to load document or access denied');
      router.push('/dashboard');
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const handleTitleChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (newTitle !== document?.title) {
      try {
        await api.put(`/documents/${id}`, { title: newTitle });
        setDocument(prev => prev ? { ...prev, title: newTitle } : prev);
      } catch (error) {
        toast.error('Failed to update title');
      }
    }
  };



  if (loading || isLoadingDoc) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F4F4] dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E6AE1]"></div>
      </div>
    );
  }

  if (!document) return null;

  const currentUserRole = document.ownerId === user?.id 
    ? 'OWNER' 
    : document.collaborators.find(c => c.userId === user?.id)?.role 
      || (document.isPublic ? document.publicRole : 'NONE');

  const isEditable = ['OWNER', 'EDITOR', 'CONTRIBUTOR'].includes(currentUserRole);

  return (
    <div className="flex flex-col h-screen bg-[#F4F4F4] dark:bg-[#171A20] overflow-hidden font-sans">
      {/* Sleek Tesla-style Header */}
      <header className="flex-none h-14 bg-white dark:bg-[#171A20] flex items-center justify-between px-6 border-b border-[#EEEEEE] dark:border-[#393C41]">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center group transition-opacity hover:opacity-80 hidden sm:flex">
            <Logo />
          </Link>
          
          <div className="h-4 w-px bg-[#EEEEEE] dark:bg-[#393C41] hidden sm:block"></div>
          
          <div className="flex items-center">
            <input
              type="text"
              defaultValue={document.title}
              onBlur={handleTitleChange}
              disabled={!isEditable}
              className="text-[15px] font-medium text-[#171A20] dark:text-white bg-transparent border-none outline-none hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] focus:bg-white dark:focus:bg-[#171A20] focus:ring-1 focus:ring-[#3E6AE1] rounded-[4px] px-2 py-1 transition-colors disabled:hover:bg-transparent disabled:opacity-80"
              placeholder="Untitled document"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center justify-center w-9 h-9 text-[#5C5E62] dark:text-[#A0A0A0] hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] rounded-[4px] transition-colors"
            title="Version History"
          >
            <History className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[14px] font-medium text-white bg-[#3E6AE1] hover:bg-[#3256B7] rounded-[4px] transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>

          <div className="h-4 w-px bg-[#EEEEEE] dark:bg-[#393C41] mx-1"></div>

          <div className="flex items-center gap-2">
            {currentUserRole !== 'OWNER' && (
              <span className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-[11px] font-medium tracking-wide uppercase rounded-[4px] bg-[#F4F4F4] dark:bg-[#393C41] text-[#5C5E62] dark:text-[#A0A0A0] border border-[#EEEEEE] dark:border-[#4A4E56]">
                {currentUserRole}
              </span>
            )}
            <img 
              src={user?.avatarUrl || getAvatarUrl(user?.name || '', user?.email)} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full border border-[#EEEEEE] dark:border-[#393C41] object-cover"
            />
          </div>
        </div>
      </header>

      {/* Editor Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <TipTapEditor 
          documentId={id} 
          isEditable={isEditable}
          initialContent={
            (document.content && (typeof document.content === 'string' 
              ? document.content.trim().length > 0 && document.content !== '{}' 
              : Object.keys(document.content).length > 0 && !(document.content.type === 'doc' && (!document.content.content || document.content.content.length === 0))
            ))
              ? document.content 
              : getTemplateContent(templateId)
          } 
        />
      </main>

      {document && (
        <ShareModal
          documentId={id}
          collaborators={document.collaborators}
          isPublic={document.isPublic}
          publicRole={document.publicRole || 'VIEWER'}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShared={() => fetchDocument(id)}
        />
      )}

      {document && (
        <HistorySidebar
          documentId={id}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onRestore={(content) => {
            window.dispatchEvent(new CustomEvent('RESTORE_DOCUMENT', { detail: content }));
          }}
        />
      )}
    </div>
  );
}
