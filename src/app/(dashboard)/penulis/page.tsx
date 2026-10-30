// src/app/(dashboard)/penulis/page.tsx
import Link from 'next/link';
import { UploadCloud, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PenulisDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dasbor Penulis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status peninjauan naskah ilmiah Anda secara transparan dan terisolasi.
          </p>
        </div>

        <Link
          href="/penulis/kirim"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 transition-colors shadow-xs"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Kirim Naskah Baru</span>
        </Link>
      </div>

      {/* Empty State / Initial Overview */}
      <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Belum Ada Naskah yang Dikirimkan
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Mulai proses submisi naskah Anda dengan mengunggah Title Page dan Naskah Anonim melalui alur Dual-Upload.
        </p>
        <div className="mt-6">
          <Link
            href="/penulis/kirim"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <span>Mulai Submisi Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
