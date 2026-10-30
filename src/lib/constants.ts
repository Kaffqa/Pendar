// src/lib/constants.ts
// Konstanta status, peran, dan label untuk alur Pendar JMS

export const USER_ROLES = {
  AUTHOR: 'author',
  REVIEWER: 'reviewer',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const SUBMISSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PENDING_AI_VERIFICATION: 'pending_ai_verification',
  IDENTITY_LEAKED: 'identity_leaked',
  REVISION_REQUIRED: 'revision_required',
  WAITING_FOR_REVIEWER: 'waiting_for_reviewer',
  UNDER_REVIEW: 'under_review',
  REVISION_NEEDED: 'revision_needed',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
} as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

export const STATUS_LABELS: Record<SubmissionStatus, { label: string; color: string }> = {
  draft: { label: 'Draf', color: 'bg-slate-100 text-slate-700' },
  submitted: { label: 'Terkirim', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending_ai_verification: { label: 'Pemeriksaan AI', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  identity_leaked: { label: 'Kebocoran Identitas', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  revision_required: { label: 'Perlu Revisi Penulis', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  waiting_for_reviewer: { label: 'Menunggu Reviewer', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  under_review: { label: 'Sedang Ditinjau', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  revision_needed: { label: 'Perbaikan Catatan Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Disetujui', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  published: { label: 'Terbit', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  rejected: { label: 'Ditolak', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export const ASSIGNMENT_STATUS = {
  INVITED: 'invited',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  COMPLETED: 'completed',
  ESCALATED_UNRESPONSIVE: 'escalated_unresponsive',
} as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS];

export const ASSIGNMENT_LABELS: Record<AssignmentStatus, { label: string; color: string }> = {
  invited: { label: 'Undangan Terkirim', color: 'bg-blue-50 text-blue-700' },
  accepted: { label: 'Diterima', color: 'bg-purple-50 text-purple-700' },
  declined: { label: 'Ditolak', color: 'bg-slate-100 text-slate-600' },
  completed: { label: 'Selesai Dinilai', color: 'bg-emerald-50 text-emerald-700' },
  escalated_unresponsive: { label: 'Eskalasi (Tidak Merespons)', color: 'bg-rose-100 text-rose-800' },
};

export const RECOMMENDATION = {
  ACCEPT: 'accept',
  MINOR_REVISION: 'minor_revision',
  MAJOR_REVISION: 'major_revision',
  REJECT: 'reject',
} as const;

export type Recommendation = (typeof RECOMMENDATION)[keyof typeof RECOMMENDATION];

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  accept: 'Terima Tanpa Revisi',
  minor_revision: 'Revisi Minor',
  major_revision: 'Revisi Mayor',
  reject: 'Tolak Naskah',
};

export const STORAGE_BUCKETS = {
  TITLE_PAGES: 'title-pages',
  MANUSCRIPTS: 'manuscripts',
  REVIEW_FILES: 'review-files',
  CLEAN_REVIEWS: 'clean-reviews',
  PUBLISHED: 'published',
  ASSETS: 'assets',
} as const;
