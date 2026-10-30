// src/app/(dashboard)/admin/peninjau/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Users,
  Search,
  CheckCircle2,
  Moon,
  Sun,
  Tag,
  Mail,
  GraduationCap,
  Shield,
  Briefcase,
} from 'lucide-react';
import type { UserProfile } from '@/types';

interface ReviewerWithWorkload extends UserProfile {
  active_tasks_count?: number;
}

export default function KelolaPeninjauPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [reviewers, setReviewers] = useState<ReviewerWithWorkload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'on_leave'>('all');

  useEffect(() => {
    async function loadReviewers() {
      if (!user) return;
      setIsLoading(true);

      try {
        // Ambil semua pengguna dengan peran reviewer
        const { data: revList, error: revErr } = await supabase
          .from('users_profile')
          .select('*')
          .eq('role', 'reviewer')
          .order('full_name', { ascending: true });

        if (revErr) throw revErr;

        // Ambil jumlah penugasan aktif (invited/accepted) untuk masing-masing reviewer
        const { data: activeAssignments } = await supabase
          .from('review_assignments')
          .select('reviewer_id')
          .in('status', ['invited', 'accepted']);

        const taskCounts: Record<string, number> = {};
        activeAssignments?.forEach((a) => {
          taskCounts[a.reviewer_id] = (taskCounts[a.reviewer_id] || 0) + 1;
        });

        const extended = (revList || []).map((r) => ({
          ...r,
          active_tasks_count: taskCounts[r.id] || 0,
        }));

        setReviewers(extended as ReviewerWithWorkload[]);
      } catch (err) {
        console.error('Gagal memuat daftar peninjau:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadReviewers();
  }, [user, supabase]);

  const filteredReviewers = reviewers.filter((r) => {
    const matchesSearch =
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.affiliation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.expertise_keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (availabilityFilter === 'available') return r.is_available === true;
    if (availabilityFilter === 'on_leave') return r.is_available === false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dasbor Editor</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Database Peninjau Ahli (Reviewer Roster)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Pantau kepakaran, beban kerja penugasan aktif, dan ketersediaan peninjau independen.
            </p>
          </div>

          <div className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
            Total Terdaftar: <strong className="text-slate-900">{reviewers.length} Reviewer</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAvailabilityFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              availabilityFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua ({reviewers.length})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter('available')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              availabilityFilter === 'available'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Siap Meninjau ({reviewers.filter((r) => r.is_available).length})
          </button>
          <button
            type="button"
            onClick={() => setAvailabilityFilter('on_leave')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              availabilityFilter === 'on_leave'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Mode Cuti ({reviewers.filter((r) => !r.is_available).length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, institusi, topik riset..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Konten Daftar Reviewer */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : filteredReviewers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Tidak Ditemukan Reviewer
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'Tidak ada reviewer yang cocok dengan kueri pencarian Anda.'
              : 'Belum ada pengguna yang mendaftar dengan peran Peninjau Ahli.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviewers.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 hover:border-slate-300 transition-colors shadow-xs"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{rev.full_name}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{rev.affiliation || 'Institusi Belum Diatur'}</span>
                  </div>
                </div>

                {rev.is_available ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Sun className="w-3 h-3 text-emerald-600" />
                    <span>Aktif</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <Moon className="w-3 h-3 text-amber-600" />
                    <span>Mode Cuti</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{rev.email}</span>
                </div>

                <div className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  <Briefcase className="w-3 h-3 text-slate-500" />
                  <span>{rev.active_tasks_count} Tugas Aktif</span>
                </div>
              </div>

              {/* Kata Kunci Kepakaran */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Bidang Kepakaran Riset:
                </div>
                {rev.expertise_keywords && rev.expertise_keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {rev.expertise_keywords.map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 rounded text-[11px] font-medium"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Belum mengisi kata kunci</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
