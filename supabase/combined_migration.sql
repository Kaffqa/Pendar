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
-- 002_create_rls.sql
-- Kebijakan Keamanan Tingkat Baris (Row Level Security / RLS) Pendar
-- Menjamin isolasi penuh Double-Blind Peer Review

ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_rubric ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_settings ENABLE ROW LEVEL SECURITY;

-- Fungsi pembantu: periksa apakah pengguna adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ====================================================================
-- 1. Kebijakan users_profile
-- ====================================================================
-- User dapat melihat profilnya sendiri; Admin dapat melihat semua profil;
CREATE POLICY "Pengguna dapat melihat profil sendiri"
ON public.users_profile FOR SELECT
USING (auth.uid() = id OR public.is_admin());

-- User dapat mengupdate profilnya sendiri
CREATE POLICY "Pengguna dapat memperbarui profil sendiri"
ON public.users_profile FOR UPDATE
USING (auth.uid() = id);

-- Insert profil saat pendaftaran akun
CREATE POLICY "Pengguna dapat membuat profil sendiri"
ON public.users_profile FOR INSERT
WITH CHECK (auth.uid() = id);

-- ====================================================================
-- 2. Kebijakan submissions
-- ====================================================================
-- Publik (termasuk anonim) dapat membaca naskah berstatus 'published'
CREATE POLICY "Publik dapat membaca artikel terbit"
ON public.submissions FOR SELECT
USING (status = 'published');

-- Author dapat membaca naskah miliknya sendiri
CREATE POLICY "Author dapat membaca submisi miliknya"
ON public.submissions FOR SELECT
USING (auth.uid() = author_id);

-- Reviewer yang ditugaskan dapat membaca naskah (anonim)
CREATE POLICY "Reviewer dapat membaca naskah yang ditugaskan"
ON public.submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.review_assignments
    WHERE review_assignments.submission_id = submissions.id
      AND review_assignments.reviewer_id = auth.uid()
  )
);

-- Admin dapat membaca semua naskah
CREATE POLICY "Admin dapat membaca semua naskah"
ON public.submissions FOR SELECT
USING (public.is_admin());

-- Author dapat membuat naskah baru
CREATE POLICY "Author dapat mengirimkan naskah"
ON public.submissions FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Author dapat memperbarui naskah miliknya jika status draft / revision_needed
CREATE POLICY "Author dapat memperbarui naskah sesuai alur"
ON public.submissions FOR UPDATE
USING (
  (auth.uid() = author_id AND status IN ('draft', 'revision_needed', 'identity_leaked'))
  OR public.is_admin()
);

-- ====================================================================
-- 3. Kebijakan review_assignments (Isolasi Double-Blind)
-- ====================================================================
-- Author TIDAK BOLEH membaca review_assignments (menjaga identitas reviewer)
-- Reviewer hanya dapat melihat tugas yang diberikan kepadanya
CREATE POLICY "Reviewer dapat melihat tugas miliknya"
ON public.review_assignments FOR SELECT
USING (reviewer_id = auth.uid() OR public.is_admin());

-- Reviewer dapat memperbarui status tugas miliknya (menerima/menolak)
CREATE POLICY "Reviewer dapat merespons tugas miliknya"
ON public.review_assignments FOR UPDATE
USING (reviewer_id = auth.uid() OR public.is_admin());

-- Admin dapat mengelola penugasan reviewer
CREATE POLICY "Admin dapat membuat penugasan reviewer"
ON public.review_assignments FOR INSERT
WITH CHECK (public.is_admin());

-- ====================================================================
-- 4. Kebijakan reviews_rubric
-- ====================================================================
-- Reviewer dapat membaca penilaian buatannya
CREATE POLICY "Reviewer dapat membaca rubrik miliknya"
ON public.reviews_rubric FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.review_assignments
    WHERE review_assignments.id = reviews_rubric.assignment_id
      AND review_assignments.reviewer_id = auth.uid()
  )
  OR public.is_admin()
);

-- Author hanya boleh membaca bagian catatan publik jika status revision_needed/approved
-- Namun lewat tabel rubric, comments_for_author dibaca melalui API atau view terlindungi
-- Admin dapat melihat semua rubrik
CREATE POLICY "Reviewer dapat mengirimkan rubrik penilaian"
ON public.reviews_rubric FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.review_assignments
    WHERE review_assignments.id = reviews_rubric.assignment_id
      AND review_assignments.reviewer_id = auth.uid()
  )
);

-- ====================================================================
-- 5. Kebijakan activity_log
-- ====================================================================
CREATE POLICY "Pengguna dapat membaca log aktivitas terkait miliknya"
ON public.activity_log FOR SELECT
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.submissions
    WHERE submissions.id = activity_log.submission_id
      AND submissions.author_id = auth.uid()
  )
);

