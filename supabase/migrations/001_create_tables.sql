-- 001_create_tables.sql
-- Inisialisasi skema inti database Pendar JMS

-- Ekstensi pgcrypto untuk UUID jika belum ada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profil Pengguna (terhubung ke auth.users)
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'reviewer', 'admin')),
    full_name TEXT NOT NULL,
    affiliation TEXT,
    orcid_id TEXT,
    expertise_keywords TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Naskah Submisi
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    title_page_url TEXT NOT NULL,
    anon_manuscript_url TEXT NOT NULL,
    final_pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (
        status IN (
            'draft',
            'submitted',
            'pending_ai_verification',
            'identity_leaked',
            'revision_required',
            'waiting_for_reviewer',
            'under_review',
            'revision_needed',
            'approved',
            'published',
            'rejected'
        )
    ),
    ai_verification_result JSONB,
    rejection_reason TEXT,
    volume INT,
    issue INT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Penugasan Reviewer (Peer-Review Assignments)
CREATE TABLE IF NOT EXISTS public.review_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'invited' CHECK (
        status IN (
            'invited',
            'accepted',
            'declined',
            'completed',
            'escalated_unresponsive'
        )
    ),
    due_date TIMESTAMPTZ,
    reminder_count INT NOT NULL DEFAULT 0 CHECK (reminder_count <= 3),
    last_reminded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_assignment UNIQUE (submission_id, reviewer_id)
);

-- 4. Rubrik Penilaian Reviewer
CREATE TABLE IF NOT EXISTS public.reviews_rubric (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.review_assignments(id) ON DELETE CASCADE UNIQUE,
    score_originality INT NOT NULL CHECK (score_originality BETWEEN 1 AND 5),
    score_methodology INT NOT NULL CHECK (score_methodology BETWEEN 1 AND 5),
    score_clarity INT NOT NULL CHECK (score_clarity BETWEEN 1 AND 5),
    score_significance INT NOT NULL CHECK (score_significance BETWEEN 1 AND 5),
    score_references INT NOT NULL CHECK (score_references BETWEEN 1 AND 5),
    comments_for_author TEXT,
    comments_for_editor TEXT,
    recommendation TEXT NOT NULL CHECK (
        recommendation IN ('accept', 'minor_revision', 'major_revision', 'reject')
    ),
    raw_review_pdf_url TEXT,
    clean_review_pdf_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Activity Log (Audit Trail)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'n8n')),
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Pengaturan Jurnal (Single-tenant)
CREATE TABLE IF NOT EXISTS public.journal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_name TEXT NOT NULL DEFAULT 'Pendar: Jurnal Ilmiah',
    journal_issn TEXT,
    journal_eissn TEXT,
    journal_publisher TEXT,
    journal_description TEXT,
    journal_logo_url TEXT,
    journal_cover_url TEXT,
    review_deadline_days INT NOT NULL DEFAULT 14,
    max_reminders INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indeks performa
CREATE INDEX IF NOT EXISTS idx_submissions_author ON public.submissions(author_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_assignments_submission ON public.review_assignments(submission_id);
CREATE INDEX IF NOT EXISTS idx_assignments_reviewer ON public.review_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_submission ON public.activity_log(submission_id);
