// src/components/shared/status-timeline.tsx
import React from 'react';
import { SubmissionStatus } from '@/lib/constants';
import { Check, Clock, AlertTriangle, XCircle, FileCheck2 } from 'lucide-react';

export interface StatusTimelineProps {
  status: SubmissionStatus;
}

interface Step {
  id: string;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'submitted', label: 'Pengiriman Berkas', description: 'Dual-Upload terverifikasi di server' },
  { id: 'ai_check', label: 'Gatekeeper Anonimitas', description: 'Pemeriksaan kebocoran identitas naskah' },
  { id: 'peer_review', label: 'Double-Blind Review', description: 'Penilaian independen peninjau ahli' },
  { id: 'editorial', label: 'Keputusan Redaksi', description: 'Evaluasi dewan editor & persetujuan' },
  { id: 'published', label: 'Terbit Open Access', description: 'Naskah resmi tayang di portal publik' },
];

export function StatusTimeline({ status }: StatusTimelineProps) {
  // Tentukan indeks langkah aktif (0 hingga 4)
  let activeStepIndex = 0;
  let isFailed = false;
  let isRevision = false;

  switch (status) {
    case 'draft':
    case 'submitted':
      activeStepIndex = 0;
      break;
    case 'pending_ai_verification':
      activeStepIndex = 1;
      break;
    case 'identity_leaked':
    case 'revision_required':
      activeStepIndex = 1;
      isRevision = true;
      break;
    case 'waiting_for_reviewer':
    case 'under_review':
      activeStepIndex = 2;
      break;
    case 'revision_needed':
      activeStepIndex = 2;
      isRevision = true;
      break;
    case 'approved':
      activeStepIndex = 3;
      break;
    case 'published':
      activeStepIndex = 4;
      break;
    case 'rejected':
      isFailed = true;
      break;
    default:
      activeStepIndex = 0;
  }

  return (
    <div className="w-full py-4">
      <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-2">
        {STEPS.map((step, idx) => {
          const isCompleted = !isFailed && idx < activeStepIndex;
          const isCurrent = !isFailed && idx === activeStepIndex;
          const isUpcoming = idx > activeStepIndex;

          return (
            <div key={step.id} className="flex-1 flex md:flex-col items-start md:items-center text-left md:text-center relative">
              {/* Connector line for desktop */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`hidden md:block absolute top-4 left-1/2 w-full h-0.5 -z-0 ${
                    idx < activeStepIndex ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Step indicator circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 z-10 transition-colors ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                    ? isRevision
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                      : 'bg-slate-900 text-white ring-4 ring-slate-100'
                    : isFailed && idx === activeStepIndex
                    ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                    : 'bg-slate-100 border border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent && isRevision ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 animate-pulse" />
                ) : isFailed && idx === activeStepIndex ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step label & description */}
              <div className="ml-3 md:ml-0 md:mt-2.5">
                <div
                  className={`text-xs font-semibold ${
                    isCurrent
                      ? isRevision
                        ? 'text-amber-700 font-bold'
                        : 'text-slate-900 font-bold'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5 max-w-[140px] md:mx-auto">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
