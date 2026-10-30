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
