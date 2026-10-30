// src/app/(dashboard)/peninjau/page.tsx
import Link from 'next/link';
import { CheckSquare, UserCheck, Shield } from 'lucide-react';

export default function PeninjauDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dasbor Peninjau Ahli
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar naskah riset yang memerlukan penilaian kepakaran Anda secara anonim.
          </p>
        </div>

        <Link
          href="/peninjau/profil"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
        >
          <UserCheck className="w-4 h-4 text-slate-500" />
          <span>Kelola Kepakaran & Mode Cuti</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4">
          <CheckSquare className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Tidak Ada Tugas Review yang Tertunda
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Saat redaksi atau sistem mencocokkan naskah yang relevan dengan kata kunci kepakaran Anda, undangan evaluasi akan muncul di halaman ini.
        </p>
      </div>
    </div>
  );
}
