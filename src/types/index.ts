// src/types/index.ts
// Tipe TypeScript untuk entitas database Pendar

import { UserRole, SubmissionStatus, AssignmentStatus, Recommendation } from '@/lib/constants';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  affiliation?: string | null;
  orcid_id?: string | null;
  expertise_keywords: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  author_id: string;
  title: string;
  abstract: string;
  keywords: string[];
  title_page_url: string;
  anon_manuscript_url: string;
  final_pdf_url?: string | null;
  status: SubmissionStatus;
  ai_verification_result?: {
    is_identity_leaked?: boolean;
    leaked_details?: string;
    extracted_keywords?: string[];
  } | null;
  rejection_reason?: string | null;
  volume?: number | null;
  issue?: number | null;
  submitted_at: string;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  // Relasi tambahan saat di-join
  author?: Pick<UserProfile, 'full_name' | 'email' | 'affiliation' | 'orcid_id'>;
}

export interface ReviewAssignment {
  id: string;
  submission_id: string;
  reviewer_id: string;
  status: AssignmentStatus;
  due_date?: string | null;
  reminder_count: number;
  last_reminded_at?: string | null;
  created_at: string;
  updated_at: string;
  // Relasi tambahan saat di-join
  submission?: Pick<Submission, 'id' | 'title' | 'abstract' | 'keywords' | 'anon_manuscript_url'>;
  reviewer?: Pick<UserProfile, 'id' | 'full_name' | 'email' | 'expertise_keywords'>;
}

export interface ReviewRubric {
  id: string;
  assignment_id: string;
  score_originality: number;
  score_methodology: number;
  score_clarity: number;
  score_significance: number;
  score_references: number;
  comments_for_author?: string | null;
  comments_for_editor?: string | null;
  recommendation: Recommendation;
  raw_review_pdf_url?: string | null;
  clean_review_pdf_url?: string | null;
  submitted_at: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  submission_id?: string | null;
  actor_id?: string | null;
  actor_type: 'user' | 'system' | 'n8n';
  action: string;
  details?: Record<string, unknown> | null;
  created_at: string;
  actor?: Pick<UserProfile, 'full_name' | 'email'>;
}

export interface JournalSettings {
  id: string;
  journal_name: string;
  journal_issn?: string | null;
  journal_eissn?: string | null;
  journal_publisher?: string | null;
  journal_description?: string | null;
  journal_logo_url?: string | null;
  journal_cover_url?: string | null;
  review_deadline_days: number;
  max_reminders: number;
  created_at: string;
  updated_at: string;
}
