// src/app/(dashboard)/admin/pengaturan/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Settings,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Clock,
  Shield,
  Save,
} from 'lucide-react';
import type { JournalSettings } from '@/types';

export default function PengaturanJurnalPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [journalName, setJournalName] = useState('');
  const [journalIssn, setJournalIssn] = useState('');
  const [journalEissn, setJournalEissn] = useState('');
  const [journalPublisher, setJournalPublisher] = useState('');
  const [journalDescription, setJournalDescription] = useState('');
  const [reviewDeadlineDays, setReviewDeadlineDays] = useState(14);
  const [maxReminders, setMaxReminders] = useState(3);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('journal_settings')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          const s = data as JournalSettings;
          setSettingsId(s.id);
          setJournalName(s.journal_name || '');
          setJournalIssn(s.journal_issn || '');
          setJournalEissn(s.journal_eissn || '');
          setJournalPublisher(s.journal_publisher || '');
          setJournalDescription(s.journal_description || '');
          setReviewDeadlineDays(s.review_deadline_days || 14);
          setMaxReminders(s.max_reminders || 3);
        }
      } catch (err) {
        console.error('Gagal memuat setelan jurnal:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [user, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        journal_name: journalName.trim(),
        journal_issn: journalIssn.trim() || null,
        journal_eissn: journalEissn.trim() || null,
        journal_publisher: journalPublisher.trim() || null,
        journal_description: journalDescription.trim() || null,
        review_deadline_days: Number(reviewDeadlineDays),
        max_reminders: Number(maxReminders),
        updated_at: new Date().toISOString(),
      };

      if (settingsId) {
        const { error } = await supabase
          .from('journal_settings')
          .update(payload)
          .eq('id', settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('journal_settings')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      setSuccessMsg('Setelan konfigurasi jurnal berhasil disimpan!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan setelan.';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
              Pengaturan Identitas & Kebijakan Jurnal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Konfigurasi metadata terbitan, nomor indeks ISSN, dan parameter batas waktu redaksi.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 self-start sm:self-auto">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium">Single-Tenant Mode</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Panel 1: Metadata Publikasi Jurnal */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Identitas Publikasi Jurnal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Informasi ini akan ditampilkan pada header halaman portal publik dan meta-tag Google Scholar.
            </p>
          </div>

          <Input
            label="Nama Resmi Jurnal"
            required
            value={journalName}
            onChange={(e) => setJournalName(e.target.value)}
            placeholder="Contoh: Pendar: Jurnal Rekayasa dan Sains Komputasi"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="p-ISSN (Media Cetak)"
              value={journalIssn}
              onChange={(e) => setJournalIssn(e.target.value)}
              placeholder="Contoh: 2988-1234"
              hint="Format: xxxx-xxxx"
            />
            <Input
              label="e-ISSN (Media Elektronik)"
              value={journalEissn}
              onChange={(e) => setJournalEissn(e.target.value)}
              placeholder="Contoh: 2988-5678"
              hint="Format: xxxx-xxxx"
            />
          </div>

          <Input
            label="Lembaga / Universitas Penerbit (Publisher)"
            value={journalPublisher}
            onChange={(e) => setJournalPublisher(e.target.value)}
            placeholder="Contoh: Fakultas Ilmu Komputer, Pendar Academic Press"
          />

          <Textarea
            label="Fokus dan Ruang Lingkup Singkat (Deskripsi)"
            rows={4}
            value={journalDescription}
            onChange={(e) => setJournalDescription(e.target.value)}
            placeholder="Jurnal akses terbuka terindeks ilmiah yang mempublikasikan riset terkini di bidang..."
          />
        </div>

        {/* Panel 2: Batas Waktu & Parameter Otomasi */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Parameter Waktu & Aturan Eskalasi Reviewer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Menentukan batas kesabaran pengingat otomatis dan durasi peninjauan sebelum ditandai eskalasi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Standar Batas Waktu Peninjauan (Hari)"
              type="number"
              min={7}
              max={60}
              value={reviewDeadlineDays}
              onChange={(e) => setReviewDeadlineDays(Number(e.target.value))}
              hint="Batas waktu default saat menugaskan reviewer baru (rekomendasi: 14 hari)."
            />

            <Input
              label="Batas Maksimal Pengingat Teguran (Reminder Kill-Switch)"
              type="number"
              min={1}
              max={5}
              value={maxReminders}
              onChange={(e) => setMaxReminders(Number(e.target.value))}
              hint="Setelah melewati batas ini tanpa respons, status reviewer otomatis dieskalasi (default: 3 kali)."
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isLoading={isSaving} className="min-w-[180px]">
            <Save className="w-4 h-4 mr-1.5" />
            <span>Simpan Pengaturan</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
