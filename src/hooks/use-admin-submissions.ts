// src/hooks/use-admin-submissions.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Submission, UserProfile } from '@/types';

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
      // 1. Ambil seluruh data submisi
      const { data: subsData, error: subsError } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      const rawSubmissions = (subsData as Submission[]) || [];

      if (rawSubmissions.length === 0) {
        setSubmissions([]);
        setIsLoading(false);
        return;
      }

      // 2. Ambil profil penulis yang terkait
      const authorIds = [...new Set(rawSubmissions.map((s) => s.author_id))];
      const { data: profilesData } = await supabase
        .from('users_profile')
        .select('id, full_name, email, affiliation')
        .in('id', authorIds);

      const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

      // 3. Gabungkan data naskah dengan profil penulis
      const combined = rawSubmissions.map((sub) => ({
        ...sub,
        author: profileMap.get(sub.author_id) as Pick<UserProfile, 'full_name' | 'email' | 'affiliation'> || undefined,
      }));

      setSubmissions(combined);
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

    // Realtime subscription untuk mendengarkan perubahan naskah
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
