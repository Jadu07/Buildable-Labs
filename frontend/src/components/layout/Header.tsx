'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../ThemeToggle';
import { getAvatarUrl } from '../../utils/avatar';
import { Logo } from '../ui/Logo';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#0D0F12] border-b border-[#E8EAED] dark:border-[#2C2E33] shadow-sm">
      <div className="container mx-auto max-w-[1400px] flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center group transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        
        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            
            <div className="h-5 w-px bg-[#DADCE0] dark:bg-[#393C41] mx-1"></div>
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1 pr-2 rounded-full hover:bg-[#F8F9FA] dark:hover:bg-[#1A1D24] border border-transparent hover:border-[#DADCE0] dark:hover:border-[#393C41] transition-all"
              >
                <img 
                  src={user.avatarUrl || getAvatarUrl(user.name, user.email)} 
                  alt={user.name || 'User avatar'} 
                  className="w-8 h-8 rounded-full border border-[#DADCE0] dark:border-[#393C41] object-cover bg-white"
                />
                <span className="hidden sm:block text-[14px] font-medium text-[#3C4043] dark:text-[#E8EAED] max-w-[120px] truncate">
                  {user.name || user.email.split('@')[0]}
                </span>
                <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[#5F6368] dark:text-[#9AA0A6]" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1A1D24] border border-[#DADCE0] dark:border-[#393C41] rounded-[8px] shadow-lg overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-[#E8EAED] dark:border-[#2C2E33]">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatarUrl || getAvatarUrl(user.name, user.email)} 
                        alt={user.name || 'User avatar'} 
                        className="w-10 h-10 rounded-full border border-[#DADCE0] dark:border-[#393C41] object-cover bg-white"
                      />
                      <div className="flex flex-col">
                        <span className="text-[14px] font-medium text-[#202124] dark:text-[#E8EAED] truncate max-w-[170px]">
                          {user.name || 'User'}
                        </span>
                        <span className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6] truncate max-w-[170px]">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-1.5">
                    <Link 
                      href="/profile" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-[14px] text-[#3C4043] dark:text-[#E8EAED] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2E33] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#5F6368] dark:text-[#9AA0A6]" />
                      Manage Profile
                    </Link>
                  </div>
                  
                  <div className="border-t border-[#E8EAED] dark:border-[#2C2E33] py-1.5">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[14px] text-[#D93025] hover:bg-[#FCE8E6] dark:hover:bg-[#3C1618] transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