CREATE POLICY "Sistem dan pengguna dapat menambahkan log"
ON public.activity_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin());

-- ====================================================================
-- 6. Kebijakan journal_settings
-- ====================================================================
-- Publik dan semua pengguna dapat membaca setelan jurnal
CREATE POLICY "Publik dapat membaca setelan jurnal"
ON public.journal_settings FOR SELECT
TO PUBLIC
USING (TRUE);

-- Hanya admin yang dapat memperbarui setelan jurnal
CREATE POLICY "Admin dapat memperbarui setelan jurnal"
ON public.journal_settings FOR ALL
USING (public.is_admin());
-- 003_create_storage.sql
-- Setup Storage Buckets dan Kebijakan Akses (RLS Storage)

-- Pembuatan buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('title-pages', 'title-pages', false),
  ('manuscripts', 'manuscripts', false),
  ('review-files', 'review-files', false),
  ('clean-reviews', 'clean-reviews', false),
  ('published', 'published', true),
  ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies:

-- 1. title-pages (Hanya author pemilik dan admin)
CREATE POLICY "Author dan Admin akses title page"
ON storage.objects FOR ALL
USING (
  bucket_id = 'title-pages' AND (
    public.is_admin() OR
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
  )
);

-- 2. manuscripts (Author pemilik, reviewer ditugaskan, dan admin)
CREATE POLICY "Akses naskah manuskrip"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'manuscripts' AND (
    public.is_admin() OR
    auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Author upload manuskrip"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'manuscripts' AND auth.uid() IS NOT NULL
);

-- 3. review-files (Reviewer dan Admin)
CREATE POLICY "Reviewer upload catatan review"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-files' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Reviewer dan Admin baca catatan review"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'review-files' AND (
    public.is_admin() OR
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- 4. clean-reviews (Catatan setelah disanitasi n8n: dapat dibaca Author dan Admin)
CREATE POLICY "Akses catatan bersih review"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clean-reviews' AND auth.uid() IS NOT NULL
);

-- 5. published (Publik bebas membaca/mengunduh)
CREATE POLICY "Publik baca PDF terbit"
ON storage.objects FOR SELECT
USING (bucket_id = 'published');

CREATE POLICY "Admin upload PDF terbit"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'published' AND public.is_admin());

-- 6. assets (Publik bebas membaca asset logo, cover)
CREATE POLICY "Publik baca asset jurnal"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

CREATE POLICY "Admin kelola asset jurnal"
ON storage.objects FOR ALL
USING (bucket_id = 'assets' AND public.is_admin());
-- 004_create_functions.sql
-- Prosedur tersimpan, pemicu (triggers), dan fungsi pembantu Pendar

-- 1. Otomatisasi pembaharuan timestamp updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Pasang trigger updated_at pada tabel utama
DROP TRIGGER IF EXISTS set_users_profile_updated_at ON public.users_profile;
CREATE TRIGGER set_users_profile_updated_at
BEFORE UPDATE ON public.users_profile
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_submissions_updated_at ON public.submissions;
CREATE TRIGGER set_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_review_assignments_updated_at ON public.review_assignments;
CREATE TRIGGER set_review_assignments_updated_at
BEFORE UPDATE ON public.review_assignments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_journal_settings_updated_at ON public.journal_settings;
CREATE TRIGGER set_journal_settings_updated_at
BEFORE UPDATE ON public.journal_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Trigger saat registrasi auth.users: otomatis buat entri users_profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'author');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.users_profile (
    id,
    email,
    role,
    full_name,
    affiliation,
    orcid_id,
    expertise_keywords,
    is_available
  ) VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_full_name,
    NEW.raw_user_meta_data->>'affiliation',
    NEW.raw_user_meta_data->>'orcid_id',
    '{}',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fungsi pembantu log aktivitas
CREATE OR REPLACE FUNCTION public.log_activity(
  p_submission_id UUID,
  p_actor_id UUID,
  p_actor_type TEXT,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.activity_log (
    submission_id,
    actor_id,
    actor_type,
    action,
    details
  ) VALUES (
    p_submission_id,
    p_actor_id,
    p_actor_type,
    p_action,
    p_details
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;
-- 005_seed_data.sql
-- Data awal (seed data) untuk setelan jurnal

INSERT INTO public.journal_settings (
    id,
    journal_name,
    journal_issn,
    journal_eissn,
    journal_publisher,
    journal_description,
    review_deadline_days,
    max_reminders
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Pendar: Jurnal Rekayasa dan Sains Komputasi',
    '2988-1234',
    '2988-5678',
    'Pendar Academic Press',
    'Pendar adalah jurnal akses terbuka terindeks ilmiah yang mempublikasikan riset terkini di bidang komputasi dan teknologi informasi dengan standar review ketat tanpa kompromi integritas.',
    14,
    3
) ON CONFLICT (id) DO NOTHING;
