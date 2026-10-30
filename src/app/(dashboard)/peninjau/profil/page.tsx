// src/app/(dashboard)/peninjau/profil/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Tag,
  ShieldCheck,
  Moon,
  Sun,
  Loader2,
} from 'lucide-react';

export default function ProfilReviewerPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [isAvailable, setIsAvailable] = useState(true);
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [orcidId, setOrcidId] = useState('');
  const [affiliation, setAffiliation] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Muat data profil saat komponen siap
  useEffect(() => {
    if (profile) {
      setIsAvailable(profile.is_available ?? true);
      setKeywords(profile.expertise_keywords || []);
      setOrcidId(profile.orcid_id || '');
      setAffiliation(profile.affiliation || '');
    }
  }, [profile]);

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = keywordInput.trim().replace(/^,+|,+$/g, '');
      if (val && !keywords.includes(val) && keywords.length < 15) {
        setKeywords([...keywords, val]);
        setKeywordInput('');
      }
    }
  };

  const removeKeyword = (tagToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setSavedSuccess(false);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('users_profile')
        .update({
          is_available: isAvailable,
          expertise_keywords: keywords,
          orcid_id: orcidId.trim() || null,
          affiliation: affiliation.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back link */}
      <div>
        <Link
          href="/peninjau"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dasbor Peninjau</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Profil Kepakaran & Ketersediaan Review
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Atur bidang kepakaran Anda untuk pencocokan naskah otomatis dan kelola status ketersediaan.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 self-start sm:self-auto">
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium">Identitas Terlindungi (Double-Blind)</span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Perubahan profil dan status ketersediaan berhasil disimpan!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Panel 1: Sakelar Mode Cuti */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Status Ketersediaan Peninjauan (Mode Cuti)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kendalikan apakah sistem penjodohan redaksi dapat mengirimkan naskah baru kepada Anda.
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isAvailable}
              onClick={() => setIsAvailable(!isAvailable)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                isAvailable ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isAvailable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div
            className={`p-4 rounded-lg border text-xs leading-relaxed flex items-start gap-3 ${
              isAvailable
                ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            {isAvailable ? (
              <>
                <Sun className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Mode Aktif (Siap Meninjau)</div>
                  <div className="mt-0.5">
                    Sistem redaksi dan AI Matchmaker dapat menugaskan naskah yang relevan dengan topik kepakaran Anda.
                  </div>
                </div>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Mode Cuti Aktif (Sedang Berhalangan)</div>
                  <div className="mt-0.5">
                    Anda <strong>tidak akan menerima</strong> undangan peninjauan naskah baru sampai Anda mengaktifkan kembali sakelar ini. Tugas yang sedang berjalan tetap harus diselesaikan.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Panel 2: Kata Kunci Kepakaran Ilmiah */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Kata Kunci Kepakaran (Expertise Keywords)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              AI Semantic Matchmaking menggunakan kata kunci ini untuk mencocokkan naskah yang paling presisi dengan bidang riset Anda.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Daftar Topik Keahlian (Minimal 3 kata kunci)
            </label>
            <div className="p-2.5 border border-slate-300 rounded bg-white flex flex-wrap items-center gap-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
              {keywords.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium border border-slate-200"
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{k}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyword(k)}
                    className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {keywords.length < 15 && (
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  placeholder={
                    keywords.length === 0
                      ? 'Ketik kepakaran lalu tekan Enter (contoh: Machine Learning, Cloud Security)'
                      : 'Tambah kepakaran...'
                  }
                  className="flex-1 min-w-[220px] border-none text-xs focus:outline-none p-1 placeholder-slate-400"
                />
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Tekan Enter atau tanda koma (,) untuk menambahkan kata kunci. Masukkan topik spesifik (misal: <em>Natural Language Processing</em>, <em>Cryptography</em>, <em>Distributed Systems</em>).
            </p>
          </div>
        </div>

        {/* Panel 3: Identitas Akademik Reviewer */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Identitas & Afiliasi Akademik
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data ini hanya dapat dilihat oleh Dewan Editor. Penulis tidak pernah melihat informasi ini.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Institusi / Universitas"
              name="affiliation"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="Contoh: Universitas Gadjah Mada"
            />

            <Input
              label="ORCID iD (16 Digit)"
              name="orcidId"
              value={orcidId}
              onChange={(e) => setOrcidId(e.target.value)}
              placeholder="0000-0002-1825-0097"
              hint="Format: xxxx-xxxx-xxxx-xxxx"
            />
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isLoading={isLoading} className="min-w-[160px]">
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
