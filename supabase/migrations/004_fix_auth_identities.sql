-- ============================================================
-- CEMAC INTEGRA — Migration 004 — Recréation complète admins
-- Insère d'abord dans auth.users, puis auth.identities,
-- puis public.profiles — résout l'erreur FK 23503.
-- ============================================================

-- ============================================================
-- ÉTAPE 1 — Insérer les admins dans auth.users
-- ============================================================

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data,
  is_super_admin, is_sso_user, is_anonymous,
  confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
(
  'ad000001-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@cemac-integra.cm',
  crypt('Admin@CEMAC2026!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name":"Super Administrateur CEMAC","role":"super_admin"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  FALSE, FALSE, FALSE,
  '', '', '', ''
),
(
  'ad000002-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'officer@cemac-integra.cm',
  crypt('Officer@CEMAC2026!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name":"Officier CEMAC","role":"cemac_officer"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  FALSE, FALSE, FALSE,
  '', '', '', ''
),
(
  'ad000003-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'auditor@cemac-integra.cm',
  crypt('Auditor@CEMAC2026!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name":"Auditeur CEMAC","role":"auditor"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  FALSE, FALSE, FALSE,
  '', '', '', ''
)
ON CONFLICT (id) DO UPDATE SET
  email_confirmed_at = NOW(),
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = NOW();

-- ============================================================
-- ÉTAPE 2 — Insérer dans auth.identities (dépend de ÉTAPE 1)
-- ============================================================

INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
(
  'ad000001-0000-0000-0000-000000000001',
  'admin@cemac-integra.cm',
  'ad000001-0000-0000-0000-000000000001',
  '{"sub":"ad000001-0000-0000-0000-000000000001","email":"admin@cemac-integra.cm","email_verified":true}'::jsonb,
  'email',
  NOW(), NOW(), NOW()
),
(
  'ad000002-0000-0000-0000-000000000002',
  'officer@cemac-integra.cm',
  'ad000002-0000-0000-0000-000000000002',
  '{"sub":"ad000002-0000-0000-0000-000000000002","email":"officer@cemac-integra.cm","email_verified":true}'::jsonb,
  'email',
  NOW(), NOW(), NOW()
),
(
  'ad000003-0000-0000-0000-000000000003',
  'auditor@cemac-integra.cm',
  'ad000003-0000-0000-0000-000000000003',
  '{"sub":"ad000003-0000-0000-0000-000000000003","email":"auditor@cemac-integra.cm","email_verified":true}'::jsonb,
  'email',
  NOW(), NOW(), NOW()
)
ON CONFLICT (provider_id, provider) DO NOTHING;

-- ============================================================
-- ÉTAPE 3 — Upsert profils admins dans public.profiles
-- ============================================================

INSERT INTO public.profiles (id, email, full_name, role, country, language)
VALUES
  ('ad000001-0000-0000-0000-000000000001', 'admin@cemac-integra.cm',   'Super Administrateur CEMAC', 'super_admin',   'CM', 'fr'),
  ('ad000002-0000-0000-0000-000000000002', 'officer@cemac-integra.cm', 'Officier CEMAC',              'cemac_officer', 'CM', 'fr'),
  ('ad000003-0000-0000-0000-000000000003', 'auditor@cemac-integra.cm', 'Auditeur CEMAC',              'auditor',       'CM', 'fr')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================================
-- ÉTAPE 4 — Réparer les utilisateurs seed s'ils existent déjà
--           (ajouter identities manquantes)
-- ============================================================

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  u.id,
  u.email,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  NOW(), NOW(), NOW()
FROM auth.users u
WHERE u.email IN (
  'aisc@seed.cemac.com','gbp@seed.cemac.com','sdc@seed.cemac.com',
  'cst@seed.cemac.com','ace@seed.cemac.com','cpe@seed.cemac.com'
)
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i
  WHERE i.user_id = u.id AND i.provider = 'email'
)
ON CONFLICT (provider_id, provider) DO NOTHING;

-- ============================================================
-- ÉTAPE 5 — Garantir email_confirmed_at sur tous les comptes
-- ============================================================

UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email IN (
  'admin@cemac-integra.cm','officer@cemac-integra.cm','auditor@cemac-integra.cm',
  'aisc@seed.cemac.com','gbp@seed.cemac.com','sdc@seed.cemac.com',
  'cst@seed.cemac.com','ace@seed.cemac.com','cpe@seed.cemac.com'
);

-- ============================================================
-- Vérification
-- SELECT u.email, u.email_confirmed_at IS NOT NULL AS confirmed,
--        i.provider
-- FROM auth.users u
-- LEFT JOIN auth.identities i ON i.user_id = u.id
-- WHERE u.email LIKE '%cemac%' OR u.email LIKE '%seed%'
-- ORDER BY u.email;
-- ============================================================
