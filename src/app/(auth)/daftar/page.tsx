// src/app/(auth)/daftar/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function DaftarPage() {
  const [role, setRole] = useState<'author' | 'reviewer'>('author');
  const [fullName, setFullName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
            affiliation,
            orcid_id: orcidId || null,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Berhasil daftar -> arahkan ke halaman dasbor yang sesuai
        if (role === 'reviewer') {
          router.push('/peninjau');
        } else {
          router.push('/penulis');
        }
        router.refresh();
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan. Silakan ulangi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
          <span className="p-2 bg-slate-900 text-white rounded">
            <BookOpen className="w-5 h-5" />
          </span>
          Pendar
        </Link>
        <h2 className="mt-6 text-xl font-medium tracking-tight text-slate-900">
          Pendaftaran Akun Sivitas Akademika
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sudah memiliki akun?{' '}
          <Link href="/masuk" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            Masuk sekarang
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-lg sm:px-10">
          {errorMsg && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleRegister}>
            {/* Pilihan Peran */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Daftar Sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('author')}
                  className={`p-3 text-left border rounded text-sm font-medium transition-colors flex items-center justify-between ${
                    role === 'author'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Penulis / Peneliti</div>
                    <div className="text-xs text-slate-500 mt-0.5">Kirim naskah ilmiah</div>
                  </div>
                  {role === 'author' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setRole('reviewer')}
                  className={`p-3 text-left border rounded text-sm font-medium transition-colors flex items-center justify-between ${
                    role === 'reviewer'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Peninjau Ahli</div>
                    <div className="text-xs text-slate-500 mt-0.5">Tinjau naskah anonim</div>
                  </div>
                  {role === 'reviewer' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Nama Lengkap (disertai gelar)
              </label>
              <div className="mt-1.5">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Hendra Gunawan, M.T."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="affiliation" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Afiliasi / Universitas / Lembaga
              </label>
              <div className="mt-1.5">
                <input
                  id="affiliation"
                  name="affiliation"
                  type="text"
                  required
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="Fakultas Ilmu Komputer, Universitas Indonesia"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="orcidId" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                ORCID iD <span className="text-slate-400 font-normal lowercase">(opsional)</span>
              </label>
              <div className="mt-1.5">
                <input
                  id="orcidId"
                  name="orcidId"
                  type="text"
                  value={orcidId}
                  onChange={(e) => setOrcidId(e.target.value)}
                  placeholder="0000-0002-1825-0097"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Alamat Email (diutamakan email institusi)
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
                  placeholder="hendra@ui.ac.id"
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
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
                    Mendaftarkan Akun...
                  </>
                ) : (
                  <>
                    Daftar Sekarang
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
