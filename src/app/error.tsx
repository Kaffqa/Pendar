'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-red-200 shadow-sm">
        <div className="w-14 h-14 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold font-serif">
          !
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2 font-serif">
          Terjadi Kendala Sistem
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Sistem mengalami galat saat memproses permintaan jurnal Anda. Silakan coba kembali atau kembali ke beranda.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 bg-indigo-900 text-white text-xs font-semibold rounded-lg hover:bg-indigo-800 transition shadow-sm cursor-pointer"
          >
            Muat Ulang Halaman
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition"
          >
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
