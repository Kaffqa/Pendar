// src/hooks/use-reviewer-assignments.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { ReviewAssignment } from '@/types';
import { ASSIGNMENT_STATUS } from '@/lib/constants';

export function useReviewerAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchAssignments = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      // Ambil tugas penugasan beserta data naskah anonim (tanpa identitas author)
      const { data, error } = await supabase
        .from('review_assignments')
        .select(`
          *,
          submission:submissions (
            id,
            title,
            abstract,
            keywords,
            anon_manuscript_url
          )
        `)
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssignments((data as ReviewAssignment[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat tugas review.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchAssignments();

    if (!user) return;

    // Realtime subscription untuk mendengarkan penugasan baru atau update batas waktu
    const channel = supabase
      .channel(`reviewer-assignments-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'review_assignments',
          filter: `reviewer_id=eq.${user.id}`,
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchAssignments]);

  // Handler Terima Tugas Review
  const acceptAssignment = async (assignmentId: string, submissionId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('review_assignments')
        .update({
          status: ASSIGNMENT_STATUS.ACCEPTED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .eq('reviewer_id', user.id);

      if (error) throw error;

      // Update status naskah di submissions menjadi under_review via secure API (bypassing RLS)
      await fetch('/api/submissions/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          status: 'under_review',
          action: 'REVIEWER_ACCEPTED',
          details: { assignment_id: assignmentId },
        }),
      });

      await fetchAssignments();
    } catch (err: unknown) {
      alert('Gagal menerima tugas: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  // Handler Tolak Tugas Review
  const declineAssignment = async (assignmentId: string, submissionId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('review_assignments')
        .update({
          status: ASSIGNMENT_STATUS.DECLINED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .eq('reviewer_id', user.id);

      if (error) throw error;

      await supabase.from('activity_log').insert({
        submission_id: submissionId,
        actor_id: user.id,
        actor_type: 'user',
        action: 'REVIEWER_DECLINED',
        details: { assignment_id: assignmentId },
      });

      await fetchAssignments();
    } catch (err: unknown) {
      alert('Gagal menolak tugas: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  return {
    assignments,
    isLoading,
    error,
    acceptAssignment,
    declineAssignment,
    refetch: fetchAssignments,
  };
}
