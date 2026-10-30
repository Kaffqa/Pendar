// src/app/(public)/panduan/page.tsx
import Link from 'next/link';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PanduanPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-slate-200 pb-8 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Panduan Penulis & Protokol Anonimitas
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Standar persiapan berkas submisi untuk menjamin integritas Double-Blind Peer Review di Pendar.
        </p>
      </div>

      <div className="space-y-8 text-sm text-slate-700">
        <section className="p-6 bg-blue-50/50 border border-blue-200 rounded-lg">
          <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Wajib: Alur Unggah Berkas Ganda (Dual-Upload)
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-blue-800">
            Penulis diwajibkan menyiapkan dua dokumen PDF terpisah saat melakukan pengiriman naskah:
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded border border-blue-200">
              <div className="font-semibold text-xs uppercase tracking-wider text-slate-800">
                Berkas 1: Title Page (Halaman Judul)
              </div>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                <li>Judul lengkap penelitian</li>
                <li>Nama seluruh penulis & afiliasi kampus</li>
                <li>Email korespondensi & ORCID iD</li>
                <li>Pernyataan pendanaan & ucapan terima kasih</li>
              </ul>
            </div>

            <div className="p-4 bg-white rounded border border-blue-200">
              <div className="font-semibold text-xs uppercase tracking-wider text-slate-800">
                Berkas 2: Main Manuscript (Naskah Anonim)
              </div>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                <li>Judul, Abstrak, dan Kata Kunci</li>
                <li>Pendahuluan hingga Daftar Pustaka</li>
                <li><strong>Wajib tanpa nama dan tanpa afiliasi</strong></li>
                <li>Hapus rujukan diri eksplisit (misal: "pada studi kami sebelumnya...")</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Pemeriksaan Otomatis Zero-Leak Gatekeeper
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sebelum naskah diteruskan ke dewan redaksi atau calon peninjau, sistem Pendar memindai isi naskah anonim. Jika terdeteksi penyebutan nama universitas, nama personal penulis, atau data identitas tersembunyi, naskah akan langsung dikembalikan dengan instruksi perbaikan.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Struktur Naskah Standar
          </h2>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
            <li><strong>Judul:</strong> Lugas, spesifik, maksimal 16 kata.</li>
            <li><strong>Abstrak:</strong> 150–250 kata merangkum latar belakang, metode, hasil utama, dan kontribusi.</li>
            <li><strong>Kata Kunci:</strong> 3–5 frasa teknis.</li>
            <li><strong>Metodologi:</strong> Dapat direplikasi dan dijelaskan secara sistematis.</li>
            <li><strong>Daftar Pustaka:</strong> Menggunakan gaya sitasi IEEE atau APA edisi terbaru.</li>
          </ol>
        </section>

        <div className="pt-6 border-t border-slate-200">
          <Link
            href="/penulis/kirim"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <span>Kirim Naskah Sekarang</span>
            <CheckCircle2 className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
