// src/app/(dashboard)/admin/naskah/[id]/page.tsx
'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea, Input } from '@/components/ui/input';
import {
  ArrowLeft,
  FileText,
  Download,
  ShieldCheck,
  UserCheck,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  History,
  Lock,
  Star,
} from 'lucide-react';
import {
  STORAGE_BUCKETS,
  ASSIGNMENT_LABELS,
  RECOMMENDATION_LABELS,
  SUBMISSION_STATUS,
  type SubmissionStatus,
  type AssignmentStatus,
} from '@/lib/constants';
import type { Submission, ReviewAssignment, ReviewRubric, ActivityLog, UserProfile } from '@/types';

interface ExtendedAssignment extends ReviewAssignment {
  rubric?: ReviewRubric | null;
}

export default function AdminDetailNaskahPage({
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
  const [assignments, setAssignments] = useState<ExtendedAssignment[]>([]);
  const [availableReviewers, setAvailableReviewers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State untuk form modal penugasan reviewer
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(14);
  const [isAssigning, setIsAssigning] = useState(false);

  // State untuk keputusan redaksi
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isDeciding, setIsDeciding] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [volume, setVolume] = useState(1);
  const [issue, setIssue] = useState(1);
  const [showPublishBox, setShowPublishBox] = useState(false);

  const loadAllData = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Ambil data submission
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (subError || !subData) {
        throw new Error('Naskah tidak ditemukan.');
      }

      // Ambil data profil penulis
      const { data: authorData } = await supabase
        .from('users_profile')
        .select('full_name, email, affiliation, orcid_id')
        .eq('id', subData.author_id)
        .single();

      setSubmission({
        ...(subData as Submission),
        author: authorData || undefined,
      });

      // 2. Ambil seluruh penugasan reviewer untuk naskah ini
      const { data: assignData } = await supabase
        .from('review_assignments')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (assignData && assignData.length > 0) {
        const reviewerIds = [...new Set(assignData.map((a) => a.reviewer_id))];
        const { data: reviewersData } = await supabase
          .from('users_profile')
          .select('id, full_name, email, expertise_keywords')
          .in('id', reviewerIds);

        const reviewerMap = new Map((reviewersData || []).map((r) => [r.id, r]));

        // Ambil rubrik untuk setiap assignment yang berstatus completed
        const extendedList: ExtendedAssignment[] = [];
        for (const a of assignData) {
          let rubricObj: ReviewRubric | null = null;
          if (a.status === 'completed') {
            const { data: rub } = await supabase
              .from('reviews_rubric')
              .select('*')
              .eq('assignment_id', a.id)
              .single();
            rubricObj = (rub as ReviewRubric) || null;
          }
          extendedList.push({
            ...a,
            reviewer: reviewerMap.get(a.reviewer_id) as Pick<UserProfile, 'id' | 'full_name' | 'email' | 'expertise_keywords'> || undefined,
            rubric: rubricObj,
          });
        }
        setAssignments(extendedList);
      } else {
        setAssignments([]);
      }

      // 3. Ambil daftar calon reviewer yang tersedia di sistem
      const { data: reviewersList } = await supabase
        .from('users_profile')
        .select('*')
        .eq('role', 'reviewer')
        .order('full_name', { ascending: true });

      if (reviewersList) {
        setAvailableReviewers(reviewersList as UserProfile[]);
      }

      // 4. Ambil activity logs
      const { data: logData } = await supabase
        .from('activity_log')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (logData) {
        setLogs(logData as ActivityLog[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat rincian naskah.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user, submissionId]);

  // Unduh berkas dengan signed URL
  const handleDownload = async (bucket: string, path: string) => {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 120);
      if (error || !data) {
        alert('Gagal mengunduh: ' + (error?.message || 'Error'));
        return;
      }
      window.open(data.signedUrl, '_blank');
    } catch {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  // Handler Tugaskan Reviewer Baru
  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewerId || !submission || !user) return;

    setIsAssigning(true);
    setActionSuccessMsg(null);

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Number(deadlineDays));

      // Buat penugasan di review_assignments
      const { error: assignErr } = await supabase.from('review_assignments').insert({
        submission_id: submission.id,
        reviewer_id: selectedReviewerId,
        status: 'invited',
        due_date: dueDate.toISOString(),
      });

      if (assignErr) throw assignErr;

      // Update status submission jika masih submitted
      if (submission.status === 'submitted' || submission.status === 'pending_ai_verification') {
        await supabase
          .from('submissions')
          .update({ status: SUBMISSION_STATUS.WAITING_FOR_REVIEWER })
          .eq('id', submission.id);
      }

      // Catat log penugasan
      const reviewerProfile = availableReviewers.find((r) => r.id === selectedReviewerId);
      await supabase.from('activity_log').insert({
        submission_id: submission.id,
        actor_id: user.id,
        actor_type: 'user',
        action: 'ASSIGN_REVIEWER',
        details: {
          reviewer_name: reviewerProfile?.full_name,
          due_date: dueDate.toISOString(),
        },
      });

      setActionSuccessMsg(`Reviewer (${reviewerProfile?.full_name}) berhasil ditugaskan!`);
      setSelectedReviewerId('');
      await loadAllData();
    } catch (err: unknown) {
      alert('Gagal menugaskan reviewer: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsAssigning(false);
    }
  };

  // Handler Minta Revisi
  const handleRequestRevision = async () => {
    if (!submission || !user) return;
    if (!confirm('Apakah Anda yakin ingin mengembalikan naskah ini kepada Penulis untuk direvisi?')) return;

    setIsDeciding(true);
    try {
      await supabase
        .from('submissions')
        .update({ status: SUBMISSION_STATUS.REVISION_NEEDED, updated_at: new Date().toISOString() })
        .eq('id', submission.id);

      await supabase.from('activity_log').insert({
        submission_id: submission.id,
        actor_id: user.id,
        actor_type: 'user',
        action: 'EDITORIAL_REQUEST_REVISION',
        details: { timestamp: new Date().toISOString() },
      });

      setActionSuccessMsg('Status naskah berhasil diubah menjadi: Perbaikan Catatan Review (Penulis diberitahu).');
      await loadAllData();
    } catch (err: unknown) {
      alert('Gagal meminta revisi: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsDeciding(false);
    }
  };

  // Handler Tolak Naskah
  const handleRejectSubmission = async () => {
    if (!submission || !user || !rejectReason.trim()) return;
    setIsDeciding(true);

    try {
      await supabase
        .from('submissions')
        .update({
          status: SUBMISSION_STATUS.REJECTED,
          rejection_reason: rejectReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      await supabase.from('activity_log').insert({
        submission_id: submission.id,
        actor_id: user.id,
        actor_type: 'user',
        action: 'EDITORIAL_REJECT',
        details: { reason: rejectReason.trim() },
      });

      setActionSuccessMsg('Naskah telah resmi ditolak.');
      setShowRejectBox(false);
      setRejectReason('');
      await loadAllData();
    } catch (err: unknown) {
      alert('Gagal menolak naskah: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsDeciding(false);
    }
  };

  // Handler Setujui & Terbitkan
  const handlePublishSubmission = async () => {
    if (!submission || !user) return;
    setIsDeciding(true);

    try {
      // PDF publik untuk portal publik (menggunakan salinan naskah akhir)
      await supabase
        .from('submissions')
        .update({
          status: SUBMISSION_STATUS.PUBLISHED,
          volume: Number(volume),
          issue: Number(issue),
          final_pdf_url: submission.anon_manuscript_url,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      await supabase.from('activity_log').insert({
        submission_id: submission.id,
        actor_id: user.id,
        actor_type: 'user',
        action: 'EDITORIAL_PUBLISH',
        details: { volume, issue, published_at: new Date().toISOString() },
      });

      setActionSuccessMsg('Naskah berhasil diterbitkan secara resmi di Portal Akses Terbuka!');
      setShowPublishBox(false);
      await loadAllData();
    } catch (err: unknown) {
      alert('Gagal menerbitkan naskah: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsDeciding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (errorMsg || !submission) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Kendala Memuat Naskah Redaksi</h2>
        <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dasbor Editor</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Antrean Naskah Redaksi</span>
        </Link>

        {actionSuccessMsg && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Informasi Utama Naskah */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
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

            <div className="text-xs font-mono text-slate-400">ID: {submission.id}</div>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
            {submission.title}
          </h1>

          {/* Rincian Penulis (Full Visibility bagi Editor) */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Penulis Utama:</span>
              <strong className="text-slate-800 text-sm">
                {submission.author?.full_name || 'Tidak diketahui'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Afiliasi Institusi:</span>
              <span className="text-slate-700">{submission.author?.affiliation || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Email & ORCID:</span>
              <span className="text-slate-700 font-mono text-[11px] block">
                {submission.author?.email}
              </span>
              {submission.author?.orcid_id && (
                <span className="text-blue-600 text-[11px]">ORCID: {submission.author.orcid_id}</span>
              )}
            </div>
          </div>

          {/* Tombol Unduh Berkas Dual-Upload */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownload(STORAGE_BUCKETS.TITLE_PAGES, submission.title_page_url)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-medium text-slate-800 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Unduh Title Page (Identitas)</span>
              <Download className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => handleDownload(STORAGE_BUCKETS.MANUSCRIPTS, submission.anon_manuscript_url)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-medium text-slate-800 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Unduh Main Manuscript (Naskah Anonim)</span>
              <Download className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Bagian 1: Panel Penugasan Reviewer */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Penugasan Peninjau Sejawat (Double-Blind Assignments)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola peninjau independen yang mengevaluasi naskah ini tanpa mengetahui identitas penulis.
            </p>
          </div>

          <span className="text-xs font-medium text-slate-600">
            {assignments.length} Peninjau Ditugaskan
          </span>
        </div>

        {/* Daftar Reviewer yang Ditugaskan */}
        {assignments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
            Belum ada peninjau yang ditugaskan untuk naskah ini. Silakan pilih reviewer di bawah.
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => {
              const statusCfg = ASSIGNMENT_LABELS[a.status as AssignmentStatus];

              return (
                <div
                  key={a.id}
                  className="p-4 bg-slate-50/60 rounded-lg border border-slate-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-slate-900 font-semibold">
                        {a.reviewer?.full_name || 'Reviewer'}
                      </strong>
                      <span className="text-xs text-slate-400">({a.reviewer?.email})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${statusCfg?.color}`}>
                        {statusCfg?.label}
                      </span>
                      {a.due_date && (
                        <span className="text-[11px] text-slate-500">
                          Batas: {new Date(a.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {a.reminder_count > 0 && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Teguran: {a.reminder_count}/3
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rubrik Penilaian jika selesai */}
                  {a.rubric ? (
                    <div className="p-3 bg-white rounded border border-emerald-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Rekomendasi: {RECOMMENDATION_LABELS[a.rubric.recommendation]}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Rerata Skor:{' '}
                          <strong className="text-slate-900">
                            {(
                              (a.rubric.score_originality +
                                a.rubric.score_methodology +
                                a.rubric.score_clarity +
                                a.rubric.score_significance +
                                a.rubric.score_references) /
                              5
                            ).toFixed(1)}{' '}
                            / 5.0
                          </strong>
                        </div>
                      </div>

                      {/* Skor Detail */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                        <div>Orisinalitas: <strong>{a.rubric.score_originality}</strong></div>
                        <div>Metodologi: <strong>{a.rubric.score_methodology}</strong></div>
                        <div>Kejelasan: <strong>{a.rubric.score_clarity}</strong></div>
                        <div>Signifikansi: <strong>{a.rubric.score_significance}</strong></div>
                        <div>Pustaka: <strong>{a.rubric.score_references}</strong></div>
                      </div>

                      {/* Catatan Penulis */}
                      <div className="text-xs space-y-1">
                        <span className="text-slate-500 block font-semibold">Catatan untuk Penulis:</span>
                        <p className="text-slate-700 bg-slate-50 p-2 rounded whitespace-pre-line text-[11px]">
                          {a.rubric.comments_for_author}
                        </p>
                      </div>

                      {/* Catatan Rahasia Editor */}
                      {a.rubric.comments_for_editor && (
                        <div className="text-xs space-y-1 bg-amber-50/70 p-2.5 rounded border border-amber-200">
                          <span className="text-amber-800 font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Catatan Rahasia Khusus Editor:</span>
                          </span>
                          <p className="text-amber-900 text-[11px] whitespace-pre-line">
                            {a.rubric.comments_for_editor}
                          </p>
                        </div>
                      )}

                      {/* Lampiran PDF Coretan Reviewer */}
                      {a.rubric.raw_review_pdf_url && (
                        <button
                          type="button"
                          onClick={() => handleDownload(STORAGE_BUCKETS.REVIEW_FILES, a.rubric!.raw_review_pdf_url!)}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh PDF Anotasi Reviewer</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">
                      Reviewer belum mengirimkan lembar penilaian rubrik.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Form Penugasan Reviewer Baru */}
        <form onSubmit={handleAssignReviewer} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <div className="text-xs font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Tugaskan Reviewer Baru Secara Manual</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-700 block">Pilih Peninjau dari Database</label>
              <select
                required
                value={selectedReviewerId}
                onChange={(e) => setSelectedReviewerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Pilih Peninjau Ahli --</option>
                {availableReviewers.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    {rev.full_name} ({rev.affiliation || 'Institusi'}){' '}
                    {!rev.is_available ? '[MODE CUTI]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 block">Tenggat Waktu (Hari)</label>
              <input
                type="number"
                min={3}
                max={60}
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" isLoading={isAssigning} disabled={!selectedReviewerId}>
              Kirimkan Penugasan Reviewer
            </Button>
          </div>
        </form>
      </div>

      {/* Bagian 2: Panel Stempel Keputusan Dewan Redaksi */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Stempel Keputusan Dewan Redaksi (Editorial Decision)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sebagai Editor, tentukan status kelayakan akhir naskah berdasarkan hasil evaluasi peninjau sejawat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isDeciding || submission.status === 'published'}
            onClick={handleRequestRevision}
            className="border-amber-300 text-amber-800 hover:bg-amber-50"
          >
            Minta Revisi ke Penulis
          </Button>

          <Button
            type="button"
            variant="danger"
            disabled={isDeciding || submission.status === 'rejected'}
            onClick={() => setShowRejectBox(!showRejectBox)}
          >
            Tolak Naskah
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={isDeciding || submission.status === 'published'}
            onClick={() => setShowPublishBox(!showPublishBox)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Setujui & Terbitkan Naskah (Publish)
          </Button>
        </div>

        {/* Kotak Konfirmasi Penolakan Naskah */}
        {showRejectBox && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-rose-900">Alasan Penolakan Naskah</h3>
            <Textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Tuliskan pertimbangan dewan redaksi atas penolakan naskah ini..."
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowRejectBox(false)}>
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={!rejectReason.trim() || isDeciding}
                isLoading={isDeciding}
                onClick={handleRejectSubmission}
              >
                Konfirmasi Tolak Naskah
              </Button>
            </div>
          </div>
        )}

        {/* Kotak Konfirmasi Penerbitan (Publish) */}
        {showPublishBox && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-emerald-900">Konfirmasi Publikasi Naskah Open Access</h3>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <Input
                label="Nomor Volume"
                type="number"
                min={1}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
              <Input
                label="Nomor Terbitan (Issue)"
                type="number"
                min={1}
                value={issue}
                onChange={(e) => setIssue(Number(e.target.value))}
              />
            </div>
            <p className="text-[11px] text-emerald-700">
              Naskah akan langsung resmi berstatus <strong>Published</strong> dan dapat diakses publik di halaman arsip dan beranda jurnal.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPublishBox(false)}>
                Batal
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                isLoading={isDeciding}
                onClick={handlePublishSubmission}
              >
                Terbitkan Sekarang
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bagian 3: Riwayat Audit Aktivitas */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <History className="w-5 h-5 text-slate-500" />
          Audit Trail Aktivitas Naskah
        </h2>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-400">Belum ada riwayat aktivitas tercatat.</p>
          ) : (
            logs.map((log) => {
              const logDate = new Date(log.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={log.id} className="text-xs p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[11px] text-slate-400">{logDate}</span>
                  </div>
                  {log.details && (
                    <pre className="text-[10px] text-slate-600 font-mono bg-white p-1.5 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
