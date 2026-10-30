// src/lib/supabase/middleware.ts
// Middleware pembantu untuk menyegarkan sesi auth Supabase dan otorisasi rute

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtectedPath =
    path.startsWith('/penulis') || path.startsWith('/peninjau') || path.startsWith('/admin');
  const isAuthPath = path === '/masuk' || path === '/daftar';

  // 1. Jika rute terlindungi dan pengguna belum login -> alihkan ke /masuk
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/masuk';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // 2. Jika pengguna sudah login, periksa peran untuk rute yang sesuai
  if (user) {
    // Ambil data profil pengguna untuk rute otorisasi
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'author';

    // Jika pengguna sudah login mencoba akses /masuk atau /daftar -> alihkan ke dasbornya
    if (isAuthPath) {
      const url = request.nextUrl.clone();
      if (role === 'admin') url.pathname = '/admin';
      else if (role === 'reviewer') url.pathname = '/peninjau';
      else url.pathname = '/penulis';
      return NextResponse.redirect(url);
    }

    // Pembatasan akses silang peran:
    if (path.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'reviewer' ? '/peninjau' : '/penulis';
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/peninjau') && role !== 'reviewer' && role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/penulis';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
