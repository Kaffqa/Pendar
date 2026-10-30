// src/hooks/use-auth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (user) {
          const { data } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data) setProfile(data as UserProfile);
        }
      } catch (err) {
        console.error('Gagal memuat status autentikasi:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from('users_profile')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (data) setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }

      if (event === 'SIGNED_OUT') {
        router.push('/masuk');
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/masuk');
    router.refresh();
  };

  return {
    user,
    profile,
    role: profile?.role ?? null,
    isLoading,
    signOut,
  };
}
