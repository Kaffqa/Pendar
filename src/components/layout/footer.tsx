// src/components/layout/footer.tsx
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-white font-semibold text-lg tracking-tight">
              <span className="p-1 bg-blue-600 rounded text-white">
                <BookOpen className="w-4 h-4" />
              </span>
              Pendar
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-slate-400 max-w-sm">
              Sistem Manajemen Jurnal (JMS) generasi baru berbasis kecerdasan buatan. Mengedepankan integritas akademik mutlak melalui otomatisasi Double-Blind Peer Review dan pengawasan berdaya human-in-the-loop.
            </p>
            <div className="mt-4 text-xs font-mono text-slate-400">
              ISSN Cetak: 2988-1234 • ISSN Elektronik: 2988-5678
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Navigasi Jurnal
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/arsip" className="hover:text-white transition-colors">
                  Arsip Terbitan
                </Link>
              </li>
              <li>
                <Link href="/panduan" className="hover:text-white transition-colors">
                  Panduan & Format Penulisan
                </Link>
              </li>
              <li>
                <Link href="/tentang" className="hover:text-white transition-colors">
                  Dewan Redaksi & Editor
                </Link>
              </li>
              <li>
                <Link href="/tentang" className="hover:text-white transition-colors">
                  Kebijakan Open Access & Etika
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Akses Portal
            </h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/masuk" className="hover:text-white transition-colors">
                  Masuk Redaksi
                </Link>
              </li>
              <li>
                <Link href="/daftar" className="hover:text-white transition-colors">
                  Registrasi Penulis / Reviewer
                </Link>
              </li>
              <li>
                <Link href="/penulis/kirim" className="hover:text-white transition-colors">
                  Kirim Naskah Baru
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© 2026 Pendar Academic Press. Seluruh hak cipta dilindungi.</p>
          <p className="mt-2 sm:mt-0 font-light">Open Access Journal Management System</p>
        </div>
      </div>
    </footer>
  );
}
