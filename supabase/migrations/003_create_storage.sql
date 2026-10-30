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
