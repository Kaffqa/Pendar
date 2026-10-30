// src/app/(dashboard)/penulis/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubmissions } from '@/hooks/use-submissions';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UploadCloud,
  FileText,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import type { SubmissionStatus } from '@/lib/constants';

export default function PenulisDashboardPage() {
  const { submissions, isLoading, error } = useSubmissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revision' | 'published'>('all');

  const filteredSubmissions = submissions.filter((sub) => {
    // Filter pencarian
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Filter status tab
    if (statusFilter === 'all') return true;
    if (statusFilter === 'published') return sub.status === 'published';
    if (statusFilter === 'revision')
      return sub.status === 'revision_needed' || sub.status === 'identity_leaked' || sub.status === 'revision_required';
    if (statusFilter === 'active')
      return sub.status !== 'published' && sub.status !== 'rejected';

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dasbor Penulis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status evaluasi dan riwayat naskah ilmiah Anda secara transparan.
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

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Kontrol Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Dalam Proses
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('revision')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              statusFilter === 'revision'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Perlu Tindakan
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              statusFilter === 'published'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Terbit
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari naskah..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Konten / Daftar Naskah */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {searchQuery || statusFilter !== 'all'
              ? 'Tidak Ditemukan Naskah yang Sesuai'
              : 'Belum Ada Naskah yang Dikirimkan'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery || statusFilter !== 'all'
              ? 'Coba sesuaikan kata kunci pencarian atau ganti filter status.'
              : 'Mulai proses publikasi riset Anda dengan mengirimkan naskah baru melalui alur Dual-Upload.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <div className="mt-6">
              <Link
                href="/penulis/kirim"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <span>Kirim Naskah Pertama</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-200">
            {filteredSubmissions.map((sub) => {
              const formattedDate = new Date(sub.submitted_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={sub.id}
                  className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={sub.status as SubmissionStatus} />
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">Dikirim {formattedDate}</span>
                    </div>

                    <Link
                      href={`/penulis/naskah/${sub.id}`}
                      className="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 block"
                    >
                      {sub.title}
                    </Link>

                    {sub.keywords && sub.keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {sub.keywords.slice(0, 4).map((k) => (
                          <span
                            key={k}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium"
                          >
                            {k}
                          </span>
                        ))}
                        {sub.keywords.length > 4 && (
                          <span className="text-[11px] text-slate-400">
                            +{sub.keywords.length - 4} lainnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Link
                      href={`/penulis/naskah/${sub.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                    >
                      <span>Lihat Status & Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
