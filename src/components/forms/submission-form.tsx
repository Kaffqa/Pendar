// src/components/forms/submission-form.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Input, Textarea } from '@/components/ui/input';
import { Dropzone } from '@/components/ui/dropzone';
import { Button } from '@/components/ui/button';
import { ShieldCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { STORAGE_BUCKETS, SUBMISSION_STATUS } from '@/lib/constants';

export function SubmissionForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [titlePageFile, setTitlePageFile] = useState<File | null>(null);
  const [anonManuscriptFile, setAnonManuscriptFile] = useState<File | null>(null);

  const [agreeAnonymous, setAgreeAnonymous] = useState(false);
  const [agreeOpenAccess, setAgreeOpenAccess] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tangani penambahan keyword via Enter atau koma
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = keywordInput.trim().replace(/^,+|,+$/g, '');
      if (val && !keywords.includes(val) && keywords.length < 8) {
        setKeywords([...keywords, val]);
        setKeywordInput('');
      }
    }
  };

  const removeKeyword = (tagToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Sesi login telah berakhir. Silakan login kembali.');
      return;
    }

    if (keywords.length < 3) {
      setErrorMsg('Mohon masukkan minimal 3 kata kunci teknis.');
      return;
    }

    if (!titlePageFile) {
      setErrorMsg('Berkas Title Page (Halaman Judul) wajib diunggah.');
      return;
    }

    if (!anonManuscriptFile) {
      setErrorMsg('Berkas Main Manuscript (Naskah Anonim) wajib diunggah.');
      return;
    }

    if (!agreeAnonymous || !agreeOpenAccess) {
      setErrorMsg('Harap setujui pernyataan kepatuhan anonimitas dan etika publikasi.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const timestamp = Date.now();
      const safeAuthorId = user.id;

      // 1. Upload Title Page ke bucket 'title-pages'
      const titlePageExt = titlePageFile.name.split('.').pop() || 'pdf';
      const titlePagePath = `${safeAuthorId}/${timestamp}_title_page.${titlePageExt}`;
      const { error: errTitlePage } = await supabase.storage
        .from(STORAGE_BUCKETS.TITLE_PAGES)
        .upload(titlePagePath, titlePageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (errTitlePage) {
        throw new Error(`Gagal mengunggah Title Page: ${errTitlePage.message}`);
      }

      // 2. Upload Main Manuscript ke bucket 'manuscripts'
      const manuscriptExt = anonManuscriptFile.name.split('.').pop() || 'pdf';
      const manuscriptPath = `${safeAuthorId}/${timestamp}_manuscript.${manuscriptExt}`;
      const { error: errManuscript } = await supabase.storage
        .from(STORAGE_BUCKETS.MANUSCRIPTS)
        .upload(manuscriptPath, anonManuscriptFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (errManuscript) {
        throw new Error(`Gagal mengunggah Naskah Manuskrip: ${errManuscript.message}`);
      }

      // 3. Simpan submisi ke tabel 'submissions'
      const { data: submission, error: errSub } = await supabase
        .from('submissions')
        .insert({
          author_id: user.id,
          title: title.trim(),
          abstract: abstractText.trim(),
          keywords,
          title_page_url: titlePagePath,
          anon_manuscript_url: manuscriptPath,
          status: SUBMISSION_STATUS.SUBMITTED,
        })
        .select()
        .single();

      if (errSub || !submission) {
        throw new Error(`Gagal menyimpan data naskah: ${errSub?.message}`);
      }

      // 4. Catat riwayat di activity_log
      await supabase.from('activity_log').insert({
        submission_id: submission.id,
        actor_id: user.id,
        actor_type: 'user',
        action: 'SUBMIT_MANUSCRIPT',
        details: {
          title: title.trim(),
          keywords_count: keywords.length,
          files: {
            title_page: titlePagePath,
            manuscript: manuscriptPath,
          },
        },
      });

      // Arahkan ke halaman detail naskah author
      router.push(`/penulis/naskah/${submission.id}?submitted=true`);
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan naskah.';
      setErrorMsg(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" />
          <div>
            <div className="font-semibold">Submisi Naskah Belum Selesai</div>
            <div className="text-xs mt-0.5">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Bagian 1: Metadata Naskah */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            1. Metadata Penelitian
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi ilmiah naskah yang akan diidentifikasi oleh editor dan sistem penjodohan peninjau.
          </p>
        </div>

        <Input
          label="Judul Lengkap Naskah Penelitian"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Analisis Kinerja Algoritma Enkripsi Homomorfik pada Arsitektur Edge Computing"
          hint="Maksimal 20 kata, hindari singkatan non-standar."
        />

        <Textarea
          label="Abstrak Naskah"
          name="abstract"
          required
          rows={6}
          value={abstractText}
          onChange={(e) => setAbstractText(e.target.value)}
          placeholder="Tuliskan latar belakang singkat, tujuan, metodologi penelitian, temuan utama, dan kontribusi ilmiah (150–250 kata)..."
          hint="Pastikan dalam teks abstrak ini tidak menyebutkan nama universitas atau nama diri penulis."
        />

        {/* Tag Input Kata Kunci */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Kata Kunci Teknis (Minimal 3, Maksimal 8) <span className="text-rose-500">*</span>
          </label>
          <div className="p-2 border border-slate-300 rounded bg-white flex flex-wrap items-center gap-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
            {keywords.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium border border-slate-200"
              >
                <span>{k}</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(k)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  ×
                </button>
              </span>
            ))}
            {keywords.length < 8 && (
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder={keywords.length === 0 ? "Ketik kata kunci lalu tekan Enter (mis: Edge Computing)" : "Tambah kata kunci..."}
                className="flex-1 min-w-[200px] border-none text-xs focus:outline-none p-1 placeholder-slate-400"
              />
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Tekan Enter atau tanda koma (,) untuk menambahkan kata kunci.
          </p>
        </div>
      </div>

      {/* Bagian 2: Protokol Dual-Upload */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              2. Protokol Unggah Berkas Ganda (Dual-Upload)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Untuk menjaga integritas <em>Double-Blind Peer Review</em>, berkas identitas dan berkas isi naskah diunggah ke partisi penyimpanan yang terpisah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File 1: Title Page */}
          <div className="p-4 bg-slate-50/60 rounded-lg border border-slate-200 space-y-3">
            <div className="font-semibold text-xs text-slate-800 uppercase tracking-wide">
              Berkas 1: Title Page (Beridentitas)
            </div>
            <Dropzone
              label="Halaman Judul & Identitas Penulis"
              description="Memuat judul, nama lengkap semua penulis, afiliasi institusi, email korespondensi, dan ORCID."
              required
              maxSizeMB={10}
              value={titlePageFile}
              onChange={setTitlePageFile}
            />
            <div className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded border border-slate-200">
              🔒 Hanya Editor manusia yang dapat membaca berkas ini. Peninjau tidak memiliki akses sama sekali.
            </div>
          </div>

          {/* File 2: Main Manuscript */}
          <div className="p-4 bg-slate-50/60 rounded-lg border border-slate-200 space-y-3">
            <div className="font-semibold text-xs text-slate-800 uppercase tracking-wide">
              Berkas 2: Main Manuscript (Naskah Anonim)
            </div>
            <Dropzone
              label="Naskah Utama Tanpa Identitas"
              description="Memuat judul, abstrak, dan seluruh batang tubuh naskah tanpa mencantumkan nama atau afiliasi apa pun."
              required
              maxSizeMB={20}
              value={anonManuscriptFile}
              onChange={setAnonManuscriptFile}
            />
            <div className="text-[11px] text-blue-700 bg-blue-50/60 p-2.5 rounded border border-blue-200">
              🛡️ Berkas ini akan diteruskan ke peninjau. Sistem akan memverifikasi ketiadaan metadata identitas.
            </div>
          </div>
        </div>
      </div>

      {/* Bagian 3: Pernyataan Etika & Verifikasi */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
          3. Pernyataan Penulis & Etika Publikasi
        </h2>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeAnonymous}
            onChange={(e) => setAgreeAnonymous(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-700 leading-relaxed">
            Saya mengonfirmasi bahwa berkas <strong>Main Manuscript</strong> telah dibersihkan dari nama penulis, instansi, ucapan terima kasih beridentitas, dan rujukan diri yang dapat mengungkap identitas penulis kepada peninjau.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeOpenAccess}
            onChange={(e) => setAgreeOpenAccess(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-700 leading-relaxed">
            Naskah ini adalah karya orisinal, belum pernah dipublikasikan di jurnal lain, dan bersedia dipublikasikan di bawah lisensi Akses Terbuka (Open Access) jika disetujui dewan redaksi.
          </span>
        </label>
      </div>

      {/* Tombol Aksi */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Batalkan
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="min-w-[180px]"
        >
          <span>Kirim Naskah</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </form>
  );
}
