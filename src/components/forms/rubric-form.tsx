// src/components/forms/rubric-form.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Dropzone } from '@/components/ui/dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import {
  RECOMMENDATION,
  RECOMMENDATION_LABELS,
  STORAGE_BUCKETS,
  type Recommendation,
} from '@/lib/constants';
import { Shield, AlertCircle, CheckCircle2, Lock, Send } from 'lucide-react';

export interface RubricFormProps {
  assignmentId: string;
  submissionId: string;
  isCompleted?: boolean;
  initialData?: {
    score_originality: number;
    score_methodology: number;
    score_clarity: number;
    score_significance: number;
    score_references: number;
    comments_for_author?: string | null;
    comments_for_editor?: string | null;
    recommendation: Recommendation;
  };
}

interface RatingCategory {
  id: 'originality' | 'methodology' | 'clarity' | 'significance' | 'references';
  label: string;
  desc: string;
}

const CATEGORIES: RatingCategory[] = [
  {
    id: 'originality',
    label: 'Orisinalitas & Kebaruan Ide (Originality)',
    desc: 'Apakah riset menyajikan kontribusi baru, solusi orisinal, dan bukan plagiarisme ide?',
  },
  {
    id: 'methodology',
    label: 'Validitas & Ketepatan Metodologi (Methodology)',
    desc: 'Apakah desain eksperimen, teknik pengumpulan data, dan analisis ilmiah dapat dipertanggungjawabkan?',
  },
  {
    id: 'clarity',
    label: 'Kejelasan & Kerapian Struktur (Clarity)',
    desc: 'Apakah naskah ditulis dengan alur yang koheren, bahasa ilmiah yang baik, dan gambar/tabel yang jelas?',
  },
  {
    id: 'significance',
    label: 'Signifikansi Dampak Ilmiah (Significance)',
    desc: 'Sejauh mana temuan penelitian ini berbobot dan bermanfaat bagi bidang ilmu bersangkutan?',
  },
  {
    id: 'references',
    label: 'Relevansi & Kemutakhiran Pustaka (References)',
    desc: 'Apakah rujukan mutakhir (mayoritas 5 tahun terakhir) dan bersumber dari jurnal terindeks kredibel?',
  },
];

