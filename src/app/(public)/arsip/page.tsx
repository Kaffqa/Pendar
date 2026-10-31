// src/app/(public)/arsip/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Search,
  Download,
  Calendar,
  GraduationCap,
  ShieldCheck,
  Tag,
  ArrowRight,
  Filter,
} from 'lucide-react';
import type { Submission, UserProfile } from '@/types';

export default function ArsipPublikPage() {
  const supabase = createClient();
  const [articles, setArticles] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [volumeFilter, setVolumeFilter] = useState<'all' | number>('all');

  useEffect(() => {
    async function loadPublished() {
      setIsLoading(true);
      try {
        // Ambil semua submisi berstatus published
        const { data: subsData, error: subsError } = await supabase
          .from('submissions')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (subsError) throw subsError;

        const rawList = (subsData as Submission[]) || [];

        if (rawList.length > 0) {
          const authorIds = [...new Set(rawList.map((s) => s.author_id))];
          const { data: profiles } = await supabase
            .from('users_profile')
            .select('id, full_name, affiliation')
            .in('id', authorIds);

          const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

          const combined = rawList.map((s) => ({
            ...s,
            author: profileMap.get(s.author_id) as Pick<UserProfile, 'full_name' | 'affiliation'> || undefined,
          }));

          setArticles(combined);
        } else {
          setArticles([]);
        }
      } catch (err) {
        console.error('Gagal memuat arsip artikel:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPublished();
  }, [supabase]);

  // Ekstrak daftar volume unik
  const availableVolumes = [...new Set(articles.map((a) => a.volume).filter(Boolean))] as number[];

  const filteredArticles = articles.filter((art) => {
    const titleMatch = art.title.toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = art.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const keywordMatch = art.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) || false;

    if (!titleMatch && !authorMatch && !keywordMatch) return false;
    if (volumeFilter !== 'all' && art.volume !== volumeFilter) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header Halaman Arsip */}
      <div className="border-b border-slate-200 pb-8 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Akses Terbuka Bebas Hambatan (Open Access Repository)</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Arsip Publikasi & Terbitan Ilmiah
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Seluruh artikel riset yang terbit telah melalui peninjauan independen sejawat (Double-Blind Peer Review) dan dapat diunduh serta disitasi secara cuma-cuma untuk kemajuan riset sains dan teknologi.
        </p>

        {/* Baris Kontrol: Pencarian & Filter Volume */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul, nama penulis, atau kata kunci riset..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {availableVolumes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Volume:</span>
              <button
                type="button"
                onClick={() => setVolumeFilter('all')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  volumeFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Semua
              </button>
              {availableVolumes.map((vol) => (
                <button
                  key={vol}
                  type="button"
                  onClick={() => setVolumeFilter(vol)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    volumeFilter === vol
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Vol. {vol}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Konten Daftar Artikel */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-16 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-2">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {searchQuery
              ? 'Tidak Ditemukan Artikel yang Cocok'
              : 'Belum Ada Artikel yang Resmi Terbit'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {searchQuery
              ? 'Coba ganti kata kunci pencarian Anda dengan istilah ilmiah lain.'
              : 'Naskah yang telah disetujui dan diterbitkan oleh Dewan Editor akan langsung muncul di katalog arsip ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredArticles.map((art) => {
            const pubYear = art.published_at
              ? new Date(art.published_at).getFullYear()
              : new Date().getFullYear();

            return (
              <article
                key={art.id}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-all shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-800">
                    Vol. {art.volume || 1}, No. {art.issue || 1} ({pubYear})
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Open Access</span>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    DOI: 10.5892/pendar.v{art.volume || 1}i{art.issue || 1}.{art.id.slice(0, 4)}
                  </span>
                </div>

                <h2 className="text-lg md:text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug">
                  <Link href={`/arsip/${art.id}`}>{art.title}</Link>
                </h2>

                <div className="text-xs text-slate-700 flex flex-wrap items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold">{art.author?.full_name || 'Penulis Penelitian'}</span>
                  {art.author?.affiliation && (
                    <span className="text-slate-500 italic">({art.author.affiliation})</span>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed text-justify">
                  {art.abstract}
                </p>

                {art.keywords && art.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {art.keywords.map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/arsip/${art.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <span>Baca Abstrak & Sitasi Lengkap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/arsip/${art.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Akses Naskah PDF</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
