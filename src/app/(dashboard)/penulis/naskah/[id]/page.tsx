// src/app/(dashboard)/penulis/naskah/[id]/page.tsx
'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { StatusBadge } from '@/components/ui/badge';
import { StatusTimeline } from '@/components/shared/status-timeline';
import { Dropzone } from '@/components/ui/dropzone';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ExternalLink,
  History,
} from 'lucide-react';
import type { Submission, ActivityLog } from '@/types';
import { STORAGE_BUCKETS, SUBMISSION_STATUS, type SubmissionStatus } from '@/lib/constants';

export default function DetailNaskahPenulisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const submissionId = resolvedParams.id;

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State untuk form unggah revisi jika diperlukan
  const [revisedFile, setRevisedFile] = useState<File | null>(null);
  const [isUploadingRevision, setIsUploadingRevision] = useState(false);
  const [revisionSuccessMsg, setRevisionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      setErrorMsg(null);

      try {
        // 1. Ambil data submission
        const { data: subData, error: subError } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionId)
          .eq('author_id', user.id)
          .single();

        if (subError || !subData) {
          throw new Error('Naskah tidak ditemukan atau Anda tidak memiliki hak akses.');
        }

        setSubmission(subData as Submission);

        // 2. Ambil log riwayat aktivitas
        const { data: logData } = await supabase
          .from('activity_log')
          .select('*')
          .eq('submission_id', submissionId)
          .order('created_at', { ascending: false });

        if (logData) {
          setLogs(logData as ActivityLog[]);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat detail naskah.';
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // Realtime update untuk submission ini
    const channel = supabase
      .channel(`sub-detail-${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `id=eq.${submissionId}`,
        },
        (payload) => {
          setSubmission(payload.new as Submission);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, submissionId, supabase]);

  // Fungsi membuat signed URL untuk mengunduh berkas privat
  const handleDownloadFile = async (bucket: string, rawPath: string, filename: string) => {
    try {
      const cleanPath = rawPath.startsWith(`${bucket}/`) ? rawPath.slice(bucket.length + 1) : rawPath;
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(cleanPath, 60);
      if (error || !data) {
        alert('Gagal membuat tautan unduh berkas: ' + (error?.message || 'Error'));
        return;
      }
      window.open(data.signedUrl, '_blank');
    } catch {
      alert('Terjadi kendala saat mengunduh berkas.');
    }
  };

  // Handler kirim berkas revisi
  const handleUploadRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisedFile || !user || !submission) return;

    setIsUploadingRevision(true);
    setErrorMsg(null);

    try {
      const timestamp = Date.now();
      const ext = revisedFile.name.split('.').pop() || 'pdf';
      const newPath = `${user.id}/${timestamp}_revised_manuscript.${ext}`;

      // Upload file baru ke bucket manuscripts
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.MANUSCRIPTS)
        .upload(newPath, revisedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Update submission status kembali ke submitted
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          anon_manuscript_url: newPath,
          status: SUBMISSION_STATUS.SUBMITTED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (updateError) {
        throw updateError;
      }

      // Catat log revisi
      await supabase.from('activity_log').insert({
        submission_id: submission.id,
        actor_id: user.id,
        actor_type: 'user',
        action: 'SUBMIT_REVISION',
        details: { filename: revisedFile.name, new_path: newPath },
      });

      setRevisionSuccessMsg('Berkas revisi berhasil dikirim! Naskah Anda kini kembali dalam antrean verifikasi redaksi.');
      setRevisedFile(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah berkas perbaikan.';
      setErrorMsg(msg);
    } finally {
      setIsUploadingRevision(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (errorMsg || !submission) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Kendala Memuat Naskah</h2>
        <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
        <Link
          href="/penulis"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dasbor Penulis</span>
        </Link>
      </div>
    );
  }

  const isRevisionNeeded =
    submission.status === 'identity_leaked' ||
    submission.status === 'revision_required' ||
    submission.status === 'revision_needed';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Tombol kembali & Status Header */}
      <div>
        <Link
          href="/penulis"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Naskah</span>
        </Link>

        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <StatusBadge status={submission.status as SubmissionStatus} />
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                Diajukan pada {new Date(submission.submitted_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="text-xs font-mono text-slate-400">ID: {submission.id.slice(0, 8)}</div>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
            {submission.title}
          </h1>

          {/* Stepper Timeline Visual */}
          <div className="pt-2">
            <StatusTimeline status={submission.status as SubmissionStatus} />
          </div>
        </div>
      </div>

      {/* Alert Khusus: Kebocoran Identitas (Zero-Leak Gatekeeper AI) */}
      {(submission.status === 'identity_leaked' || submission.status === 'revision_required') && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900">
                Peringatan: Potensi Kebocoran Identitas pada Naskah Anonim
              </h3>
              <p className="text-xs text-rose-800 leading-relaxed">
                {submission.ai_verification_result?.leaked_details ||
                  'Sistem verifikasi AI mendeteksi adanya penyebutan nama institusi, afiliasi, atau ucapan terima kasih beridentitas pada Main Manuscript Anda. Sesuai standar Double-Blind Peer Review, naskah tidak dapat diteruskan ke peninjau sebelum dibersihkan.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alert Khusus: Naskah Memerlukan Catatan Revisi Reviewer */}
      {submission.status === 'revision_needed' && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">
                Catatan Peninjauan Tersedia — Diperlukan Revisi
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Peninjau sejawat telah mengevaluasi naskah Anda dan memberikan catatan perbaikan. Berkas anotasi telah disanitasi dari metadata peninjau.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Kirim Revisi (Hanya muncul jika status butuh revisi) */}
      {isRevisionNeeded && (
        <div className="bg-white border border-amber-300 rounded-lg p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Unggah Berkas Naskah Perbaikan (Revisi)
          </h2>

          {revisionSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{revisionSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleUploadRevision} className="space-y-4">
            <Dropzone
              label="Berkas Main Manuscript yang Telah Diperbaiki"
              description="Pastikan naskah perbaikan tetap anonim (tanpa nama dan tanpa identitas)."
              required
              maxSizeMB={20}
              value={revisedFile}
              onChange={setRevisedFile}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!revisedFile || isUploadingRevision}
              isLoading={isUploadingRevision}
            >
              Kirim Naskah Perbaikan
            </Button>
          </form>
        </div>
      )}

      {/* Rincian Metadata & Berkas Terunggah */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Abstrak & Kata Kunci */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Abstrak Penelitian
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {submission.abstract}
            </p>
          </div>

          {submission.keywords && submission.keywords.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Kata Kunci Teknis
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {submission.keywords.map((k) => (
                  <span
                    key={k}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium border border-slate-200"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Berkas Terlampir & Audit Trail Ringkas */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Berkas Terunggah
            </h3>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  handleDownloadFile(STORAGE_BUCKETS.TITLE_PAGES, submission.title_page_url, 'Title_Page.pdf')
                }
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-800 truncate">Title Page</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDownloadFile(
                    STORAGE_BUCKETS.MANUSCRIPTS,
                    submission.anon_manuscript_url,
                    'Main_Manuscript.pdf'
                  )
                }
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-800 truncate">Main Manuscript (Anonim)</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {submission.status === 'published' && submission.final_pdf_url && (
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadFile(STORAGE_BUCKETS.PUBLISHED, submission.final_pdf_url!, 'Published_Paper.pdf')
                  }
                  className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-900 truncate">PDF Terbit Resmi</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                </button>
              )}
            </div>
          </div>

          {/* Riwayat Log Aktivitas */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Jejak Audit Naskah</span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada riwayat aktivitas tercatat.</p>
              ) : (
                logs.map((log) => {
                  const logDate = new Date(log.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={log.id} className="text-xs space-y-0.5">
                      <div className="font-medium text-slate-800">
                        {log.action === 'SUBMIT_MANUSCRIPT' && 'Naskah Awal Berhasil Dikirim'}
                        {log.action === 'SUBMIT_REVISION' && 'Berkas Perbaikan Naskah Dikirim'}
                        {log.action !== 'SUBMIT_MANUSCRIPT' && log.action !== 'SUBMIT_REVISION' && log.action}
                      </div>
                      <div className="text-[11px] text-slate-400">{logDate}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