export function RubricForm({
  assignmentId,
  submissionId,
  isCompleted = false,
  initialData,
}: RubricFormProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [scores, setScores] = useState({
    originality: initialData?.score_originality || 0,
    methodology: initialData?.score_methodology || 0,
    clarity: initialData?.score_clarity || 0,
    significance: initialData?.score_significance || 0,
    references: initialData?.score_references || 0,
  });

  const [recommendation, setRecommendation] = useState<Recommendation | ''>(
    initialData?.recommendation || ''
  );
  const [commentsForAuthor, setCommentsForAuthor] = useState(
    initialData?.comments_for_author || ''
  );
  const [commentsForEditor, setCommentsForEditor] = useState(
    initialData?.comments_for_editor || ''
  );
  const [reviewPdfFile, setReviewPdfFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleScoreChange = (catId: keyof typeof scores, val: number) => {
    if (isCompleted) return;
    setScores((prev) => ({ ...prev, [catId]: val }));
  };

  const calculateAverage = () => {
    const sum =
      scores.originality +
      scores.methodology +
      scores.clarity +
      scores.significance +
      scores.references;
    return (sum / 5).toFixed(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompleted) return;
    setErrorMsg(null);

    // Validasi kelengkapan rubrik
    if (
      scores.originality === 0 ||
      scores.methodology === 0 ||
      scores.clarity === 0 ||
      scores.significance === 0 ||
      scores.references === 0
    ) {
      setErrorMsg('Harap berikan skor (skala 1–5) pada kelima kriteria penilaian.');
      return;
    }

    if (!recommendation) {
      setErrorMsg('Harap tentukan rekomendasi akhir untuk naskah ini.');
      return;
    }

    if (!commentsForAuthor.trim()) {
      setErrorMsg('Catatan evaluasi untuk penulis wajib diisi.');
      return;
    }

    if (!user) {
      setErrorMsg('Sesi login telah berakhir.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      let rawPdfPath: string | null = null;

      // 1. Jika ada PDF coretan catatan, upload ke bucket 'review-files'
      if (reviewPdfFile) {
        const timestamp = Date.now();
        const ext = reviewPdfFile.name.split('.').pop() || 'pdf';
        rawPdfPath = `${user.id}/${timestamp}_review_notes.${ext}`;

        const { error: errUpload } = await supabase.storage
          .from(STORAGE_BUCKETS.REVIEW_FILES)
          .upload(rawPdfPath, reviewPdfFile);

        if (errUpload) throw errUpload;
      }

      // 2. Simpan rubrik penilaian ke reviews_rubric
      const { error: errRubric } = await supabase.from('reviews_rubric').insert({
        assignment_id: assignmentId,
        score_originality: scores.originality,
        score_methodology: scores.methodology,
        score_clarity: scores.clarity,
        score_significance: scores.significance,
        score_references: scores.references,
        comments_for_author: commentsForAuthor.trim(),
        comments_for_editor: commentsForEditor.trim() || null,
        recommendation: recommendation as Recommendation,
        raw_review_pdf_url: rawPdfPath,
      });

      if (errRubric) throw errRubric;

      // 3. Update status assignment menjadi 'completed'
      const { error: errAssign } = await supabase
        .from('review_assignments')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (errAssign) throw errAssign;

      // 4. Update status submission jika rekomendasi memerlukan revisi
      const newSubStatus =
        recommendation === 'accept'
          ? 'under_review'
          : recommendation === 'minor_revision' || recommendation === 'major_revision'
          ? 'revision_needed'
          : 'under_review';

      await supabase
        .from('submissions')
        .update({ status: newSubStatus })
        .eq('id', submissionId);

      // 5. Catat ke activity_log
      await supabase.from('activity_log').insert({
        submission_id: submissionId,
        actor_id: user.id,
        actor_type: 'user',
        action: 'REVIEW_COMPLETED',
        details: {
          assignment_id: assignmentId,
          average_score: calculateAverage(),
          recommendation,
          has_pdf_attachment: !!rawPdfPath,
        },
      });

      router.push('/peninjau?evaluated=true');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan rubrik penilaian.';
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Evaluasi Belum Lengkap</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Bagian 1: Rubrik Skala 1 - 5 */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              1. Rubrik Penilaian Kualitas Ilmiah (Skala 1–5)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              1 = Sangat Kurang, 2 = Kurang, 3 = Cukup, 4 = Baik, 5 = Sangat Baik
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Rerata Skor:</span>
            <span className="ml-1.5 text-base font-bold text-slate-900">{calculateAverage()} / 5.0</span>
          </div>
        </div>

        <div className="space-y-5">
          {CATEGORIES.map((cat) => {
            const currentScore = scores[cat.id];

            return (
              <div
                key={cat.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-3"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">{cat.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{cat.desc}</div>
                </div>

                {/* Tombol Pilihan Skor 1 - 5 */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const isSelected = currentScore === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={isCompleted}
                        onClick={() => handleScoreChange(cat.id, val)}
                        className={`flex-1 py-2 text-xs font-bold rounded border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bagian 2: Rekomendasi Akhir */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            2. Rekomendasi Keputusan Akhir
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tentukan rekomendasi resmi Anda untuk dipertimbangkan oleh Dewan Editor.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(RECOMMENDATION) as (keyof typeof RECOMMENDATION)[]).map((key) => {
            const val = RECOMMENDATION[key];
            const isSelected = recommendation === val;

            return (
              <button
                key={val}
                type="button"
                disabled={isCompleted}
                onClick={() => !isCompleted && setRecommendation(val)}
                className={`p-3.5 text-left border rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <span>{RECOMMENDATION_LABELS[val]}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bagian 3: Komentar Evaluasi & Catatan */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            3. Catatan Evaluasi & Ulasan Kualitatif
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sampaikan kritik akademis yang konstruktif untuk meningkatkan mutu penelitian.
          </p>
        </div>

        {/* Catatan untuk Penulis */}
        <Textarea
          label="Catatan & Masukan untuk Penulis (Wajib)"
          name="commentsForAuthor"
          required
          disabled={isCompleted}
          rows={6}
          value={commentsForAuthor}
          onChange={(e) => setCommentsForAuthor(e.target.value)}
          placeholder="Tuliskan evaluasi kelemahan, saran perbaikan metodologi, referensi tambahan, atau saran teknis yang dapat dibaca oleh penulis..."
          hint="🔒 Nama Anda tidak akan ditampilkan kepada penulis (Double-Blind terjamin)."
        />

        {/* Catatan Rahasia untuk Dewan Editor */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Catatan Rahasia Khusus Dewan Editor (Opsional)</span>
          </div>
          <Textarea
            name="commentsForEditor"
            disabled={isCompleted}
            rows={3}
            value={commentsForEditor}
            onChange={(e) => setCommentsForEditor(e.target.value)}
            placeholder="Catatan internal yang hanya dapat dibaca oleh Editor jurnal (mis: dugaan plagiarisme terselubung, pertimbangan khusus, dll)..."
          />
        </div>

        {/* Upload Catatan PDF Beranotasi */}
        {!isCompleted && (
          <div className="space-y-2">
            <Dropzone
              label="Lampiran Catatan Coretan Naskah (PDF Opsional)"
              description="Jika Anda mencoret-coret berkas PDF naskah, unggah di sini. Sistem akan otomatis membersihkan properti nama akun/komputer Anda dari berkas."
              required={false}
              maxSizeMB={15}
              value={reviewPdfFile}
              onChange={setReviewPdfFile}
            />
            <p className="text-[11px] text-blue-700 bg-blue-50 p-2.5 rounded border border-blue-200 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                <strong>Digital Footprint Scrubber:</strong> Berkas PDF ini akan disanitasi dari metadata Windows/Mac sebelum dapat diunduh oleh penulis.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Tombol Aksi */}
      {!isCompleted && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => router.back()}
          >
            Kembali
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="min-w-[200px]"
          >
            <Send className="w-4 h-4 mr-1.5" />
            <span>Kirimkan Hasil Penilaian</span>
          </Button>
        </div>
      )}
    </form>
  );
}
