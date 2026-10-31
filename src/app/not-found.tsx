import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold font-serif">
          404
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2 font-serif">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Naskah, arsip, atau halaman administratif yang Anda cari tidak tersedia atau tautan telah kedaluwarsa.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2.5 bg-indigo-900 text-white text-xs font-semibold rounded-lg hover:bg-indigo-800 transition shadow-sm"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/arsip"
            className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
          >
            Jelajahi Arsip
          </Link>
        </div>
      </div>
    </div>
  );
}
