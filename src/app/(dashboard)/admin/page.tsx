// src/app/(dashboard)/admin/page.tsx
import Link from 'next/link';
import { Files, AlertTriangle, Clock, CheckCircle2, Users, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dasbor Dewan Redaksi & Editor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengawasan antrean naskah publikasi, penunjukan reviewer cadangan, dan stempel persetujuan akhir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/peninjau"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Database Reviewer</span>
          </Link>
          <Link
            href="/admin/log"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Activity className="w-4 h-4 text-slate-500" />
            <span>Audit Trail</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Naskah Masuk</span>
            <Files className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">0</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Perlu Peninjau</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">0</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Eskalasi Terhenti</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">0</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Siap Diterbitkan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">0</div>
        </div>
      </div>

      {/* Empty State Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <p className="text-xs text-slate-500">
          Belum ada naskah yang berada dalam siklus antrean redaksi aktif.
        </p>
      </div>
    </div>
  );
}
