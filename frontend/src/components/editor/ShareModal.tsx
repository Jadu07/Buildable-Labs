'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Share2, Search, Link as LinkIcon, User as UserIcon, Check, Shield, Globe, Lock, Loader2, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api.service';
import toast from 'react-hot-toast';
import { Collaborator, User } from '../../types';
import { getAvatarUrl } from '../../utils/avatar';

interface ShareModalProps {
  documentId: string;
  collaborators: Collaborator[];
  isPublic: boolean;
  publicRole: string;
  isOpen: boolean;
  onClose: () => void;
  onShared: () => void;
}

const ROLES = [
  { value: 'EDITOR', label: 'Editor', desc: 'Can edit document' },
  { value: 'VIEWER', label: 'Viewer', desc: 'Can view only' },
];

function RoleDropdown({ value, onChange, allowRemove = false, align = 'right', direction = 'bottom', isLoading = false }: { value: string, onChange: (v: string) => void, allowRemove?: boolean, align?: 'left' | 'right', direction?: 'top' | 'bottom', isLoading?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentRole = ROLES.find(r => r.value === value) || ROLES[0];
  
  return (
    <div className="relative">
      <button 
        type="button"
        disabled={isLoading}
        className={`flex items-center gap-1.5 text-sm text-[#5C5E62] dark:text-[#A0A0A0] hover:bg-[#F4F4F4] dark:hover:bg-[#2C2E33] px-2 py-1.5 rounded-[4px] font-medium ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value === 'RESTRICTED' || value === 'PUBLIC' ? (value === 'RESTRICTED' ? 'Restricted' : 'Anyone with link') : currentRole.label}
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        )}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${direction === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'} w-56 bg-white dark:bg-[#2C2E33] border border-[#EEEEEE] dark:border-[#393C41] rounded-[8px] shadow-xl z-50 py-1`}>
            {value === 'RESTRICTED' || value === 'PUBLIC' ? (
              <>
                <button className="w-full text-left px-4 py-2.5 hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] flex flex-col" onClick={() => { onChange('RESTRICTED'); setIsOpen(false); }}>
                  <span className="text-sm font-medium text-[#171A20] dark:text-white">Restricted</span>
                  <span className="text-[11px] text-[#5C5E62] dark:text-[#A0A0A0]">Only people with access can open</span>
                </button>
                <button className="w-full text-left px-4 py-2.5 hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] flex flex-col" onClick={() => { onChange('PUBLIC'); setIsOpen(false); }}>
                  <span className="text-sm font-medium text-[#171A20] dark:text-white">Anyone with the link</span>
                  <span className="text-[11px] text-[#5C5E62] dark:text-[#A0A0A0]">Anyone on the internet can open</span>
                </button>
              </>
            ) : (
              <>
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] flex flex-col"
                    onClick={() => { onChange(r.value); setIsOpen(false); }}
                  >
                    <span className="text-sm font-medium text-[#171A20] dark:text-white flex items-center gap-2">
                      {r.label} {value === r.value && <Check className="w-3 h-3" />}
                    </span>
                    <span className="text-[11px] text-[#5C5E62] dark:text-[#A0A0A0]">{r.desc}</span>
                  </button>
                ))}
                {allowRemove && (
                  <>
                    <div className="h-px bg-[#EEEEEE] dark:bg-[#393C41] my-1"></div>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] text-sm font-medium text-red-600 dark:text-red-400"
                      onClick={() => { onChange('REMOVE'); setIsOpen(false); }}
                    >
                      Remove access
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ShareModal({ documentId, collaborators, isPublic, publicRole, isOpen, onClose, onShared }: ShareModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [isLoading, setIsLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isUpdatingGeneralAccess, setIsUpdatingGeneralAccess] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  
  // Ref for debounce timer
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!selectedUser) return;
    try {
      setIsLoading(true);
      await api.post(`/documents/${documentId}/share`, { email: selectedUser.email, role: inviteRole });
      toast.success(`Shared with ${selectedUser.name || selectedUser.email}`);
      setSelectedUser(null);
      setSearchQuery('');
      onShared();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to share document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      await api.put(`/documents/${documentId}/collaborators`, { userId, role: newRole });
      toast.success('Access updated');
      onShared();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update access');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveAccess = async (userId: string) => {
    try {
      setUpdatingUserId(userId);
      await api.delete(`/documents/${documentId}/collaborators/${userId}`);
      toast.success('Access removed');
      onShared();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove access');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUpdatePublicAccess = async (newIsPublic: boolean, newPublicRole: string) => {
    try {
      setIsUpdatingGeneralAccess(true);
      await api.put(`/documents/${documentId}`, { isPublic: newIsPublic, publicRole: newPublicRole });
      toast.success('General access updated');
      onShared();
    } catch (error: any) {
      toast.error('Failed to update general access');
    } finally {
      setIsUpdatingGeneralAccess(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-[520px] rounded-[16px] bg-white shadow-2xl dark:bg-[#1A1D24] overflow-hidden flex flex-col border border-[#E5E5E5] dark:border-[#393C41]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEEEEE] dark:border-[#393C41]">
          <h2 className="text-xl font-medium text-[#171A20] dark:text-white">Share document</h2>
        </div>

        {/* Search & Invite Box */}
        <div className="p-6 pb-2">
          {!selectedUser ? (
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-[#5C5E62] dark:text-[#A0A0A0]" />
                <input
                  type="text"
                  placeholder="Add people and groups"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white dark:bg-[#171A20] border border-[#CCCCCC] dark:border-[#393C41] rounded-[8px] text-[15px] text-[#171A20] dark:text-white focus:outline-none focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#3E6AE1] transition-all placeholder:text-[#5C5E62] dark:placeholder:text-[#808080]"
                />
              </div>
              
              {/* Dropdown Results */}
              {(searchQuery.length >= 2 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2C2E33] border border-[#EEEEEE] dark:border-[#393C41] rounded-[8px] shadow-lg max-h-60 overflow-y-auto z-20">
                  {isSearching ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-sm text-[#5C5E62]">
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(user => (
                      <div 
                        key={user.id} 
                        className="flex items-center gap-3 p-3 hover:bg-[#F4F4F4] dark:hover:bg-[#393C41] cursor-pointer"
                        onClick={() => { setSelectedUser(user); setSearchQuery(''); }}
                      >
                        <img 
                          src={(user as any).avatarUrl || getAvatarUrl(user.name || '', user.email)}
                          className="w-8 h-8 rounded-full border border-black/5 bg-white object-cover"
                          alt={user.name || user.email}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#171A20] dark:text-white">{user.name || user.email.split('@')[0]}</span>
                          <span className="text-xs text-[#5C5E62] dark:text-[#A0A0A0]">{user.email}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-[#5C5E62]">No users found</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#F4F4F4] dark:bg-[#2C2E33] p-2 pr-4 rounded-[8px] border border-[#E5E5E5] dark:border-[#393C41]">
              <div className="flex items-center gap-3">
                <button className="p-2 text-[#5C5E62] hover:bg-black/5 rounded-full" onClick={() => setSelectedUser(null)}>
                  <X className="w-4 h-4" />
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#171A20] dark:text-white">{selectedUser.name || selectedUser.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RoleDropdown 
                  value={inviteRole}
                  onChange={(v) => setInviteRole(v)}
                />
                <Button onClick={handleShare} isLoading={isLoading} disabled={isLoading} className="h-8 px-4 text-sm rounded-[6px]">
                  Send
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* People with access list */}
        <div className="px-6 py-4 flex-1 overflow-y-auto max-h-[300px]">
          <h3 className="text-sm font-medium text-[#171A20] dark:text-white mb-4">People with access</h3>
          <div className="space-y-4 pb-24">
            {collaborators.map(collab => (
              <div key={collab.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <img 
                    src={(collab.user as any).avatarUrl || getAvatarUrl(collab.user.name || '', collab.user.email)}
                    className="w-9 h-9 rounded-full border border-black/5 bg-white object-cover"
                    alt={collab.user.name || collab.user.email}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#171A20] dark:text-white flex items-center gap-2">
                      {collab.user.name || collab.user.email}
                      {collab.role === 'OWNER' && <span className="text-[11px] text-[#5C5E62] bg-[#F4F4F4] dark:bg-[#393C41] px-1.5 py-0.5 rounded-sm">Owner</span>}
                    </span>
                    <span className="text-[13px] text-[#5C5E62] dark:text-[#A0A0A0]">{collab.user.email}</span>
                  </div>
                </div>
                
                {collab.role !== 'OWNER' ? (
                  <RoleDropdown 
                    value={collab.role}
                    allowRemove={true}
                    isLoading={updatingUserId === collab.user.id}
                    onChange={(val) => {
                      if (val === 'REMOVE') {
                        handleRemoveAccess(collab.user.id);
                      } else {
                        handleUpdateRole(collab.user.id, val);
                      }
                    }}
                  />
                ) : (
                  <span className="text-sm text-[#5C5E62] dark:text-[#808080] pr-3">Owner</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General Access */}
        <div className="px-6 py-4 bg-[#FAFAFA] dark:bg-[#121418] border-t border-[#EEEEEE] dark:border-[#393C41]">
          <h3 className="text-sm font-medium text-[#171A20] dark:text-white mb-3">General access</h3>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isPublic ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500' : 'bg-gray-200 dark:bg-[#393C41] text-[#5C5E62] dark:text-[#A0A0A0]'}`}>
              {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="flex flex-col flex-1">
              <div className="-ml-2">
                <RoleDropdown 
                  value={isPublic ? 'PUBLIC' : 'RESTRICTED'}
                  align="left"
                  direction="top"
                  isLoading={isUpdatingGeneralAccess}
                  onChange={(val) => handleUpdatePublicAccess(val === 'PUBLIC', publicRole)}
                />
              </div>
              <span className="text-[12px] text-[#5C5E62] dark:text-[#A0A0A0] mt-0.5">
                {isPublic ? (publicRole === 'VIEWER' ? 'Anyone on the internet with the link can view' : 'Anyone on the internet with the link can edit') : 'Only people with access can open with the link'}
              </span>
            </div>
            
            {isPublic && (
              <div className="ml-auto">
                <RoleDropdown 
                  value={publicRole}
                  direction="top"
                  isLoading={isUpdatingGeneralAccess}
                  onChange={(val) => handleUpdatePublicAccess(true, val)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-[#EEEEEE] dark:border-[#393C41]">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-3 py-2 rounded-[20px] border border-[#CCCCCC] dark:border-[#5C5E62] text-sm font-medium text-[#1A73E8] dark:text-[#8AB4F8] hover:bg-[#F4F8FE] dark:hover:bg-[#1A73E8]/10 transition-colors"
          >
            {linkCopied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            {linkCopied ? 'Link copied' : 'Copy link'}
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-[20px] bg-[#0B57D0] dark:bg-[#8AB4F8] text-sm font-medium text-white dark:text-[#171A20] hover:bg-[#0842A0] dark:hover:bg-[#9EBEFA] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
