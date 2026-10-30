// src/hooks/use-submissions.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Submission } from '@/types';

export function useSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSubmissions((data as Submission[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar naskah.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchSubmissions();

    if (!user) return;

    // Supabase Realtime Subscription untuk mendengarkan perubahan status naskah secara langsung
    const channel = supabase
      .channel(`author-submissions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `author_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSubmissions((prev) => [payload.new as Submission, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSubmissions((prev) =>
              prev.map((sub) => (sub.id === payload.new.id ? (payload.new as Submission) : sub))
            );
          } else if (payload.eventType === 'DELETE') {
            setSubmissions((prev) => prev.filter((sub) => sub.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchSubmissions]);

  return {
    submissions,
    isLoading,
    error,
    refetch: fetchSubmissions,
  };
}
