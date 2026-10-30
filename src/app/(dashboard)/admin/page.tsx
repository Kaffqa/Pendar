// src/app/(dashboard)/admin/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdminSubmissions } from '@/hooks/use-admin-submissions';
import { StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Files,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Activity,
  Settings,
  Search,
  ArrowRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import type { SubmissionStatus } from '@/lib/constants';

export default function AdminDashboardPage() {
  const { submissions, isLoading, error } = useAdminSubmissions();
  const [filter, setFilter] = useState<'all' | 'need_reviewer' | 'under_review' | 'escalated' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Hitung metrik agregat
  const totalSubmissions = submissions.length;
  const needReviewerCount = submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'waiting_for_reviewer'
  ).length;
  const underReviewCount = submissions.filter((s) => s.status === 'under_review').length;
  const escalatedCount = submissions.filter(
    (s) => s.status === 'identity_leaked' || s.status === 'revision_needed'
  ).length;
  const publishedCount = submissions.filter((s) => s.status === 'published').length;

  const filteredSubmissions = submissions.filter((s) => {
    const titleMatch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = s.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const affiliationMatch = s.author?.affiliation?.toLowerCase().includes(searchQuery.toLowerCase()) || false;

    if (!titleMatch && !authorMatch && !affiliationMatch) return false;

    if (filter === 'need_reviewer') {
      return s.status === 'submitted' || s.status === 'waiting_for_reviewer';
    }
    if (filter === 'under_review') {
      return s.status === 'under_review';
    }
    if (filter === 'escalated') {
      return s.status === 'identity_leaked' || s.status === 'revision_needed';
    }
    if (filter === 'published') {
      return s.status === 'published';
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dasbor Dewan Redaksi & Editor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengawasan alur penerbitan naskah, penugasan peninjau sejawat, dan stempel persetujuan akhir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/peninjau"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Database Reviewer</span>
          </Link>
          <Link
            href="/admin/log"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Activity className="w-4 h-4 text-slate-500" />
            <span>Audit Trail</span>
          </Link>
          <Link
            href="/admin/pengaturan"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Setelan Jurnal</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          onClick={() => setFilter('all')}
          className={`p-4 bg-white border rounded-lg cursor-pointer transition-colors ${
            filter === 'all' ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Naskah</span>
            <Files className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalSubmissions}</div>
        </div>

        <div
          onClick={() => setFilter('need_reviewer')}
          className={`p-4 bg-white border rounded-lg cursor-pointer transition-colors ${
            filter === 'need_reviewer' ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Perlu Reviewer</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{needReviewerCount}</div>
        </div>

        <div
          onClick={() => setFilter('under_review')}
          className={`p-4 bg-white border rounded-lg cursor-pointer transition-colors ${
            filter === 'under_review' ? 'border-purple-600 ring-1 ring-purple-600' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Dalam Review</span>
            <UserCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{underReviewCount}</div>
        </div>

        <div
          onClick={() => setFilter('escalated')}
          className={`p-4 bg-white border rounded-lg cursor-pointer transition-colors ${
            filter === 'escalated' ? 'border-rose-600 ring-1 ring-rose-600' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Perlu Tindakan</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{escalatedCount}</div>
        </div>

        <div
          onClick={() => setFilter('published')}
          className={`p-4 bg-white border rounded-lg cursor-pointer transition-colors ${
            filter === 'published' ? 'border-emerald-600 ring-1 ring-emerald-600' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Resmi Terbit</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{publishedCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('need_reviewer')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === 'need_reviewer'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Perlu Reviewer ({needReviewerCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('under_review')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === 'under_review'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Dalam Review ({underReviewCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('escalated')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === 'escalated'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Perlu Tindakan ({escalatedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('published')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === 'published'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Terbit ({publishedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, nama penulis, afiliasi..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Tabel Submisi */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4">
            <Files className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Tidak Ditemukan Naskah yang Sesuai
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Tidak ada naskah yang cocok dengan filter atau kata kunci pencarian Anda saat ini.
          </p>
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

              const isEscalated =
                sub.status === 'identity_leaked' || sub.status === 'revision_needed';

              return (
                <div
                  key={sub.id}
                  className={`p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isEscalated ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={sub.status as SubmissionStatus} />
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">Masuk {formattedDate}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-mono text-slate-400">ID: {sub.id.slice(0, 8)}</span>
                    </div>

                    <Link
                      href={`/admin/naskah/${sub.id}`}
                      className="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 block"
                    >
                      {sub.title}
                    </Link>

                    {/* Metadata Penulis (Hanya terlihat oleh Dewan Editor) */}
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                      <span className="font-medium text-slate-800">
                        Penulis: {sub.author?.full_name || 'Tidak diketahui'}
                      </span>
                      {sub.author?.affiliation && (
                        <span className="text-slate-500">({sub.author.affiliation})</span>
                      )}
                      {sub.author?.email && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          {sub.author.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Link
                      href={`/admin/naskah/${sub.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors shadow-xs"
                    >
                      <span>Kelola & Tinjau</span>
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
