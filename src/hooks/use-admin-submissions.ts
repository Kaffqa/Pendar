// src/hooks/use-admin-submissions.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Submission } from '@/types';

export function useAdminSubmissions() {
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
      // Admin berhak membaca semua naskah beserta data profil author
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          author:users_profile!author_id (
            full_name,
            email,
            affiliation
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubmissions((data as Submission[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat naskah redaksi.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchSubmissions();

    if (!user) return;

    // Realtime subscription untuk mendengarkan perubahan pada seluruh naskah
    const channel = supabase
      .channel('admin-all-submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
        },
        () => {
          fetchSubmissions();
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
