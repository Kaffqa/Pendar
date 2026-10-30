// src/app/(dashboard)/penulis/kirim/page.tsx
import Link from 'next/link';
import { SubmissionForm } from '@/components/forms/submission-form';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function KirimNaskahPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back link */}
      <div>
        <Link
          href="/penulis"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dasbor Penulis</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Kirimkan Naskah Baru
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Lengkapi formulir metadata dan unggah berkas naskah ganda sesuai protokol Double-Blind Pendar.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium">Protokol Dual-Upload Aktif</span>
          </div>
        </div>
      </div>

      {/* Formulir Submisi */}
      <SubmissionForm />
    </div>
  );
}
