// src/app/api/webhook/n8n/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi Authorization Token
    const authHeader = request.headers.get('authorization');
    const secret = process.env.N8N_WEBHOOK_SECRET;

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== secret) {
      return NextResponse.json(
        { error: 'Unauthorized: Kunci otorisasi webhook n8n tidak valid.' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { type } = payload;

    if (!type) {
      return NextResponse.json({ error: 'Payload tidak memiliki atribut "type".' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 2. Tangani berdasarkan jenis event n8n
    switch (type) {
      // 1. Update status naskah setelah verifikasi AI Gatekeeper
      case 'submission_status_update': {
        const { submission_id, status, ai_result } = payload;
        const { error } = await supabase
          .from('submissions')
          .update({
            status,
            ai_verification_result: ai_result || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', submission_id);

        if (error) throw error;

        await supabase.from('activity_log').insert({
          submission_id,
          actor_type: 'n8n',
          action: 'AI_GATEKEEPER_VERIFIED',
          details: { status, ai_result },
        });

        return NextResponse.json({ success: true, message: 'Status naskah berhasil diperbarui oleh AI.' });
      }

      // 2. Penugasan reviewer otomatis oleh AI Semantic Matchmaking
      case 'reviewer_assigned': {
        const { submission_id, reviewer_id, due_date } = payload;
        const { error } = await supabase.from('review_assignments').insert({
          submission_id,
          reviewer_id,
          status: 'invited',
          due_date: due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (error) throw error;

        await supabase
          .from('submissions')
          .update({ status: 'waiting_for_reviewer' })
          .eq('id', submission_id);

        await supabase.from('activity_log').insert({
          submission_id,
          actor_type: 'n8n',
          action: 'AI_MATCHMAKER_ASSIGNED',
          details: { reviewer_id, due_date },
        });

        return NextResponse.json({ success: true, message: 'Reviewer berhasil dipasangkan oleh AI.' });
      }

      // 3. Pengingat terkirim (Reminder Loop)
      case 'reminder_sent': {
        const { assignment_id, reminder_count } = payload;
        const { error } = await supabase
          .from('review_assignments')
          .update({
            reminder_count,
            last_reminded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', assignment_id);

        if (error) throw error;

        await supabase.from('activity_log').insert({
          actor_type: 'n8n',
          action: 'REMINDER_SENT',
          details: { assignment_id, reminder_count },
        });

        return NextResponse.json({ success: true, message: 'Status pengingat berhasil dicatat.' });
      }

      // 4. Eskalasi reviewer pasif (Kill-Switch triggered)
      case 'reviewer_escalated': {
        const { assignment_id } = payload;
        const { error } = await supabase
          .from('review_assignments')
          .update({
            status: 'escalated_unresponsive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', assignment_id);

        if (error) throw error;

        await supabase.from('activity_log').insert({
          actor_type: 'n8n',
          action: 'REVIEWER_ESCALATED',
          details: { assignment_id, reason: 'Tiga kali teguran tanpa respons' },
        });

        return NextResponse.json({ success: true, message: 'Reviewer berhasil dieskalasi ke dasbor admin.' });
      }

      // 5. Berkas PDF koreksi berhasil disanitasi (Digital Footprint Scrubber)
      case 'review_pdf_scrubbed': {
        const { assignment_id, clean_pdf_url } = payload;
        const { error } = await supabase
          .from('reviews_rubric')
          .update({ clean_review_pdf_url: clean_pdf_url })
          .eq('assignment_id', assignment_id);

        if (error) throw error;

        await supabase.from('activity_log').insert({
          actor_type: 'n8n',
          action: 'PDF_METADATA_SCRUBBED',
          details: { assignment_id, clean_pdf_url },
        });

        return NextResponse.json({ success: true, message: 'PDF bersih metadata berhasil disimpan.' });
      }

      // 6. Naskah final terbit otomatis
      case 'submission_published': {
        const { submission_id, final_pdf_url, volume, issue } = payload;
        const { error } = await supabase
          .from('submissions')
          .update({
            status: 'published',
            final_pdf_url,
            volume: volume || 1,
            issue: issue || 1,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', submission_id);

        if (error) throw error;

        await supabase.from('activity_log').insert({
          submission_id,
          actor_type: 'n8n',
          action: 'SUBMISSION_PUBLISHED_AUTOMATION',
          details: { volume, issue, final_pdf_url },
        });

        return NextResponse.json({ success: true, message: 'Naskah resmi diterbitkan secara otomatis.' });
      }

      default:
        return NextResponse.json({ error: `Tipe webhook "${type}" tidak dikenal.` }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kesalahan server internal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
