// src/app/(public)/arsip/[id]/page.tsx
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CitationCopy } from '@/components/shared/citation-copy';
import {
  ArrowLeft,
  Download,
  BookOpen,
  Calendar,
  GraduationCap,
  ShieldCheck,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { STORAGE_BUCKETS } from '@/lib/constants';
import type { Submission, UserProfile, JournalSettings } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 1. Injeksi Meta-tag Google Scholar (Highwire Press Standard)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const articleId = resolvedParams.id;
  const supabase = await createClient();

  // Ambil naskah berstatus published
  const { data: subData } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', articleId)
    .eq('status', 'published')
    .single();

  if (!subData) {
    return { title: 'Artikel Tidak Ditemukan | Pendar' };
  }

  // Ambil profil penulis
  const { data: authorData } = await supabase
    .from('users_profile')
    .select('full_name, affiliation')
    .eq('id', subData.author_id)
    .single();

  // Ambil setelan jurnal
  const { data: settingsData } = await supabase
    .from('journal_settings')
    .select('*')
    .limit(1)
    .single();

  const settings = (settingsData as JournalSettings) || {
    journal_name: 'Pendar: Jurnal Ilmiah',
    journal_issn: '2988-1234',
  };

  const publishYear = subData.published_at
    ? new Date(subData.published_at).getFullYear()
    : new Date().getFullYear();

  const publishDateFormatted = subData.published_at
    ? new Date(subData.published_at).toISOString().split('T')[0].replace(/-/g, '/')
    : `${publishYear}/01/01`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const pdfDownloadUrl = `${siteUrl}/api/download/${subData.id}`;

  return {
    title: `${subData.title} | ${settings.journal_name}`,
    description: subData.abstract?.slice(0, 200),
    authors: [{ name: authorData?.full_name || 'Peneliti' }],
    other: {
      // Standar Google Scholar Tags
      citation_title: subData.title,
      citation_author: authorData?.full_name || 'Peneliti',
      citation_author_institution: authorData?.affiliation || '',
      citation_publication_date: publishDateFormatted,
      citation_journal_title: settings.journal_name,
      citation_volume: String(subData.volume || 1),
      citation_issue: String(subData.issue || 1),
      citation_pdf_url: pdfDownloadUrl,
      citation_issn: settings.journal_issn || '',
    },
  };
}

export default async function DetailArtikelPublikPage({ params }: PageProps) {
  const resolvedParams = await params;
  const articleId = resolvedParams.id;
  const supabase = await createClient();

  // Ambil artikel
  const { data: subData, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', articleId)
    .eq('status', 'published')
    .single();

  if (error || !subData) {
    notFound();
  }

  // Ambil penulis
  const { data: authorData } = await supabase
    .from('users_profile')
    .select('full_name, email, affiliation, orcid_id')
    .eq('id', subData.author_id)
    .single();

  // Ambil setelan jurnal
  const { data: settingsData } = await supabase
    .from('journal_settings')
    .select('*')
    .limit(1)
    .single();

  const settings = (settingsData as JournalSettings) || {
    journal_name: 'Pendar: Jurnal Rekayasa dan Sains Komputasi',
    journal_issn: '2988-1234',
    journal_eissn: '2988-5678',
  };

  const publishDate = subData.published_at
    ? new Date(subData.published_at)
    : new Date();

  const publishYear = publishDate.getFullYear();
  const formattedPublishDate = publishDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Buat URL unduh file PDF publik
  let pdfUrl = '#';
  if (subData.final_pdf_url) {
    const { data: urlData } = await supabase.storage
      .from(STORAGE_BUCKETS.MANUSCRIPTS)
      .createSignedUrl(subData.final_pdf_url, 3600);
    pdfUrl = urlData?.signedUrl || '#';
  }

  // Schema.org ScholarlyArticle JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: subData.title,
    author: [
      {
        '@type': 'Person',
        name: authorData?.full_name || 'Penulis',
        affiliation: authorData?.affiliation ? { '@type': 'Organization', name: authorData.affiliation } : undefined,
      },
    ],
    datePublished: publishDate.toISOString(),
    description: subData.abstract,
    isPartOf: {
      '@type': 'Periodical',
      name: settings.journal_name,
      issn: settings.journal_eissn || settings.journal_issn,
    },
    volumeNumber: String(subData.volume || 1),
    issueNumber: String(subData.issue || 1),
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back Link & Breadcrumb */}
        <div>
          <Link
            href="/arsip"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Katalog Arsip Terbitan</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 border-b border-slate-200 pb-3">
            <span className="font-semibold text-slate-800">{settings.journal_name}</span>
            <span>•</span>
            <span>Vol. {subData.volume || 1}, No. {subData.issue || 1} ({publishYear})</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Open Access (Peer-Reviewed)</span>
            </span>
          </div>
        </div>

        {/* Judul Artikel */}
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
          {subData.title}
        </h1>

        {/* Informasi Penulis & Afiliasi */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>{authorData?.full_name || 'Penulis Penelitian'}</span>
            </div>

            {authorData?.orcid_id && (
              <a
                href={`https://orcid.org/${authorData.orcid_id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>ORCID: {authorData.orcid_id}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {authorData?.affiliation && (
            <p className="text-xs text-slate-600 italic">
              {authorData.affiliation}
            </p>
          )}

          <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Diterbitkan resmi pada {formattedPublishDate}</span>
          </div>
        </div>

        {/* Tombol Utama Unduh PDF */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-sm font-semibold transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Naskah Lengkap (PDF)</span>
          </a>

          <div className="text-xs text-slate-500 font-mono">
            DOI: 10.5892/pendar.v{subData.volume || 1}i{subData.issue || 1}.{subData.id.slice(0, 4)}
          </div>
        </div>

        {/* Abstrak Lengkap */}
        <section className="space-y-3 pt-4 border-t border-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Abstrak
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line text-justify">
            {subData.abstract}
          </p>
        </section>

        {/* Kata Kunci */}
        {subData.keywords && subData.keywords.length > 0 && (
          <section className="space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Kata Kunci</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(subData.keywords as string[]).map((k: string) => (
                <span
                  key={k}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200"
                >
                  {k}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Komponen Generator Sitasi Ilmiah */}
        <section className="pt-6 border-t border-slate-200">
          <CitationCopy
            title={subData.title}
            authorName={authorData?.full_name || 'Penulis'}
            journalName={settings.journal_name}
            year={publishYear}
            volume={subData.volume || 1}
            issue={subData.issue || 1}
            articleId={subData.id}
          />
        </section>

        {/* Informasi Hak Cipta & Lisensi */}
        <div className="p-4 bg-slate-50 rounded text-xs text-slate-500 border border-slate-200 leading-relaxed">
          <p>
            <strong>Lisensi & Hak Cipta:</strong> Artikel ini dipublikasikan di bawah lisensi Akses Terbuka (Open Access). Siapa pun diizinkan membaca, mengunduh, menyalin, mendistribusikan, dan mencetak naskah ini untuk kepentingan riset akademis non-komersial dengan tetap mencantumkan atribusi sitasi penulis dan jurnal asal.
          </p>
        </div>
      </div>
    </>
  );
}
