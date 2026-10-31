// src/app/(public)/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  BookOpen,
  ShieldCheck,
  Cpu,
  ArrowRight,
  ExternalLink,
  Download,
  GraduationCap,
} from 'lucide-react';
import type { JournalSettings, Submission, UserProfile } from '@/types';

export default async function HomePage() {
  const supabase = await createClient();

  // 1. Ambil setelan jurnal
  const { data: settingsData } = await supabase
    .from('journal_settings')
    .select('*')
    .limit(1)
    .single();

  const settings = (settingsData as JournalSettings) || {
    journal_name: 'Pendar: Jurnal Rekayasa dan Sains Komputasi',
    journal_issn: '2988-1234',
    journal_eissn: '2988-5678',
    journal_description:
      'Platform publikasi ilmiah akses terbuka (Open Access) yang dirancang untuk menjaga integritas akademik mutlak melalui sistem otomatisasi Double-Blind Peer Review dan orkestrasi redaksi pintar.',
  };

  // 2. Ambil terbitan artikel terbaru (published)
  const { data: latestArticlesData } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(4);

  const rawArticles = (latestArticlesData as Submission[]) || [];
  let latestArticles: Submission[] = [];

  if (rawArticles.length > 0) {
    const authorIds = [...new Set(rawArticles.map((s) => s.author_id))];
    const { data: profiles } = await supabase
      .from('users_profile')
      .select('id, full_name, affiliation')
      .in('id', authorIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    latestArticles = rawArticles.map((s) => ({
      ...s,
      author: profileMap.get(s.author_id) || undefined,
    }));
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-slate-50/50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-700 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Sistem Manajemen Jurnal Generasi Baru (JMS AI)
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              {settings.journal_name}
            </h1>

            <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">
              {settings.journal_description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/penulis/kirim"
                className="inline-flex items-center gap-2 px-5 py-3 rounded text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
              >
                <span>Kirimkan Naskah Anda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/arsip"
                className="inline-flex items-center gap-2 px-5 py-3 rounded text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <span>Jelajahi Arsip Terbitan</span>
              </Link>
            </div>

            {/* ISSN & Indexing Badges */}
            <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-500">
              {settings.journal_issn && (
                <div>
                  <span className="font-semibold text-slate-700">p-ISSN:</span> {settings.journal_issn}
                </div>
              )}
              {settings.journal_eissn && (
                <div>
                  <span className="font-semibold text-slate-700">e-ISSN:</span> {settings.journal_eissn}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Terindeks Standar Google Scholar Highwire Press</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiga Pilar Integritas */}
      <section className="py-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Standar Integritas Publikasi Tanpa Kompromi
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Menghilangkan bias evaluasi dan kebocoran identitas naskah dengan arsitektur redaksi virtual modern.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-xs">
              <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded flex items-center justify-center text-blue-700 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Pemisahan Berkas Dual-Upload
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Halaman identitas (Title Page) dan naskah utama (Main Manuscript) dipisahkan secara fisik di tingkat basis data. Peninjau tidak pernah memiliki akses ke metadata penulis.
              </p>
            </div>

            <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-xs">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded flex items-center justify-center text-indigo-700 mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Zero-Leak Gatekeeper
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Verifikasi otomatis mencegah lolosnya ucapan terima kasih beridentitas, afiliasi tersembunyi, atau catatan kaki yang berpotensi merusak anonimitas naskah.
              </p>
            </div>

            <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-xs">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-center text-emerald-700 mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Akses Terbuka & Ramah Pengindeks
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Setiap artikel yang terbit dirender secara sisi-server (SSR) dengan metadata sitasi standar Highwire Press agar terindeks sempurna oleh mesin pencari Google Scholar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terbitan Terbaru (Dinamis dari Supabase) */}
      <section className="py-16 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Terbitan Artikel Terbaru
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Artikel penelitian mutakhir yang telah melalui proses tinjauan independen sejawat.
              </p>
            </div>
            <Link
              href="/arsip"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Lihat Semua Artikel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {latestArticles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-800">
                Belum Ada Terbitan Artikel
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Edisi perdana saat ini sedang dalam proses tinjauan redaksi. Kirimkan naskah penelitian Anda sekarang untuk diterbitkan.
              </p>
              <div className="pt-2">
                <Link
                  href="/penulis/kirim"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                >
                  <span>Mulai Submisi Naskah</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {latestArticles.map((art) => {
                const pubYear = art.published_at
                  ? new Date(art.published_at).getFullYear()
                  : new Date().getFullYear();

                return (
                  <article
                    key={art.id}
                    className="p-6 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors shadow-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Artikel Riset</span>
                      <span>•</span>
                      <span>Vol. {art.volume || 1}, No. {art.issue || 1} ({pubYear})</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">Open Access</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors">
                      <Link href={`/arsip/${art.id}`}>{art.title}</Link>
                    </h3>

                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{art.author?.full_name || 'Penulis Penelitian'}</span>
                      {art.author?.affiliation && (
                        <span className="text-slate-400 italic">({art.author.affiliation})</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed text-justify">
                      {art.abstract}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">
                        DOI: 10.5892/pendar.v{art.volume || 1}i{art.issue || 1}.{art.id.slice(0, 4)}
                      </span>

                      <Link
                        href={`/arsip/${art.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <span>Baca Lengkap & Sitasi</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
