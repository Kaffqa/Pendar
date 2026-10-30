// src/app/(public)/page.tsx
import Link from 'next/link';
import { BookOpen, ShieldCheck, Cpu, ArrowRight, ExternalLink, Download } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-slate-50/50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-700 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Sistem Manajemen Jurnal Generasi Baru
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Pendar: Jurnal Rekayasa dan Sains Komputasi
            </h1>

            <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed">
              Platform publikasi ilmiah akses terbuka (Open Access) yang dirancang untuk menjaga integritas akademik mutlak melalui sistem otomatisasi <strong className="font-semibold text-slate-900">Double-Blind Peer Review</strong> dan orkestrasi redaksi pintar.
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
              <div>
                <span className="font-semibold text-slate-700">p-ISSN:</span> 2988-1234
              </div>
              <div>
                <span className="font-semibold text-slate-700">e-ISSN:</span> 2988-5678
              </div>
              <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Terindeks Google Scholar & GARUDA</span>
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
            <div className="p-6 border border-slate-200 rounded-lg bg-white">
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

            <div className="p-6 border border-slate-200 rounded-lg bg-white">
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

            <div className="p-6 border border-slate-200 rounded-lg bg-white">
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

      {/* Terbitan Terbaru (Placeholder / Preview) */}
      <section className="py-16 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Terbitan Terbaru (Volume 1, Nomor 1)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Artikel penelitian mutakhir yang telah melalui proses tinjauan sejawat.
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

          <div className="space-y-4">
            <article className="p-6 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="font-semibold text-slate-700">Artikel Riset</span>
                <span>•</span>
                <span>Vol 1, No 1 (2026)</span>
                <span>•</span>
                <span className="text-emerald-700 font-medium">Open Access</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                <Link href="/arsip">
                  Optimasi Algoritma Penjadwalan Berkelanjutan pada Lingkungan Komputasi Awan Heterogen
                </Link>
              </h3>
              <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                Penelitian ini mengusulkan pendekatan baru dalam optimasi alokasi sumber daya komputasi terdistribusi menggunakan heuristik adaptif guna menekan konsumsi daya hingga 23% tanpa mengorbankan Service Level Agreement (SLA).
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 italic">
                  Penulis: Ir. Budi Santoso, M.Kom., dkk.
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">DOI: 10.5892/pendar.v1i1.001</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
