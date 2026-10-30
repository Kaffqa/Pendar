// src/app/(dashboard)/layout.tsx
import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Suspense fallback={<div className="w-64 bg-slate-900 min-h-screen shrink-0" />}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col min-w-0">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Header />
        </Suspense>
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat halaman...</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
