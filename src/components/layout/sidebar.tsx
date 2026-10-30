// src/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  BookOpen,
  FileText,
  UploadCloud,
  CheckSquare,
  UserCheck,
  Files,
  Users,
  Activity,
  Settings,
  Shield,
  GraduationCap,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { role, profile } = useAuth();

  const authorNav = [
    { name: 'Naskah Saya', href: '/penulis', icon: FileText },
    { name: 'Kirim Naskah Baru', href: '/penulis/kirim', icon: UploadCloud },
  ];

  const reviewerNav = [
    { name: 'Tugas Review', href: '/peninjau', icon: CheckSquare },
    { name: 'Profil & Keahlian', href: '/peninjau/profil', icon: UserCheck },
  ];

  const adminNav = [
    { name: 'Semua Naskah', href: '/admin', icon: Files },
    { name: 'Daftar Peninjau', href: '/admin/peninjau', icon: Users },
    { name: 'Log Aktivitas', href: '/admin/log', icon: Activity },
    { name: 'Pengaturan Jurnal', href: '/admin/pengaturan', icon: Settings },
  ];

  let currentNav = authorNav;
  let roleTitle = 'Penulis / Peneliti';
  let roleIcon = GraduationCap;

  if (role === 'reviewer') {
    currentNav = reviewerNav;
    roleTitle = 'Peninjau Ahli';
    roleIcon = UserCheck;
  } else if (role === 'admin') {
    currentNav = adminNav;
    roleTitle = 'Editor & Dewan Redaksi';
    roleIcon = Shield;
  }

  const RoleIconComp = roleIcon;

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-blue-600 text-white rounded">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <Link href="/" className="font-semibold text-lg tracking-tight text-white block">
            Pendar
          </Link>
          <span className="text-xs text-slate-400 block font-light">Sistem Redaksi Virtual</span>
        </div>
      </div>

      {/* Role Indicator Card */}
      <div className="px-4 py-3 m-3 bg-slate-800/60 rounded border border-slate-700/60">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <RoleIconComp className="w-3.5 h-3.5 text-blue-400" />
          <span>{roleTitle}</span>
        </div>
        {profile?.full_name && (
          <div className="mt-1 text-sm font-semibold text-white truncate">
            {profile.full_name}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <div className="font-mono">Pendar JMS v2.0</div>
        <div>Double-Blind Protected</div>
      </div>
    </aside>
  );
}
