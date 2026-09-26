'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn, isClientUser, clearTokens, getRole } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, LogOut, Building2 } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    if (!isClientUser()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Client portal header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900">AgencyDesk</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-2">
            Client Portal
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/portal"
            className={`text-sm font-medium flex items-center gap-1.5 ${
              pathname === '/portal' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            My Projects
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}