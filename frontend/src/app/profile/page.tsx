'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Camera, User, Mail, Shield, CheckCircle2, Lock } from 'lucide-react';
import { getAvatarUrl } from '../../utils/avatar';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size too large, please upload less than 2MB');
      // Clear the input so they can select the same file again if they resize it
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { authService } = await import('../../services/auth.service');
      const updatedUser = await authService.updateProfile({ 
        name, 
        avatarUrl: avatarPreview || undefined 
      });
      updateUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    try {
      const { authService } = await import('../../services/auth.service');
      await authService.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

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
      
      <main className="container mx-auto max-w-4xl px-6 py-12 flex-1">
        <div className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight text-[#171A20] dark:text-white mb-2">Profile Settings</h1>
          <p className="text-[#5F6368] dark:text-[#9AA0A6] text-[15px]">Manage your account details and personal preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors w-full text-left ${activeTab === 'general' ? 'bg-[#E8F0FE] dark:bg-[#1A233A] text-[#1A73E8] dark:text-[#3E6AE1]' : 'text-[#5F6368] dark:text-[#9AA0A6] hover:bg-[#F1F3F4] dark:hover:bg-[#1A1D24]'}`}
            >
              <User className="w-4 h-4" />
              General Profile
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors w-full text-left ${activeTab === 'security' ? 'bg-[#E8F0FE] dark:bg-[#1A233A] text-[#1A73E8] dark:text-[#3E6AE1]' : 'text-[#5F6368] dark:text-[#9AA0A6] hover:bg-[#F1F3F4] dark:hover:bg-[#1A1D24]'}`}
            >
              <Shield className="w-4 h-4" />
              Security & Password
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-[#1A1D24] border border-[#DADCE0] dark:border-[#393C41] rounded-[12px] shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              
              {activeTab === 'general' ? (
                <form onSubmit={handleSaveGeneral}>
                  <div className="mb-10">
                    <h2 className="text-lg font-medium text-[#171A20] dark:text-white mb-6">Avatar</h2>
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#DADCE0] dark:border-[#393C41] bg-[#F8F9FA] dark:bg-[#15181C]">
                          <img 
                            src={avatarPreview || getAvatarUrl(user.name || '', user.email)} 
                            alt={user.name || 'User avatar'} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                        >
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-medium uppercase tracking-wider">Change</span>
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept="image/png, image/jpeg, image/gif" 
                          className="hidden" 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-3 mb-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-9 text-[13px]"
                          >
                            Upload new
                          </Button>
                          {avatarPreview && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={() => setAvatarPreview(null)}
                              className="h-9 text-[13px] text-[#D93025] hover:bg-[#FCE8E6] dark:hover:bg-[#3C1618]"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className="text-[12px] text-[#5F6368] dark:text-[#9AA0A6]">
                          Recommended: Square JPG, PNG, or GIF, at least 400x400 pixels.<br/>
                          Max file size: 2MB.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-[#E8EAED] dark:bg-[#2C2E33] mb-8"></div>

                  <div className="space-y-6 max-w-md">
                    <h2 className="text-lg font-medium text-[#171A20] dark:text-white mb-2">Personal Information</h2>
                    
                    <div>
                      <label className="block text-[13px] font-medium text-[#3C4043] dark:text-[#E8EAED] mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368] dark:text-[#9AA0A6]" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full h-11 pl-10 pr-4 bg-[#F8F9FA] dark:bg-[#15181C] border border-[#DADCE0] dark:border-[#393C41] rounded-[8px] text-[14px] text-[#202124] dark:text-[#E8EAED] focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#1A73E8] dark:focus:ring-[#3E6AE1] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#3C4043] dark:text-[#E8EAED] mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368] dark:text-[#9AA0A6]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full h-11 pl-10 pr-4 bg-[#F8F9FA] dark:bg-[#15181C] border border-[#DADCE0] dark:border-[#393C41] rounded-[8px] text-[14px] text-[#202124] dark:text-[#E8EAED] focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#1A73E8] dark:focus:ring-[#3E6AE1] transition-all"
                        />
                      </div>
                      <p className="mt-1.5 text-[12px] text-[#5F6368] dark:text-[#9AA0A6] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#188038] dark:text-[#34A853]" />
                        Email verified
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 flex items-center gap-3">
                    <Button type="submit" className="h-10 px-6 text-[14px] bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#3E6AE1] dark:hover:bg-[#3256B7] rounded-[6px]" isLoading={isSaving}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaveSecurity}>
                  <div className="space-y-6 max-w-md">
                    <h2 className="text-lg font-medium text-[#171A20] dark:text-white mb-2">Change Password</h2>
                    
                    <div>
                      <label className="block text-[13px] font-medium text-[#3C4043] dark:text-[#E8EAED] mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368] dark:text-[#9AA0A6]" />
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          required
                          className="w-full h-11 pl-10 pr-4 bg-[#F8F9FA] dark:bg-[#15181C] border border-[#DADCE0] dark:border-[#393C41] rounded-[8px] text-[14px] text-[#202124] dark:text-[#E8EAED] focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#1A73E8] dark:focus:ring-[#3E6AE1] transition-all"
                        />
                      </div>
                    </div>

                    <div className="w-full h-px bg-[#E8EAED] dark:bg-[#2C2E33] my-4"></div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#3C4043] dark:text-[#E8EAED] mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368] dark:text-[#9AA0A6]" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min. 6 characters)"
                          required
                          minLength={6}
                          className="w-full h-11 pl-10 pr-4 bg-[#F8F9FA] dark:bg-[#15181C] border border-[#DADCE0] dark:border-[#393C41] rounded-[8px] text-[14px] text-[#202124] dark:text-[#E8EAED] focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#1A73E8] dark:focus:ring-[#3E6AE1] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#3C4043] dark:text-[#E8EAED] mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368] dark:text-[#9AA0A6]" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          required
                          minLength={6}
                          className="w-full h-11 pl-10 pr-4 bg-[#F8F9FA] dark:bg-[#15181C] border border-[#DADCE0] dark:border-[#393C41] rounded-[8px] text-[14px] text-[#202124] dark:text-[#E8EAED] focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#3E6AE1] focus:ring-1 focus:ring-[#1A73E8] dark:focus:ring-[#3E6AE1] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex items-center gap-3">
                    <Button type="submit" className="h-10 px-6 text-[14px] bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#3E6AE1] dark:hover:bg-[#3256B7] rounded-[6px]" isLoading={isSaving}>
                      Update Password
                    </Button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
