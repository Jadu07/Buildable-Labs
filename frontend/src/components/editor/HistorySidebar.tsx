'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronRight, RotateCcw, X, Loader2, History, GitCommit } from 'lucide-react';
import api from '../../services/api.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { EditorPreview } from './EditorPreview';

interface HistoryItem {
  id: string;
  version: number;
  content: any;
  createdAt: string;
}

interface HistorySidebarProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (content: any) => void;
}

export function HistorySidebar({ documentId, isOpen, onClose, onRestore }: HistorySidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, documentId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${documentId}/history`);
      setHistory(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedVersion(res.data.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;
    try {
      setIsRestoring(true);
      // First update the document content
      await api.put(`/documents/${documentId}`, { content: selectedVersion.content });
      
      // Then trigger local update
      onRestore(selectedVersion.content);
      toast.success('Document restored successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to restore document');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      setIsSaving(true);
      const currentDoc = await api.get(`/documents/${documentId}`);
      const nextVersion = history.length > 0 ? history[0].version + 1 : 1;
      
      await api.post(`/documents/${documentId}/history`, {
        content: currentDoc.data.data.content,
        version: nextVersion
      });
      
      toast.success('Version saved');
      await fetchHistory();
    } catch (error) {
      toast.error('Failed to save version');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Document Preview Area */}
      {selectedVersion && (
        <div className="fixed inset-y-0 left-0 right-[400px] z-40 flex items-center justify-center p-8 pointer-events-none">
          <div className="w-full h-full max-w-[816px] pointer-events-auto rounded-[8px] overflow-hidden shadow-2xl flex flex-col bg-[#F4F4F4] dark:bg-[#000000]">
            <EditorPreview content={selectedVersion.content} />
          </div>
        </div>
      )}

      <div className="fixed top-0 right-0 h-full w-[400px] bg-white dark:bg-[#1C1F26] shadow-2xl z-50 flex flex-col border-l border-[#EEEEEE] dark:border-[#393C41] transform transition-transform">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE] dark:border-[#393C41]">
          <div className="flex items-center gap-2 text-[#171A20] dark:text-white">
            <History className="w-5 h-5 text-[#3E6AE1]" />
            <h2 className="font-semibold">Version History</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F4F4F4] dark:hover:bg-[#2C2E33] rounded-full text-[#5C5E62] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-[#EEEEEE] dark:border-[#393C41]">
          <button
            onClick={handleCreateVersion}
            disabled={isSaving}
            className="w-full py-2.5 bg-white dark:bg-[#1C1F26] border border-[#EEEEEE] dark:border-[#4A4E56] hover:bg-[#F4F4F4] dark:hover:bg-[#2C2E33] disabled:opacity-50 disabled:cursor-not-allowed text-[#171A20] dark:text-white rounded-[6px] font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#5C5E62] dark:text-[#A0A0A0]" /> : null}
            Save current version
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#3E6AE1]" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-[#5C5E62] dark:text-[#A0A0A0]">
              <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No versions saved yet</p>
            </div>
          ) : (
            <div className="relative pt-2 pb-6 px-4">
              {/* Vertical timeline line */}
              <div className="absolute left-8 top-6 bottom-0 w-px bg-[#EEEEEE] dark:bg-[#393C41]"></div>
              
              {history.map((item, index) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedVersion(item)}
                  className={`relative pl-12 pr-4 py-3 mb-2 cursor-pointer rounded-[8px] transition-colors ${
                    selectedVersion?.id === item.id 
                      ? 'bg-[#F4F8FF] dark:bg-[#2A344A]' 
                      : 'hover:bg-[#FAFAFA] dark:hover:bg-[#2C2E33]'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-3.5 top-5 w-3 h-3 rounded-full border-2 bg-white dark:bg-[#1C1F26] z-10 ${selectedVersion?.id === item.id ? 'border-[#3E6AE1]' : 'border-[#D1D1D1] dark:border-[#4A4E56]'}`}></div>

                  <div className="flex flex-col mb-1">
                    <span className="font-semibold text-[14px] text-[#171A20] dark:text-white">
                      {format(new Date(item.createdAt), 'MMMM d, h:mm a')}
                    </span>
                    <span className="text-[13px] text-[#5C5E62] dark:text-[#A0A0A0] mt-0.5 flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5" /> Version {item.version}
                    </span>
                  </div>
                  {selectedVersion?.id === item.id && (
                    <div className="mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestore(); }}
                        disabled={isRestoring}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-[#3E6AE1] hover:bg-[#3256B7] disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-[6px] font-medium text-[13px] transition-colors"
                      >
                        {isRestoring ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        Restore this version
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
