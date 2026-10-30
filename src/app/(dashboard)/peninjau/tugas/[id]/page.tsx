// src/app/(dashboard)/peninjau/tugas/[id]/page.tsx
'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RubricForm } from '@/components/forms/rubric-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Download,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { STORAGE_BUCKETS, ASSIGNMENT_LABELS, type AssignmentStatus } from '@/lib/constants';
import type { ReviewAssignment, Submission, ReviewRubric } from '@/types';

export default function DetailTugasReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.id;

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [assignment, setAssignment] = useState<ReviewAssignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [existingRubric, setExistingRubric] = useState<ReviewRubric | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadTaskData() {
      if (!user) return;
      setIsLoading(true);
      setErrorMsg(null);

      try {
        // 1. Ambil data penugasan review
        const { data: assignData, error: assignError } = await supabase
          .from('review_assignments')
          .select(`
            *,
            submission:submissions (
              id,
              title,
              abstract,
              keywords,
              anon_manuscript_url
            )
          `)
          .eq('id', assignmentId)
          .eq('reviewer_id', user.id)
          .single();

        if (assignError || !assignData) {
          throw new Error('Tugas review tidak ditemukan atau Anda tidak memiliki akses.');
        }

        const assignObj = assignData as ReviewAssignment;
        setAssignment(assignObj);
        setSubmission(assignObj.submission as Submission);

        // 2. Jika tugas sudah completed, ambil rubrik yang sudah pernah diisi
        if (assignObj.status === 'completed') {
          const { data: rubricData } = await supabase
            .from('reviews_rubric')
            .select('*')
            .eq('assignment_id', assignmentId)
            .single();

          if (rubricData) {
            setExistingRubric(rubricData as ReviewRubric);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat tugas review.';
        setErrorMsg(msg);
      } finally {
        setIsLoading(false);
      }
    }

    loadTaskData();
  }, [user, assignmentId, supabase]);

  // Fungsi mengunduh naskah anonim
  const handleDownloadManuscript = async () => {
    if (!submission?.anon_manuscript_url) return;
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.MANUSCRIPTS)
        .createSignedUrl(submission.anon_manuscript_url, 120);

      if (error || !data) {
        alert('Gagal membuat tautan unduh naskah: ' + (error?.message || 'Error'));
        return;
      }
      window.open(data.signedUrl, '_blank');
    } catch {
      alert('Terjadi kesalahan saat mengunduh naskah.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (errorMsg || !assignment || !submission) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Kendala Memuat Tugas Review</h2>
        <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
        <Link
          href="/peninjau"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dasbor Peninjau</span>
        </Link>
      </div>
    );
  }

  const isCompleted = assignment.status === 'completed';
  const statusConfig = ASSIGNMENT_LABELS[assignment.status as AssignmentStatus];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/peninjau"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Tugas Peninjauan</span>
        </Link>

        {/* Banner Naskah Anonim */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${statusConfig?.color}`}>
                {statusConfig?.label}
              </span>

              {assignment.due_date && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Batas waktu: {new Date(assignment.due_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-800">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Naskah Anonim (Double-Blind)</span>
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
            {submission.title}
          </h1>

          {/* Abstrak Naskah */}
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Abstrak Penelitian
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {submission.abstract}
            </p>

            {submission.keywords && submission.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {submission.keywords.map((k) => (
                  <span
                    key={k}
                    className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[11px] font-medium"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tombol Unduh Naskah Anonim */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 italic">
              📄 Silakan unduh dan pelajari naskah lengkap sebelum mengisi rubrik penilaian.
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadManuscript}
              className="gap-2 shrink-0"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Unduh Main Manuscript (PDF Anonim)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Selesai Notifikasi */}
      {isCompleted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Penilaian Telah Dikirimkan ke Dewan Editor</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Terima kasih atas kontribusi ilmiah Anda. Evaluasi Anda saat ini berada dalam pertimbangan dewan redaksi.
            </div>
          </div>
        </div>
      )}

      {/* Formulir Rubrik Penilaian */}
      <RubricForm
        assignmentId={assignment.id}
        submissionId={submission.id}
        isCompleted={isCompleted}
        initialData={existingRubric || undefined}
      />
    </div>
  );
}
