// src/app/(public)/arsip/page.tsx
import Link from 'next/link';
import { BookOpen, Search, Download, ExternalLink } from 'lucide-react';

export default function ArsipPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-slate-200 pb-8 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Arsip Publikasi Ilmiah
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Semua artikel terbitan Pendar dapat diakses secara penuh, gratis, dan bebas hambatan (Open Access).
        </p>

        {/* Search bar */}
        <div className="mt-6 max-w-xl relative">
          <input
            type="text"
            placeholder="Cari berdasarkan judul, nama penulis, atau kata kunci..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs font-semibold uppercase tracking-wider text-slate-700">
          Volume 1, Nomor 1 (Oktober 2026)
        </div>

        <article className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">Artikel Penelitian</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Open Access PDF</span>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors">
            Optimasi Algoritma Penjadwalan Berkelanjutan pada Lingkungan Komputasi Awan Heterogen
          </h2>

          <div className="text-xs text-slate-600">
            Budi Santoso, Sri Rahayu, Ahmad Fauzan
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Abstrak: Penelitian ini mengusulkan pendekatan baru dalam optimasi alokasi sumber daya komputasi terdistribusi menggunakan heuristik adaptif guna menekan konsumsi daya hingga 23% tanpa mengorbankan Service Level Agreement (SLA).
          </p>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">Halaman 1–12</span>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF (Open Access)</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
