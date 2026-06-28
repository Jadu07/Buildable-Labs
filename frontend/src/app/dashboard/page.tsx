'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../services/api.service';
import { Document } from '../../types';
import { Header } from '../../components/layout/Header';
import { FileText, Plus, MoreVertical, Search, LayoutGrid, List as ListIcon, Clock, Users, User, ArrowDownAZ, Download, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';

const getShortRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
};

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'owned' | 'shared';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const createNewDocument = async (title: string = 'Untitled Document', templateId?: string) => {
    try {
      setCreatingTemplateId(templateId || 'blank');
      const res = await api.post('/documents', { title });
      toast.success('Document created');
      const url = `/editor/${res.data.data.id}${templateId ? `?template=${templateId}` : ''}`;
      router.push(url);
    } catch (error) {
      toast.error('Failed to create document');
      setCreatingTemplateId(null);
    }
  };

  const deleteDocument = async (e: React.MouseEvent, doc: Document) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isOwner = doc.ownerId === user?.id;
    if (!confirm(isOwner ? 'Are you sure you want to delete this document?' : 'Are you sure you want to remove this document from your dashboard?')) return;
    
    try {
      if (isOwner) {
        await api.delete(`/documents/${doc.id}`);
        toast.success('Document deleted');
      } else {
        await api.delete(`/documents/${doc.id}/collaborators/${user?.id}`);
        toast.success('Document removed');
      }
      setDocuments(docs => docs.filter(d => d.id !== doc.id));
    } catch (error) {
      toast.error(isOwner ? 'Failed to delete document' : 'Failed to remove document');
    }
  };

  const downloadDocument = (e: React.MouseEvent, doc: Document) => {
    e.preventDefault();
    e.stopPropagation();
    // Assuming doc.content is available or we download a placeholder if not
    const content = doc.title + '\n\nDownloaded from Typespace.';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${doc.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // Filter by search
      if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by tab
      if (filterMode === 'owned' && doc.ownerId !== user?.id) return false;
      if (filterMode === 'shared' && doc.ownerId === user?.id) return false;

      return true;
    });
  }, [documents, searchQuery, filterMode, user]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#171A20]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E6AE1]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FBFD] dark:bg-[#0D0F12] font-sans flex flex-col">
      <Header />
      
      {/* Template Section */}
      <section className="bg-[#F0F4F9] dark:bg-[#15181C] py-8 border-b border-[#E8EAED] dark:border-[#2C2E33]">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#1F1F1F] dark:text-[#E8EAED] text-base font-medium">Start a new document</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            
            {/* Blank Template */}
            <button 
              onClick={() => createNewDocument('Untitled Document')} 
              disabled={!!creatingTemplateId}
              className="group flex flex-col items-center gap-3 w-40 min-w-[160px] disabled:opacity-50 relative"
            >
              <div className="w-full aspect-[3/4] bg-white dark:bg-[#202328] rounded-[6px] border border-[#DADCE0] dark:border-[#393C41] hover:border-[#3E6AE1] dark:hover:border-[#3E6AE1] transition-colors flex items-center justify-center shadow-sm group-hover:shadow-md relative">
                {creatingTemplateId === 'blank' ? (
                  <div className="h-8 w-8 rounded-full border-2 border-[#3E6AE1] border-t-transparent animate-spin" />
                ) : (
                  <Plus className="w-12 h-12 text-[#1A73E8] dark:text-[#3E6AE1] font-light" strokeWidth={1} />
                )}
              </div>
              <span className="text-sm font-medium text-[#3C4043] dark:text-[#E8EAED]">Blank</span>
            </button>

            {/* Meeting Notes Template */}
            <button 
              onClick={() => createNewDocument('Meeting Notes', 'meeting-notes')} 
              disabled={!!creatingTemplateId}
              className="group flex flex-col items-center gap-3 w-40 min-w-[160px] disabled:opacity-50"
            >
              <div className="w-full aspect-[3/4] bg-white dark:bg-[#202328] rounded-[6px] border border-[#DADCE0] dark:border-[#393C41] hover:border-[#3E6AE1] dark:hover:border-[#3E6AE1] transition-colors shadow-sm group-hover:shadow-md overflow-hidden relative">
                {creatingTemplateId === 'meeting-notes' && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-2 border-[#3E6AE1] border-t-transparent animate-spin" />
                  </div>
                )}
                <div className="absolute top-4 left-4 right-4 h-2 bg-[#1A73E8] dark:bg-[#3E6AE1] rounded-sm opacity-20"></div>
                <div className="absolute top-8 left-4 w-2/3 h-1.5 bg-[#DADCE0] dark:bg-[#393C41] rounded-sm"></div>
                <div className="absolute top-12 left-4 right-4 h-1 bg-[#F1F3F4] dark:bg-[#2C2E33] rounded-sm"></div>
                <div className="absolute top-14 left-4 right-4 h-1 bg-[#F1F3F4] dark:bg-[#2C2E33] rounded-sm"></div>
                <div className="absolute top-16 left-4 w-1/2 h-1 bg-[#F1F3F4] dark:bg-[#2C2E33] rounded-sm"></div>
              </div>
              <span className="text-sm font-medium text-[#3C4043] dark:text-[#E8EAED]">Meeting Notes</span>
            </button>

            {/* Project Proposal Template */}
            <button 
              onClick={() => createNewDocument('Project Proposal', 'project-proposal')} 
              disabled={!!creatingTemplateId}
              className="group flex flex-col items-center gap-3 w-40 min-w-[160px] disabled:opacity-50"
            >
              <div className="w-full aspect-[3/4] bg-white dark:bg-[#202328] rounded-[6px] border border-[#DADCE0] dark:border-[#393C41] hover:border-[#3E6AE1] dark:hover:border-[#3E6AE1] transition-colors shadow-sm group-hover:shadow-md overflow-hidden relative">
                {creatingTemplateId === 'project-proposal' && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-2 border-[#3E6AE1] border-t-transparent animate-spin" />
                  </div>
                )}
                <div className="absolute top-4 left-4 w-1/2 h-2.5 bg-[#5F6368] dark:bg-[#9AA0A6] rounded-sm"></div>
                <div className="absolute top-10 left-4 right-4 h-12 bg-[#F8F9FA] dark:bg-[#15181C] border border-[#DADCE0] dark:border-[#393C41] rounded-sm"></div>
                <div className="absolute top-26 left-4 right-4 h-1 bg-[#F1F3F4] dark:bg-[#2C2E33] rounded-sm"></div>
                <div className="absolute top-28 left-4 w-3/4 h-1 bg-[#F1F3F4] dark:bg-[#2C2E33] rounded-sm"></div>
              </div>
              <span className="text-sm font-medium text-[#3C4043] dark:text-[#E8EAED]">Project Proposal</span>
            </button>

            {/* Brainstorming Template */}
            <button 
              onClick={() => createNewDocument('Brainstorming', 'brainstorming')} 
              disabled={!!creatingTemplateId}
              className="group flex flex-col items-center gap-3 w-40 min-w-[160px] disabled:opacity-50"
            >
              <div className="w-full aspect-[3/4] bg-white dark:bg-[#202328] rounded-[6px] border border-[#DADCE0] dark:border-[#393C41] hover:border-[#3E6AE1] dark:hover:border-[#3E6AE1] transition-colors shadow-sm group-hover:shadow-md overflow-hidden relative">
                {creatingTemplateId === 'brainstorming' && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-2 border-[#3E6AE1] border-t-transparent animate-spin" />
                  </div>
                )}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-[#1A73E8] dark:border-[#3E6AE1] opacity-50"></div>
                <div className="absolute top-[60px] left-8 w-6 h-6 rounded-full border-2 border-[#34A853] opacity-40"></div>
                <div className="absolute top-[50px] right-8 w-5 h-5 rounded-full border-2 border-[#EA4335] opacity-40"></div>
              </div>
              <span className="text-sm font-medium text-[#3C4043] dark:text-[#E8EAED]">Brainstorming</span>
            </button>

            {/* Resume Template */}
            <button 
              onClick={() => createNewDocument('Resume', 'resume')} 
              disabled={!!creatingTemplateId}
              className="group flex flex-col items-center gap-3 w-40 min-w-[160px] disabled:opacity-50"
            >
              <div className="w-full aspect-[3/4] bg-white dark:bg-[#202328] rounded-[6px] border border-[#DADCE0] dark:border-[#393C41] hover:border-[#3E6AE1] dark:hover:border-[#3E6AE1] transition-colors shadow-sm group-hover:shadow-md overflow-hidden relative">
                {creatingTemplateId === 'resume' && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-2 border-[#3E6AE1] border-t-transparent animate-spin" />
                  </div>
                )}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-2 bg-[#1A73E8] dark:bg-[#3E6AE1] rounded-sm opacity-80"></div>
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#5F6368] dark:bg-[#E8EAED] rounded-sm opacity-40"></div>
                <div className="absolute top-16 left-6 w-1/3 h-1.5 bg-[#5F6368] dark:bg-[#E8EAED] rounded-sm"></div>
                <div className="absolute top-20 left-6 right-6 h-1 bg-[#DADCE0] dark:bg-[#393C41] rounded-sm"></div>
                <div className="absolute top-22 left-6 right-6 h-1 bg-[#DADCE0] dark:bg-[#393C41] rounded-sm"></div>
                <div className="absolute top-24 left-6 w-1/2 h-1 bg-[#DADCE0] dark:bg-[#393C41] rounded-sm"></div>
              </div>
              <span className="text-sm font-medium text-[#3C4043] dark:text-[#E8EAED]">Resume</span>
            </button>

            {/* Invoice Template */}
            <button 
              onClick={() => createNewDocument('Invoice', 'invoice')} 
              disabled={!!creatingTemplateId}
              className="group flex flex-col items-center gap-3 w-40 min-w-[160px] disabled:opacity-50"
            >
              <div className="w-full aspect-[3/4] bg-white dark:bg-[#202328] rounded-[6px] border border-[#DADCE0] dark:border-[#393C41] hover:border-[#3E6AE1] dark:hover:border-[#3E6AE1] transition-colors shadow-sm group-hover:shadow-md overflow-hidden relative">
                {creatingTemplateId === 'invoice' && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-2 border-[#3E6AE1] border-t-transparent animate-spin" />
                  </div>
                )}
                <div className="absolute top-6 right-6 w-16 h-2 bg-[#34A853] rounded-sm opacity-80"></div>
                <div className="absolute top-6 left-6 w-10 h-2 bg-[#5F6368] dark:bg-[#E8EAED] rounded-sm"></div>
                <div className="absolute top-14 left-6 right-6 h-10 border border-[#DADCE0] dark:border-[#393C41] rounded-sm">
                  <div className="border-b border-[#DADCE0] dark:border-[#393C41] h-3 w-full"></div>
                  <div className="mt-2 ml-2 w-1/2 h-1 bg-[#DADCE0] dark:bg-[#393C41] rounded-sm"></div>
                </div>
                <div className="absolute bottom-6 right-6 w-12 h-1.5 bg-[#1A73E8] dark:bg-[#3E6AE1] rounded-sm opacity-80"></div>
              </div>
              <span className="text-sm font-medium text-[#3C4043] dark:text-[#E8EAED]">Invoice</span>
            </button>

          </div>
        </div>
      </section>

      {/* Main Documents Section */}
      <main className="container mx-auto max-w-6xl px-6 py-8 flex-1">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          
          <div className="flex items-center gap-6">
            <h2 className="text-[18px] font-medium tracking-tight text-[#171A20] dark:text-white hidden sm:block">Recent documents</h2>
            
            <div className="flex items-center bg-[#F1F3F4] dark:bg-[#1A1D24] p-1 rounded-[8px]">
              <button 
                onClick={() => setFilterMode('all')}
                className={`px-4 py-1.5 rounded-[6px] text-sm font-medium transition-colors ${filterMode === 'all' ? 'bg-white dark:bg-[#2C2E33] shadow-sm text-[#1A73E8] dark:text-[#3E6AE1]' : 'text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-[#E8EAED]'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterMode('owned')}
                className={`px-4 py-1.5 rounded-[6px] text-sm font-medium transition-colors ${filterMode === 'owned' ? 'bg-white dark:bg-[#2C2E33] shadow-sm text-[#1A73E8] dark:text-[#3E6AE1]' : 'text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-[#E8EAED]'}`}
              >
                Owned by me
              </button>
              <button 
                onClick={() => setFilterMode('shared')}
                className={`px-4 py-1.5 rounded-[6px] text-sm font-medium transition-colors ${filterMode === 'shared' ? 'bg-white dark:bg-[#2C2E33] shadow-sm text-[#1A73E8] dark:text-[#3E6AE1]' : 'text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-[#E8EAED]'}`}
              >
                Shared with me
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368] dark:text-[#9AA0A6]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 h-9 pl-9 pr-4 bg-white dark:bg-[#1A1D24] border border-[#DADCE0] dark:border-[#393C41] rounded-[8px] text-[14px] text-[#202124] dark:text-[#E8EAED] focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#1A73E8] dark:focus:ring-[#3E6AE1] transition-all placeholder:text-[#5F6368] dark:placeholder:text-[#9AA0A6]"
              />
            </div>
            
            <div className="flex items-center gap-1 border-l border-[#DADCE0] dark:border-[#393C41] pl-4">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-[6px] transition-colors ${viewMode === 'grid' ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#1A233A] dark:text-[#3E6AE1]' : 'text-[#5F6368] dark:text-[#9AA0A6] hover:bg-[#F1F3F4] dark:hover:bg-[#1A1D24]'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-[6px] transition-colors ${viewMode === 'list' ? 'bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#1A233A] dark:text-[#3E6AE1]' : 'text-[#5F6368] dark:text-[#9AA0A6] hover:bg-[#F1F3F4] dark:hover:bg-[#1A1D24]'}`}
                title="List view"
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Documents Grid / List */}
        {isLoadingDocs ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5" : "flex flex-col gap-2"}>
            {[...Array(10)].map((_, i) => (
              viewMode === 'grid' ? (
                <div key={i} className="aspect-[3/4] rounded-[8px] bg-[#EEEEEE] dark:bg-[#1A1D24] animate-pulse border border-[#DADCE0] dark:border-[#393C41]"></div>
              ) : (
                <div key={i} className="h-16 rounded-[8px] bg-[#EEEEEE] dark:bg-[#1A1D24] animate-pulse border border-[#DADCE0] dark:border-[#393C41]"></div>
              )
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] mt-8 bg-white dark:bg-[#171A20] rounded-[8px] border border-[#DADCE0] dark:border-[#393C41] p-12 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0FE] dark:bg-[#1A233A] text-[#1A73E8] dark:text-[#3E6AE1] mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-[#202124] dark:text-[#E8EAED]">No documents found</h3>
            <p className="text-[#5F6368] dark:text-[#9AA0A6] max-w-sm text-[15px]">
              {searchQuery ? "Try adjusting your search or filters to find what you're looking for." : "Get started by creating a new blank document."}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5" : "flex flex-col bg-white dark:bg-[#171A20] rounded-[8px] border border-[#DADCE0] dark:border-[#393C41] shadow-sm overflow-hidden"}>
            
            {viewMode === 'list' && (
              <div className="flex items-center px-6 py-3 border-b border-[#DADCE0] dark:border-[#393C41] bg-[#F8F9FA] dark:bg-[#15181C]">
                <div className="w-10"></div>
                <div className="flex-1 font-medium text-xs text-[#5F6368] dark:text-[#9AA0A6] uppercase tracking-wider">Name</div>
                <div className="w-48 font-medium text-xs text-[#5F6368] dark:text-[#9AA0A6] uppercase tracking-wider hidden md:block">Owner</div>
                <div className="w-48 font-medium text-xs text-[#5F6368] dark:text-[#9AA0A6] uppercase tracking-wider">Last opened</div>
                <div className="w-20"></div>
              </div>
            )}

            {filteredDocs.map((doc) => (
              <Link key={doc.id} href={`/editor/${doc.id}`} className="group block">
                {viewMode === 'grid' ? (
                  <div className="flex aspect-[3/4] flex-col overflow-hidden rounded-[8px] bg-white dark:bg-[#171A20] border border-[#DADCE0] dark:border-[#393C41] transition-all hover:border-[#1A73E8] dark:hover:border-[#3E6AE1] shadow-sm hover:shadow-md">
                    <div className="flex-1 bg-white dark:bg-[#15181C] flex flex-col relative overflow-hidden border-b border-[#DADCE0] dark:border-[#393C41]">
                       {typeof doc.content === 'string' && doc.content.trim().length > 0 && !doc.content.startsWith('{') ? (
                         <div className="relative w-full h-full overflow-hidden">
                           <div 
                             className="absolute top-0 left-0 w-[400%] h-[400%] p-12 origin-top-left scale-[0.25] pointer-events-none opacity-90 prose prose-zinc dark:prose-invert prose-sm"
                             dangerouslySetInnerHTML={{ __html: doc.content }}
                           />
                         </div>
                       ) : (
                         <div className="absolute top-4 left-4 right-4 space-y-2 opacity-[0.35] dark:opacity-20">
                           <div className="h-2 w-3/4 bg-[#5F6368] dark:bg-[#E8EAED] rounded-full"></div>
                           <div className="h-2 w-full bg-[#5F6368] dark:bg-[#E8EAED] rounded-full"></div>
                           <div className="h-2 w-5/6 bg-[#5F6368] dark:bg-[#E8EAED] rounded-full"></div>
                           <div className="h-2 w-full bg-[#5F6368] dark:bg-[#E8EAED] rounded-full mt-4"></div>
                           <div className="h-2 w-2/3 bg-[#5F6368] dark:bg-[#E8EAED] rounded-full"></div>
                           <div className="h-2 w-full bg-[#5F6368] dark:bg-[#E8EAED] rounded-full"></div>
                         </div>
                       )}
                       {/* Subtle fade gradient at the bottom for realism */}
                       <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white dark:from-[#15181C] to-transparent"></div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-[#1A73E8] dark:text-[#3E6AE1]" strokeWidth={1.5} />
                        </div>
                        <div className="truncate w-full pr-1">
                          <h3 className="font-medium text-[14px] text-[#202124] dark:text-[#E8EAED] truncate group-hover:text-[#1A73E8] dark:group-hover:text-[#3E6AE1] transition-colors">{doc.title}</h3>
                          <div className="w-full flex items-center justify-between mt-2 relative">
                            <div className="flex items-center gap-1.5 text-[12px] text-[#5F6368] dark:text-[#9AA0A6] flex-1 truncate pr-16">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{getShortRelativeTime(new Date(doc.updatedAt))}</span>
                            </div>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 bg-white dark:bg-[#171A20] pl-2">
                              <button onClick={(e) => downloadDocument(e, doc)} className="p-1.5 rounded text-[#5F6368] dark:text-[#9AA0A6] hover:bg-[#F1F3F4] dark:hover:bg-[#2C2E33] hover:text-[#171A20] dark:hover:text-white transition-colors" title="Download text">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => deleteDocument(e, doc)} className="p-1.5 rounded text-[#5F6368] dark:text-[#9AA0A6] hover:bg-[#FCE8E6] dark:hover:bg-[#3C1618] hover:text-[#D93025] transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center px-6 py-3 border-b border-[#DADCE0] dark:border-[#393C41] hover:bg-[#F8F9FA] dark:hover:bg-[#1A1D24] transition-colors last:border-0">
                    <div className="w-10 flex-shrink-0">
                      <FileText className="h-5 w-5 text-[#1A73E8] dark:text-[#3E6AE1]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 font-medium text-[14px] text-[#202124] dark:text-[#E8EAED] group-hover:text-[#1A73E8] dark:group-hover:text-[#3E6AE1] transition-colors truncate pr-4">
                      {doc.title}
                    </div>
                    <div className="w-48 text-[14px] text-[#5F6368] dark:text-[#9AA0A6] hidden md:flex items-center gap-2">
                      {doc.ownerId === user?.id ? 'me' : 'someone else'}
                    </div>
                    <div className="w-48 text-[14px] text-[#5F6368] dark:text-[#9AA0A6]">
                      {format(new Date(doc.updatedAt), 'MMM d, yyyy')}
                    </div>
                    <div className="w-20 flex justify-end gap-1">
                      <button 
                        onClick={(e) => downloadDocument(e, doc)} 
                        className="p-2 rounded-full hover:bg-[#E8EAED] dark:hover:bg-[#393C41] text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#171A20] dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        title="Download text"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => deleteDocument(e, doc)} 
                        className="p-2 rounded-full hover:bg-[#FCE8E6] dark:hover:bg-[#3C1618] text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#D93025] opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
