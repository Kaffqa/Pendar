// src/app/(auth)/masuk/page.tsx
'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

function MasukForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Email atau kata sandi tidak sesuai.'
            : error.message
        );
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || 'author';
        if (redirectPath) {
          router.push(redirectPath);
        } else if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'reviewer') {
          router.push('/peninjau');
        } else {
          router.push('/penulis');
        }
        router.refresh();
      }
    } catch {
      setErrorMsg('Terjadi kendala jaringan. Silakan coba kembali.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-lg sm:px-10">
      {errorMsg && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Alamat Email
          </label>
          <div className="mt-1.5">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@kampus.ac.id"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Kata Sandi
          </label>
          <div className="mt-1.5">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MasukPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
          <span className="p-2 bg-slate-900 text-white rounded">
            <BookOpen className="w-5 h-5" />
          </span>
          Pendar
        </Link>
        <h2 className="mt-6 text-xl font-medium tracking-tight text-slate-900">
          Masuk ke Portal Redaksi
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Belum memiliki akun?{' '}
          <Link href="/daftar" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat formulir...</div>}>
          <MasukForm />
        </Suspense>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Sistem Manajemen Jurnal Berbasis Integritas Double-Blind Peer Review</p>
        </div>
      </div>
    </div>
  );
}
