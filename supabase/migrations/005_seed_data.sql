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
