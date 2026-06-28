'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';
import { ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const res = await authService.login(data);
      login(res.token, res.user);
      toast.success('Welcome back');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-[#0D0F12]">
      {/* Left Column - Form */}
      <div className="w-full lg:w-[45%] flex flex-col relative z-10 h-screen">
        
        {/* Fixed Header Section (Logo + Underline) */}
        <div className="w-full flex justify-center px-8 sm:px-12 pt-12 lg:pt-16">
          <div className="w-full max-w-[380px] relative text-left">
            <div className="inline-block">
              <Logo imageClassName="h-10 sm:h-12" />
            </div>
            {/* Underline starting from approx center of logo to the right edge */}
            <div className="absolute -bottom-4 left-[100px] right-0 h-[3px] bg-[#2B4C7E] dark:bg-[#3E6AE1] rounded-full"></div>
          </div>
        </div>
        
        {/* Form Container (Vertically centered in remaining space) */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-12 pb-16 lg:pb-32">
          <div className="w-full max-w-[380px] relative">
            
            <div className="mb-10 text-left">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#171A20] dark:text-white mb-2">
                Welcome back
              </h1>
              <p className="text-[#5F6368] dark:text-[#9AA0A6] text-[15px]">
                Please enter your details to sign in.
              </p>
            </div>
          
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="priya@company.in"
                className="bg-[#F8F9FA] border-[#DADCE0] dark:bg-[#1A1D24] dark:border-[#393C41] h-12 rounded-[8px]"
                {...register('email', { required: 'Email is required' })}
                error={errors.email?.message as string}
              />
              
              <div className="space-y-1">
                <Input
                  id="password"
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  className="bg-[#F8F9FA] border-[#DADCE0] dark:bg-[#1A1D24] dark:border-[#393C41] h-12 rounded-[8px]"
                  {...register('password', { required: 'Password is required' })}
                  error={errors.password?.message as string}
                />
                <div className="flex justify-end">
                  <Link href="#" className="text-sm font-medium text-[#1A73E8] dark:text-[#3E6AE1] hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-[15px] font-medium bg-[#1A73E8] hover:bg-[#1557B0] dark:bg-[#3E6AE1] dark:hover:bg-[#3256B7] rounded-[8px]" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-[14px] text-[#5F6368] dark:text-[#9AA0A6]">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-[#1A73E8] dark:text-[#3E6AE1] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      </div>

      {/* Right Column - Visual */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-black border-l border-[#DADCE0] dark:border-[#2C2E33]">
        {/* Full Bleed User Provided Image */}
        <img 
          src="https://images.pexels.com/photos/9222427/pexels-photo-9222427.jpeg?_gl=1*udi42v*_ga*MTcwMTYwNzcxOS4xNzgyNjYxMDA4*_ga_8JE65Q40S6*czE3ODI2NjEwMDgkbzEkZzEkdDE3ODI2NjEwNzckajU5JGwwJGgw" 
          alt="Workspace" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Subtle Gradient Overlay just for edge blending and slight contrast */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
      </div>
    </div>
  );
}
