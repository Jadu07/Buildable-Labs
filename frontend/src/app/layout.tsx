import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { BackendStatusProvider } from '../contexts/BackendStatusContext';
import { MinimalBackendStatus } from '../components/ui/MinimalBackendStatus';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Collaborative Editor',
  description: 'A real-time collaborative document editor',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`group ${inter.className} antialiased bg-[#F9FBFD] text-gray-900 dark:bg-[#111111] dark:text-gray-100 min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <BackendStatusProvider>
            <AuthProvider>
              {children}
              <Toaster position="bottom-right" />
              {/* This is a fallback bottom-left indicator for non-auth pages. Auth pages have their own explicitly positioned one. */}
              <MinimalBackendStatus className="fixed bottom-6 left-6 z-50 pointer-events-auto hidden md:block group-has-[#auth-page]:hidden bg-white/80 dark:bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-black/5 dark:border-white/5" />
            </AuthProvider>
          </BackendStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
