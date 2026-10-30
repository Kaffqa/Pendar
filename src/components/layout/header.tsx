// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, ExternalLink, ShieldCheck } from 'lucide-react';

export function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium">Zona Terisolasi (Double-Blind)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span>Portal Publik</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="h-4 w-px bg-slate-200" />

        <div className="text-right">
          <div className="text-xs font-semibold text-slate-900 leading-tight">
            {profile?.full_name || 'Pengguna'}
          </div>
          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
            {profile?.email}
          </div>
        </div>

        <button
          onClick={signOut}
          title="Keluar dari akun"
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
