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

-- 4. Otomatisasi pembaruan status naskah saat penugasan reviewer berubah
CREATE OR REPLACE FUNCTION public.handle_reviewer_assignment_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Saat reviewer menerima tugas atau menyelesaikan rubrik, pastikan status naskah 'under_review'
  IF NEW.status IN ('accepted', 'completed') THEN
    UPDATE public.submissions
    SET status = 'under_review', updated_at = now()
    WHERE id = NEW.submission_id AND status IN ('submitted', 'waiting_for_reviewer');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviewer_assignment_status ON public.review_assignments;
CREATE TRIGGER trg_reviewer_assignment_status
AFTER INSERT OR UPDATE OF status ON public.review_assignments
FOR EACH ROW EXECUTE FUNCTION public.handle_reviewer_assignment_status();
