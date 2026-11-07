import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sesi tidak valid / belum login.' }, { status: 401 });
    }

    const { submissionId, status, action, details } = await request.json();

    if (!submissionId || !status) {
      return NextResponse.json({ error: 'Parameter submissionId dan status wajib disertakan.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Cek role pengguna
    const { data: profile } = await adminSupabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // 2. Cek apakah user adalah reviewer yang ditugaskan pada naskah ini
    const { data: assignment } = await adminSupabase
      .from('review_assignments')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('reviewer_id', user.id)
      .maybeSingle();

    const isAssignedReviewer = !!assignment;

    // 3. Cek apakah user adalah pemilik naskah (author)
    const { data: sub } = await adminSupabase
      .from('submissions')
      .select('author_id')
      .eq('id', submissionId)
      .single();

    const isAuthor = sub?.author_id === user.id;

    if (!isAdmin && !isAssignedReviewer && !isAuthor) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki hak akses untuk memperbarui status naskah ini.' },
        { status: 403 }
      );
    }

    // 4. Perbarui status naskah dengan kredensial service role
    const { error: updateErr } = await adminSupabase
      .from('submissions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateErr) throw updateErr;

    // 5. Catat ke activity_log jika parameter action disertakan
    if (action) {
      await adminSupabase.from('activity_log').insert({
        submission_id: submissionId,
        actor_id: user.id,
        actor_type: 'user',
        action,
        details: details || {},
      });
    }

    return NextResponse.json({ success: true, newStatus: status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
