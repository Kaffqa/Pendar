// src/components/layout/navbar.tsx
import Link from 'next/link';
import { BookOpen, LogIn, Send } from 'lucide-react';

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-slate-900">
            <span className="p-1.5 bg-slate-900 text-white rounded">
              <BookOpen className="w-5 h-5" />
            </span>
            Pendar
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Beranda
            </Link>
            <Link href="/arsip" className="hover:text-slate-900 transition-colors">
              Arsip Artikel
            </Link>
            <Link href="/panduan" className="hover:text-slate-900 transition-colors">
              Panduan Penulis
            </Link>
            <Link href="/tentang" className="hover:text-slate-900 transition-colors">
              Tentang Jurnal
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/masuk"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk</span>
          </Link>

          <Link
            href="/penulis/kirim"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Naskah</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
