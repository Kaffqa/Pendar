// src/app/(dashboard)/peninjau/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReviewerAssignments } from '@/hooks/use-reviewer-assignments';
import { Skeleton } from '@/components/ui/skeleton';
import { ASSIGNMENT_LABELS, type AssignmentStatus } from '@/lib/constants';
import {
  CheckSquare,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

export default function PeninjauDashboardPage() {
  const { assignments, isLoading, error, acceptAssignment, declineAssignment } = useReviewerAssignments();
  const [filter, setFilter] = useState<'all' | 'invited' | 'accepted' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Hitung jumlah statistik ringkas
  const invitedCount = assignments.filter((a) => a.status === 'invited').length;
  const acceptedCount = assignments.filter((a) => a.status === 'accepted').length;
  const completedCount = assignments.filter((a) => a.status === 'completed').length;

  const filteredAssignments = assignments.filter((a) => {
    const title = a.submission?.title || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'invited') return a.status === 'invited';
    if (filter === 'accepted') return a.status === 'accepted';
    if (filter === 'completed') return a.status === 'completed';
    return true;
  });

  const getDeadlineInfo = (dueDateStr?: string | null) => {
    if (!dueDateStr) return null;
    const now = new Date().getTime();
    const due = new Date(dueDateStr).getTime();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Lewat ${Math.abs(diffDays)} hari`,
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        isCritical: true,
      };
    }
    if (diffDays <= 3) {
      return {
        label: `Tersisa ${diffDays} hari`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        isCritical: true,
      };
    }
    if (diffDays <= 7) {
      return {
        label: `Tersisa ${diffDays} hari`,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        isCritical: false,
      };
    }
    return {
      label: `Batas waktu: ${new Date(dueDateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      })}`,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      isCritical: false,
    };
  };

  const handleAction = async (action: 'accept' | 'decline', assignmentId: string, subId: string) => {
    setProcessingId(assignmentId);
    if (action === 'accept') {
      await acceptAssignment(assignmentId, subId);
    } else {
      if (confirm('Apakah Anda yakin ingin menolak tugas peninjauan naskah ini?')) {
        await declineAssignment(assignmentId, subId);
      }
    }
    setProcessingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dasbor Peninjau Ahli
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluasi naskah ilmiah anonim secara independen sesuai prinsip Double-Blind Peer Review.
          </p>
        </div>

        <Link
          href="/peninjau/profil"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
        >
          <UserCheck className="w-4 h-4 text-slate-500" />
          <span>Kelola Kepakaran & Mode Cuti</span>
        </Link>
      </div>

      {/* Ringkasan Status Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilter('invited')}
          className={`p-4 bg-white border rounded-lg cursor-pointer transition-colors ${
            filter === 'invited' ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Undangan Menunggu Respon</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{invitedCount}</div>
        </div>

        <div
          onClick={() => setFilter('accepted')}
          className={`p-4 bg-white border rounded-lg cursor-pointer transition-colors ${
            filter === 'accepted' ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sedang Dalam Penilaian</span>
            <CheckSquare className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{acceptedCount}</div>
        </div>

        <div
          onClick={() => setFilter('completed')}
          className={`p-4 bg-white border rounded-lg cursor-pointer transition-colors ${
            filter === 'completed' ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Riwayat Selesai Dinilai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{completedCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
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
            Semua Tugas ({assignments.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('invited')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === 'invited'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Undangan Baru ({invitedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === 'accepted'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Aktif Dinilai ({acceptedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Selesai
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul naskah..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Konten Daftar Tugas */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {searchQuery || filter !== 'all'
              ? 'Tidak Ada Tugas yang Sesuai Filter'
              : 'Belum Ada Tugas Peninjauan'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery || filter !== 'all'
              ? 'Silakan ubah filter kategori atau kata kunci pencarian.'
              : 'Ketika Dewan Editor atau sistem menjodohkan naskah riset dengan topik kepakaran Anda, undangan peninjauan akan muncul di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const statusConfig = ASSIGNMENT_LABELS[assignment.status as AssignmentStatus];
            const deadline = getDeadlineInfo(assignment.due_date);
            const isProcessing = processingId === assignment.id;
            const sub = assignment.submission;

            return (
              <div
                key={assignment.id}
                className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 hover:border-slate-300 transition-colors shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${statusConfig?.color}`}
                    >
                      {statusConfig?.label}
                    </span>

                    {deadline && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border ${deadline.color}`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{deadline.label}</span>
                      </span>
                    )}

                    {assignment.reminder_count > 0 && (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Pengingat Redaksi: {assignment.reminder_count}/3
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    ID Tugas: {assignment.id.slice(0, 8)}
                  </div>
                </div>

                {/* Judul & Abstrak Naskah (Anonim) */}
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {sub?.title || 'Naskah Tanpa Judul'}
                  </h2>

                  {sub?.abstract && (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {sub.abstract}
                    </p>
                  )}

                  {sub?.keywords && sub.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {sub.keywords.map((k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bagian Tombol Aksi sesuai status penugasan */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 italic flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Naskah telah diverifikasi anonim oleh Zero-Leak Gatekeeper</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {assignment.status === 'invited' && (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleAction('decline', assignment.id, assignment.submission_id)}
                          className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Tolak Undangan
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleAction('accept', assignment.id, assignment.submission_id)}
                          className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? 'Memproses...' : 'Terima Tugas Review'}
                        </button>
                      </>
                    )}

                    {assignment.status === 'accepted' && (
                      <Link
                        href={`/peninjau/tugas/${assignment.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded text-xs font-semibold transition-colors shadow-xs"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Buka Lembar Penilaian & Rubrik</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    )}

                    {assignment.status === 'completed' && (
                      <Link
                        href={`/peninjau/tugas/${assignment.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-medium transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Lembar Rubrik yang Terkirim</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
