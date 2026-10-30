// src/app/(dashboard)/admin/log/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Activity,
  Search,
  Filter,
  Bot,
  User,
  Cpu,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import type { ActivityLog, UserProfile } from '@/types';

export default function AdminAuditLogPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actorFilter, setActorFilter] = useState<'all' | 'user' | 'n8n' | 'system'>('all');

  useEffect(() => {
    async function loadLogs() {
      if (!user) return;
      setIsLoading(true);

      try {
        const { data: logsData, error } = await supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        const rawLogs = (logsData as ActivityLog[]) || [];
        const actorIds = [...new Set(rawLogs.map((l) => l.actor_id).filter(Boolean))] as string[];

        if (actorIds.length > 0) {
          const { data: actorsData } = await supabase
            .from('users_profile')
            .select('id, full_name, email')
            .in('id', actorIds);

          const actorMap = new Map((actorsData || []).map((a) => [a.id, a]));
          const combined = rawLogs.map((l) => ({
            ...l,
            actor: l.actor_id ? actorMap.get(l.actor_id) as Pick<UserProfile, 'full_name' | 'email'> : undefined,
          }));
          setLogs(combined);
        } else {
          setLogs(rawLogs);
        }
      } catch (err) {
        console.error('Gagal memuat audit log:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadLogs();
  }, [user, supabase]);

  const filteredLogs = logs.filter((log) => {
    const matchesActor = actorFilter === 'all' || log.actor_type === actorFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.submission_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false;

    return matchesActor && (searchQuery ? matchesSearch : true);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dasbor Editor</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Audit Trail & Riwayat Aktivitas Redaksi
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Catatan kronologis seluruh interaksi pengguna, dewan editor, dan orkestrasi robot n8n/AI.
            </p>
          </div>

          <div className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
            Log Tercatat: <strong className="text-slate-900">{logs.length} Peristiwa</strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActorFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              actorFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua Aktor ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActorFilter('user')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              actorFilter === 'user'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pengguna Manusia ({logs.filter((l) => l.actor_type === 'user').length})
          </button>
          <button
            type="button"
            onClick={() => setActorFilter('n8n')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              actorFilter === 'n8n'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Orkestrator n8n ({logs.filter((l) => l.actor_type === 'n8n').length})
          </button>
          <button
            type="button"
            onClick={() => setActorFilter('system')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              actorFilter === 'system'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sistem Database ({logs.filter((l) => l.actor_type === 'system').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aksi, ID naskah, atau aktor..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Tabel Log */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">Belum Ada Catatan Log</h3>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat akan terisi secara otomatis seiring interaksi pengguna dan n8n di platform.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-200">
            {filteredLogs.map((log) => {
              const logDate = new Date(log.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Aktor Badge */}
                      {log.actor_type === 'n8n' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Bot className="w-3 h-3 text-indigo-600" />
                          <span>n8n / AI Bot</span>
                        </span>
                      ) : log.actor_type === 'system' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <Cpu className="w-3 h-3" />
                          <span>Sistem DB</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <User className="w-3 h-3" />
                          <span>{log.actor?.full_name || 'Pengguna'}</span>
                        </span>
                      )}

                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {log.action}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{logDate}</span>
                    </div>
                  </div>

                  {/* Submission link & details JSON */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    {log.submission_id ? (
                      <Link
                        href={`/admin/naskah/${log.submission_id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono text-[11px]"
                      >
                        <span>Naskah ID: {log.submission_id.slice(0, 8)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Tidak terkait naskah spesifik</span>
                    )}

                    {log.details && (
                      <details className="text-[11px] text-slate-600">
                        <summary className="cursor-pointer hover:text-slate-900 font-medium">
                          Lihat Rincian Data (JSON)
                        </summary>
                        <pre className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-700 overflow-x-auto max-w-lg">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
