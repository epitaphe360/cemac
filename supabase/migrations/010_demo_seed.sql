-- ============================================================
-- 010 — Données de démonstration CEMAC INTEGRA
-- ============================================================
-- Ce script insère des données réalistes pour toutes les tables.
-- Les UUIDs sont fixes pour permettre des références cohérentes.
-- Exécution idempotente : ON CONFLICT DO NOTHING sur toutes les inserts.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. DÉSACTIVER LES TRIGGERS pour l'insertion en masse
-- ─────────────────────────────────────────────────────────────
SET session_replication_role = 'replica';

-- ─────────────────────────────────────────────────────────────
-- 1. AUTH USERS (via auth.users + identities)
-- ─────────────────────────────────────────────────────────────
-- Crée des utilisateurs dans auth.users directement
-- Les mots de passe sont hashés avec bcrypt: "Demo@2026!"

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at, role, aud
) VALUES
-- super_admin
(
  '11111111-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@cemac-integra.com',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Administrateur CEMAC","role":"super_admin"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- cemac_officer
(
  '11111111-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'officier@cemac.int',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Jean-Baptiste Nkomo","role":"cemac_officer"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- chamber_agent Cameroun
(
  '11111111-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'agent.cm@ccima.cm',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Marie-Claire Essomba","role":"chamber_agent"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- chamber_agent Gabon
(
  '11111111-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'agent.ga@ccig.ga',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Pierre Ondo Mba","role":"chamber_agent"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- company_admin Cameroun 1
(
  '11111111-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'dg@agritech-cm.com',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Alain Tchoupo","role":"company_admin"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- company_admin Cameroun 2
(
  '11111111-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'dg@cacao-elite.cm',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Sylvie Nguimfack","role":"company_admin"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- company_admin Gabon
(
  '11111111-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000000',
  'dg@gabowood.ga',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"François Moussavou","role":"company_admin"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- company_admin Congo
(
  '11111111-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000000',
  'dg@congobio.cg',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Chantal Mbemba","role":"company_admin"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- auditor
(
  '11111111-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000000',
  'auditeur@cemac-audit.com',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Dr. Hamidou Maïga","role":"auditor"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- buyer
(
  '11111111-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000000',
  'acheteur@import-export.eu',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Thomas Lefèvre","role":"buyer"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- logistics_agent
(
  '11111111-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000000',
  'transit@sdv-cm.com',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Rodrigue Ngannou","role":"logistics_agent"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
),
-- public user
(
  '11111111-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000000',
  'visiteur@example.com',
  crypt('Demo@2026!', gen_salt('bf')),
  NOW(), '{"full_name":"Sophie Martin","role":"public"}'::jsonb,
  NOW(), NOW(), 'authenticated', 'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Identities correspondantes
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  u.email,
  'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  NOW(), NOW(), NOW()
FROM auth.users u
WHERE u.id::text LIKE '11111111-0000-0000-0000-%'
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 2. PROFILES
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, email, full_name, role, phone, country, language) VALUES
('11111111-0000-0000-0000-000000000001', 'admin@cemac-integra.com',    'Administrateur CEMAC',   'super_admin',     '+237 222 000 000', 'CM', 'fr'),
('11111111-0000-0000-0000-000000000002', 'officier@cemac.int',          'Jean-Baptiste Nkomo',    'cemac_officer',   '+237 699 100 200', 'CM', 'fr'),
('11111111-0000-0000-0000-000000000003', 'agent.cm@ccima.cm',           'Marie-Claire Essomba',   'chamber_agent',   '+237 677 300 400', 'CM', 'fr'),
('11111111-0000-0000-0000-000000000004', 'agent.ga@ccig.ga',            'Pierre Ondo Mba',        'chamber_agent',   '+241 074 500 600', 'GA', 'fr'),
('11111111-0000-0000-0000-000000000005', 'dg@agritech-cm.com',          'Alain Tchoupo',          'company_admin',   '+237 691 700 800', 'CM', 'fr'),
('11111111-0000-0000-0000-000000000006', 'dg@cacao-elite.cm',           'Sylvie Nguimfack',       'company_admin',   '+237 655 900 010', 'CM', 'fr'),
('11111111-0000-0000-0000-000000000007', 'dg@gabowood.ga',              'François Moussavou',     'company_admin',   '+241 066 110 220', 'GA', 'fr'),
('11111111-0000-0000-0000-000000000008', 'dg@congobio.cg',              'Chantal Mbemba',         'company_admin',   '+242 055 330 440', 'CG', 'fr'),
('11111111-0000-0000-0000-000000000009', 'auditeur@cemac-audit.com',    'Dr. Hamidou Maïga',      'auditor',         '+235 066 550 660', 'TD', 'fr'),
('11111111-0000-0000-0000-000000000010', 'acheteur@import-export.eu',   'Thomas Lefèvre',         'buyer',           '+33 6 12 34 56 78','CM', 'fr'),
('11111111-0000-0000-0000-000000000011', 'transit@sdv-cm.com',          'Rodrigue Ngannou',       'logistics_agent', '+237 699 770 880', 'CM', 'fr'),
('11111111-0000-0000-0000-000000000012', 'visiteur@example.com',        'Sophie Martin',          'public',          NULL,               'CM', 'fr')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3. CHAMBRES DE COMMERCE
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.chambres_commerce (id, nom, pays, ville, email, telephone, agent_count) VALUES
('22222222-0000-0000-0000-000000000001', 'CCIMA — Chambre de Commerce, d''Industrie, des Mines et de l''Artisanat',         'CM', 'Yaoundé',         'contact@ccima.cm',  '+237 222 220 000', 12),
('22222222-0000-0000-0000-000000000002', 'CCIMA Douala',                                                                       'CM', 'Douala',          'douala@ccima.cm',   '+237 233 420 000',  8),
('22222222-0000-0000-0000-000000000003', 'CCIG — Chambre de Commerce, d''Industrie et d''Agriculture du Gabon',               'GA', 'Libreville',      'contact@ccig.ga',   '+241 011 730 020',  6),
('22222222-0000-0000-0000-000000000004', 'CCIAG — Chambre de Commerce, d''Industrie, d''Agriculture et des Métiers du Congo', 'CG', 'Brazzaville',     'contact@cciag.cg',  '+242 022 814 414',  5),
('22222222-0000-0000-0000-000000000005', 'CCIAMA — Chambre de Commerce du Tchad',                                              'TD', 'N''Djamena',      'contact@cciama.td', '+235 022 518 787',  4),
('22222222-0000-0000-0000-000000000006', 'Chambre de Commerce de Centrafrique',                                                'CF', 'Bangui',          'contact@ccca.cf',   '+236 021 615 511',  3),
('22222222-0000-0000-0000-000000000007', 'Chambre de Commerce de Guinée Équatoriale',                                          'GQ', 'Malabo',           'contact@ccge.gq',   '+240 333 088 000',  3)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. ENTREPRISES
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.entreprises (
  id, owner_id, raison_sociale, sigle, secteur_activite, pays, ville,
  adresse, telephone, email_contact, site_web, numero_contribuable,
  description, subscription_plan, is_verified, chambre_id
) VALUES
(
  '33333333-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000005',
  'AgrITech Cameroun SARL', 'AGRITCM',
  'Agriculture & Agroalimentaire', 'CM', 'Yaoundé',
  'Zone Industrielle de Mvan, BP 12045', '+237 222 211 300',
  'contact@agritech-cm.com', 'https://agritech-cm.com', 'M082100001234A',
  'Transformation et exportation de produits agricoles camerounais certifiés CEMAC.',
  'enterprise', true, '22222222-0000-0000-0000-000000000001'
),
(
  '33333333-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000006',
  'Cacao Élite Export SA', 'CACELEX',
  'Agriculture & Agroalimentaire', 'CM', 'Douala',
  'Rue des Exportateurs, Bonanjo, BP 5505', '+237 233 420 150',
  'contact@cacao-elite.cm', 'https://cacao-elite.cm', 'M082100005678B',
  'Producteur et exportateur de cacao grand cru d''origine CEMAC, certifié UTZ et Rainforest.',
  'sme', true, '22222222-0000-0000-0000-000000000002'
),
(
  '33333333-0000-0000-0000-000000000003',
  '11111111-0000-0000-0000-000000000007',
  'GaboWood Industries SA', 'GABWOOD',
  'Bois & Produits dérivés', 'GA', 'Libreville',
  'Port-Môle, Zone Industrielle, BP 3300', '+241 011 730 120',
  'contact@gabowood.ga', 'https://gabowood.ga', 'GABRC202200234',
  'Transformation de bois tropical certifié FSC destiné à l''exportation intra-CEMAC et internationale.',
  'enterprise', true, '22222222-0000-0000-0000-000000000003'
),
(
  '33333333-0000-0000-0000-000000000004',
  '11111111-0000-0000-0000-000000000008',
  'Congo Bio Nature SARL', 'CBNAT',
  'Cosmétiques & Pharmacopée naturelle', 'CG', 'Brazzaville',
  'Avenue de l''Amitié, BP 1100', '+242 055 330 445',
  'contact@congobio.cg', NULL, 'CG2023001245',
  'Fabrication de produits cosmétiques et compléments alimentaires à base de plantes du Bassin du Congo.',
  'sme', false, '22222222-0000-0000-0000-000000000004'
),
(
  '33333333-0000-0000-0000-000000000005',
  '11111111-0000-0000-0000-000000000005',
  'TransCEMAC Logistique SA', 'TRANSCEM',
  'Transport & Logistique', 'CM', 'Douala',
  'Port Autonome de Douala, Terminal 4', '+237 233 600 800',
  'ops@transcem-logistique.com', 'https://transcem-logistique.com', 'M082100009900C',
  'Commissionnaire en douane agréé et transitaire pour toute la zone CEMAC.',
  'enterprise', true, '22222222-0000-0000-0000-000000000002'
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 5. CERTIFICATIONS
-- ─────────────────────────────────────────────────────────────
-- Désactiver la contrainte UNIQUE sur numero_dossier (ou insérer avec valeur fixe)

INSERT INTO public.certifications (
  id, entreprise_id, numero_dossier, type_certification, statut,
  produit_nom, produit_description, pays_production, valeur_ajoutee_locale,
  date_soumission, date_approbation, date_expiration, agent_id, chambre_id,
  notes_agent, notes_commission
) VALUES
-- Certification approuvée — Cacao
(
  '44444444-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000002',
  'CI-2025-00001', 'made_in_cemac', 'approved',
  'Cacao Fermenté Grand Cru', 'Fèves de cacao fermentées et séchées selon la méthode Forastero-Trinitario.',
  'CM', 85.00,
  '2025-01-15 09:00:00+00', '2025-03-20 14:30:00+00',
  '2027-03-20 14:30:00+00',
  '11111111-0000-0000-0000-000000000003',
  '22222222-0000-0000-0000-000000000002',
  'Dossier complet. Visite terrain effectuée le 10/02/2025. Conformité vérifiée.',
  'Commission de certification approuve unanimement. Taux VA local : 85%.'
),
-- Certification approuvée — Bois
(
  '44444444-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000003',
  'CI-2025-00002', 'origine_cemac', 'approved',
  'Parquet en Ayous Traité', 'Lames de parquet en bois d''Ayous (Triplochiton scleroxylon) traité autoclave.',
  'GA', 90.00,
  '2025-02-01 10:00:00+00', '2025-04-10 11:00:00+00',
  '2027-04-10 11:00:00+00',
  '11111111-0000-0000-0000-000000000004',
  '22222222-0000-0000-0000-000000000003',
  'Certification FSC validée en amont. Transformation à 100% sur site gabonais.',
  'Origine CEMAC confirmée. Production et transformation intégralement locales.'
),
-- En cours de révision — AgrITech
(
  '44444444-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000001',
  'CI-2025-00003', 'qualite_plus', 'commission_review',
  'Farine de Manioc Précuite Bio', 'Farine de manioc précuite, sans gluten, issue d''agriculture biologique certifiée.',
  'CM', 92.00,
  '2025-03-10 08:00:00+00', NULL, NULL,
  '11111111-0000-0000-0000-000000000003',
  '22222222-0000-0000-0000-000000000001',
  'Contrôle qualité en laboratoire accrédité ONCC en cours. Résultats attendus pour le 15/05.',
  NULL
),
-- Soumis — Congo Bio
(
  '44444444-0000-0000-0000-000000000004',
  '33333333-0000-0000-0000-000000000004',
  'CI-2025-00004', 'made_in_cemac', 'under_review',
  'Huile de Moabi Bio', 'Huile végétale pressée à froid extraite des noix de Moabi (Baillonella toxisperma).',
  'CG', 95.00,
  '2025-04-05 11:30:00+00', NULL, NULL,
  '11111111-0000-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000004',
  'Dossier en examen. Vérification de la traçabilité de la filière Moabi.',
  NULL
),
-- Rejeté
(
  '44444444-0000-0000-0000-000000000005',
  '33333333-0000-0000-0000-000000000001',
  'CI-2024-00087', 'made_in_cemac', 'rejected',
  'Extrait de Safou Lyophilisé', 'Poudre d''extrait de prunier africain (Dacryodes edulis) lyophilisé.',
  'CM', 60.00,
  '2024-09-01 09:00:00+00', NULL, NULL,
  '11111111-0000-0000-0000-000000000003',
  '22222222-0000-0000-0000-000000000001',
  'Taux de valeur ajoutée locale insuffisant. Matières premières importées à 45%.',
  'Rejeté. Valeur ajoutée locale en-dessous du seuil CEMAC de 65%.'
),
-- Brouillon
(
  '44444444-0000-0000-0000-000000000006',
  '33333333-0000-0000-0000-000000000002',
  'CI-2026-00012', 'qualite_plus', 'draft',
  'Chocolat Noir 72% Origine CEMAC', 'Tablettes de chocolat noir 72% de cacao, tracé du producteur à la tablette.',
  'CM', 88.00,
  NULL, NULL, NULL,
  NULL, NULL, NULL, NULL
),
-- Validation terrain
(
  '44444444-0000-0000-0000-000000000007',
  '33333333-0000-0000-0000-000000000003',
  'CI-2026-00013', 'origine_cemac', 'field_validation',
  'Contreplaqué Okoumé 3 plis', 'Panneaux de contreplaqué en Okoumé gabonais, 3 plis collés sous pression.',
  'GA', 87.00,
  '2026-01-20 10:00:00+00', NULL, NULL,
  '11111111-0000-0000-0000-000000000004',
  '22222222-0000-0000-0000-000000000003',
  'Visite terrain programmée le 25/01/2026.',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 6. WORKFLOW EVENTS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.workflow_events (id, certification_id, statut_precedent, statut_nouveau, commentaire, created_by) VALUES
('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', NULL, 'draft', 'Création du dossier', '11111111-0000-0000-0000-000000000006'),
('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', 'draft', 'submitted', 'Soumission officielle du dossier', '11111111-0000-0000-0000-000000000006'),
('55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000001', 'submitted', 'under_review', 'Prise en charge par la chambre de Douala', '11111111-0000-0000-0000-000000000003'),
('55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000001', 'under_review', 'field_validation', 'Contrôle terrain initié. Visite prévue le 10/02/2025.', '11111111-0000-0000-0000-000000000003'),
('55555555-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000001', 'field_validation', 'commission_review', 'Rapport terrain positif. Soumis à la commission nationale.', '11111111-0000-0000-0000-000000000003'),
('55555555-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000001', 'commission_review', 'approved', 'Approuvé unanimement par la commission. Certificat CEMAC émis.', '11111111-0000-0000-0000-000000000002'),
('55555555-0000-0000-0000-000000000007', '44444444-0000-0000-0000-000000000002', NULL, 'draft', 'Création du dossier GaboWood', '11111111-0000-0000-0000-000000000007'),
('55555555-0000-0000-0000-000000000008', '44444444-0000-0000-0000-000000000002', 'draft', 'submitted', 'Soumission dossier parquet Ayous', '11111111-0000-0000-0000-000000000007'),
('55555555-0000-0000-0000-000000000009', '44444444-0000-0000-0000-000000000002', 'submitted', 'under_review', 'Prise en charge CCIG', '11111111-0000-0000-0000-000000000004'),
('55555555-0000-0000-0000-000000000010', '44444444-0000-0000-0000-000000000002', 'under_review', 'field_validation', 'Inspection usine réalisée. Résultats conformes.', '11111111-0000-0000-0000-000000000004'),
('55555555-0000-0000-0000-000000000011', '44444444-0000-0000-0000-000000000002', 'field_validation', 'commission_review', 'Soumis à la commission CEMAC Gabon.', '11111111-0000-0000-0000-000000000004'),
('55555555-0000-0000-0000-000000000012', '44444444-0000-0000-0000-000000000002', 'commission_review', 'approved', 'Certification Origine CEMAC accordée.', '11111111-0000-0000-0000-000000000002'),
('55555555-0000-0000-0000-000000000013', '44444444-0000-0000-0000-000000000005', NULL, 'draft', 'Dossier créé', '11111111-0000-0000-0000-000000000005'),
('55555555-0000-0000-0000-000000000014', '44444444-0000-0000-0000-000000000005', 'draft', 'submitted', 'Soumission dossier Safou', '11111111-0000-0000-0000-000000000005'),
('55555555-0000-0000-0000-000000000015', '44444444-0000-0000-0000-000000000005', 'submitted', 'rejected', 'Taux VA insuffisant. Dossier rejeté.', '11111111-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 7. PRODUITS (MARKETPLACE)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.produits (
  id, entreprise_id, certification_id, nom, description,
  categorie, sous_categorie, prix_unitaire, devise, unite,
  quantite_disponible, pays_origine, is_published, tags
) VALUES
(
  '66666666-0000-0000-0000-000000000001',
  '33333333-0000-0000-0000-000000000002',
  '44444444-0000-0000-0000-000000000001',
  'Cacao Fermenté Grand Cru — Sac 50kg',
  'Fèves de cacao fermentées et séchées, taux de beurre ≥ 52%, teneur en eau < 7.5%.',
  'Agroalimentaire', 'Matières premières', 2800000, 'XAF', 'sac 50kg',
  350, 'CM', true,
  ARRAY['cacao', 'bio', 'origine-cemac', 'grand-cru']
),
(
  '66666666-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000002',
  '44444444-0000-0000-0000-000000000006',
  'Chocolat Noir 72% — Boîte 1kg',
  'Tablettes de chocolat noir 72% cacao CEMAC, sans additifs, conditionnement premium export.',
  'Agroalimentaire', 'Confiserie', 18500, 'XAF', 'boîte 1kg',
  1200, 'CM', true,
  ARRAY['chocolat', 'bio', 'made-in-cemac', '72%']
),
(
  '66666666-0000-0000-0000-000000000003',
  '33333333-0000-0000-0000-000000000001',
  '44444444-0000-0000-0000-000000000003',
  'Farine de Manioc Précuite Bio — Sac 25kg',
  'Farine de manioc précuite, sans gluten, riche en fibres. Idéale boulangerie et industrie agro.',
  'Agroalimentaire', 'Farines & Féculents', 32000, 'XAF', 'sac 25kg',
  500, 'CM', true,
  ARRAY['farine', 'manioc', 'sans-gluten', 'bio']
),
(
  '66666666-0000-0000-0000-000000000004',
  '33333333-0000-0000-0000-000000000003',
  '44444444-0000-0000-0000-000000000002',
  'Parquet Ayous Traité — Lot 20m²',
  'Lames de parquet 14mm, finition huilée, traitement autoclave classe 2. Livraison FOB Libreville.',
  'Bois & Matériaux', 'Parquet', 185000, 'XAF', 'lot 20m²',
  80, 'GA', true,
  ARRAY['parquet', 'ayous', 'bois-certifié', 'fsc', 'gabon']
),
(
  '66666666-0000-0000-0000-000000000005',
  '33333333-0000-0000-0000-000000000003',
  '44444444-0000-0000-0000-000000000007',
  'Contreplaqué Okoumé 3 plis — Panneau 2440×1220mm',
  'Panneaux contreplaqué Okoumé 9mm, collage WBP (résistant eau), qualité export CTBX.',
  'Bois & Matériaux', 'Contreplaqué', 22500, 'XAF', 'panneau',
  600, 'GA', false,
  ARRAY['contreplaqué', 'okoumé', 'gabon', 'construction']
),
(
  '66666666-0000-0000-0000-000000000006',
  '33333333-0000-0000-0000-000000000004',
  '44444444-0000-0000-0000-000000000004',
  'Huile de Moabi Bio — Bidon 5L',
  'Huile de Moabi vierge pressée à froid, non raffinée. Certifiée bio. Usages alimentaires et cosmétiques.',
  'Cosmétiques & Santé', 'Huiles végétales', 45000, 'XAF', 'bidon 5L',
  250, 'CG', true,
  ARRAY['moabi', 'bio', 'cosmétique', 'alimentaire', 'congo']
),
(
  '66666666-0000-0000-0000-000000000007',
  '33333333-0000-0000-0000-000000000001',
  NULL,
  'Café Robusta Torréfié — Sachet 500g',
  'Café Robusta camerounais torréfié artisanalement. Mouture moyenne. Notes chocolatées.',
  'Agroalimentaire', 'Boissons & Café', 8500, 'XAF', 'sachet 500g',
  2000, 'CM', true,
  ARRAY['café', 'robusta', 'cameroun', 'torréfié']
),
(
  '66666666-0000-0000-0000-000000000008',
  '33333333-0000-0000-0000-000000000004',
  NULL,
  'Savon Karité Naturel — Carton 12 pains',
  'Savon artisanal au beurre de karité congolais, sans sulfates ni parabènes. Certifié vegan.',
  'Cosmétiques & Santé', 'Soins corps', 15000, 'XAF', 'carton 12 pains',
  800, 'CG', true,
  ARRAY['karité', 'savon', 'naturel', 'vegan', 'congo']
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 8. CORRIDORS LOGISTIQUES (compléments)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.corridors (id, route, mode, days, status) VALUES
('77777777-0000-0000-0000-000000000001', 'Douala → N''Djamena',         'Route',      '6-8j',  'Opérationnel'),
('77777777-0000-0000-0000-000000000002', 'Pointe-Noire → Libreville',    'Maritime',   '2-3j',  'Opérationnel'),
('77777777-0000-0000-0000-000000000003', 'Malabo → Libreville',          'Aérien',     '1j',    'Opérationnel'),
('77777777-0000-0000-0000-000000000004', 'Douala → Bangui',              'Mixte',      '7-9j',  'Ralenti'),
('77777777-0000-0000-0000-000000000005', 'Yaoundé → Brazzaville',        'Aérien',     '2j',    'Opérationnel'),
('77777777-0000-0000-0000-000000000006', 'N''Djamena → Bangui',          'Route',      '4-5j',  'En maintenance')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 9. ALERTES LOGISTIQUES (compléments)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.logistics_alerts (id, country, message, type, is_active) VALUES
('88888888-0000-0000-0000-000000000001', '🇨🇲 Cameroun', 'Port de Douala : opérations normales. Délais douaniers : 2-3j ouvrés.', 'info', true),
('88888888-0000-0000-0000-000000000002', '🇬🇦 Gabon',    'Terminal à conteneurs de Libreville : grève partielle — délais +2j jusqu''au 20 mai 2026.', 'warning', true),
('88888888-0000-0000-0000-000000000003', '🇨🇫 Centrafrique', 'Corridor Bangui-Douala : travaux routiers entre PK 145 et PK 190. Déviations en place.', 'warning', true),
('88888888-0000-0000-0000-000000000004', '🇹🇩 Tchad', 'Nouveau régime de garantie de transit CEMAC appliqué depuis le 1er janv. 2026.', 'info', true),
('88888888-0000-0000-0000-000000000005', '🇨🇬 Congo', 'Pont de la Corniche refait : passage poids lourds limité à 30t jusqu''au 31/07/2026.', 'warning', true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 10. API CONFIGS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.api_configs (id, key, name, category, config, is_active) VALUES
(
  '99999999-0000-0000-0000-000000000001',
  'mtn_momo', 'MTN Mobile Money', 'payment',
  '{"api_key":"demo_mtn_key_xxxxx","api_user":"demo-user-uuid-mtn","environment":"sandbox","callback_url":"https://api.cemac-integra.com/webhooks/mtn"}',
  false
),
(
  '99999999-0000-0000-0000-000000000002',
  'orange_money', 'Orange Money', 'payment',
  '{"client_id":"demo_om_client","client_secret":"demo_om_secret","merchant_key":"demo_merchant_key","environment":"sandbox"}',
  false
),
(
  '99999999-0000-0000-0000-000000000003',
  'resend_email', 'Resend Email', 'email',
  '{"api_key":"REDACTED_RESEND_KEY","from_email":"noreply@cemac-integra.com"}',
  true
),
(
  '99999999-0000-0000-0000-000000000004',
  'smtp_email', 'SMTP (Email)', 'email',
  '{"host":"smtp.resend.com","port":"465","user":"resend","password":"","from_email":"noreply@cemac-integra.com"}',
  false
)
ON CONFLICT (key) DO UPDATE SET
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- ─────────────────────────────────────────────────────────────
-- 11. INVOICES (FACTURES)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.invoices (
  id, invoice_number, user_id, company_id, plan_name,
  amount_ht, tax_rate, tax_amount, amount_ttc, currency, country,
  payment_method, payment_ref, status, billing_period,
  issued_at, due_at, paid_at, notes
) VALUES
-- Facture payée — AgrITech Enterprise
(
  'aaaaaaaa-0000-0000-0000-000000000001',
  'INV-202504-0001',
  '11111111-0000-0000-0000-000000000005',
  '33333333-0000-0000-0000-000000000001',
  'enterprise', 174885, 19.25, 33654, 208539, 'XAF', 'CM',
  'bank_transfer', 'VIR-SGC-2025-04-001', 'paid', 'yearly',
  '2025-04-01 10:00:00+00', '2025-05-01 10:00:00+00', '2025-04-08 14:00:00+00',
  'Abonnement Enterprise annuel 2025-2026.'
),
-- Facture payée — Cacao Élite SME
(
  'aaaaaaaa-0000-0000-0000-000000000002',
  'INV-202504-0002',
  '11111111-0000-0000-0000-000000000006',
  '33333333-0000-0000-0000-000000000002',
  'sme', 28635, 19.25, 5512, 34147, 'XAF', 'CM',
  'mtn_momo', 'MOMO-CM-20250402-789456', 'paid', 'monthly',
  '2025-04-02 09:00:00+00', '2025-05-02 09:00:00+00', '2025-04-02 09:45:00+00',
  'Plan PME Pro mensuel — avril 2025.'
),
-- Facture payée — GaboWood Enterprise
(
  'aaaaaaaa-0000-0000-0000-000000000003',
  'INV-202504-0003',
  '11111111-0000-0000-0000-000000000007',
  '33333333-0000-0000-0000-000000000003',
  'enterprise', 174885, 18.00, 31479, 206364, 'XAF', 'GA',
  'bank_transfer', 'VIR-BGD-2025-04-012', 'paid', 'yearly',
  '2025-04-05 11:00:00+00', '2025-05-05 11:00:00+00', '2025-04-12 15:30:00+00',
  'Abonnement Enterprise annuel — GaboWood.'
),
-- Facture en attente — Congo Bio SME
(
  'aaaaaaaa-0000-0000-0000-000000000004',
  'INV-202505-0001',
  '11111111-0000-0000-0000-000000000008',
  '33333333-0000-0000-0000-000000000004',
  'sme', 28635, 18.90, 5412, 34047, 'XAF', 'CG',
  'orange_money', NULL, 'pending', 'monthly',
  '2025-05-01 08:00:00+00', '2025-05-31 08:00:00+00', NULL,
  'Plan PME Pro mensuel — mai 2025.'
),
-- Facture payée — AgrITech mai
(
  'aaaaaaaa-0000-0000-0000-000000000005',
  'INV-202505-0002',
  '11111111-0000-0000-0000-000000000005',
  '33333333-0000-0000-0000-000000000001',
  'enterprise', 174885, 19.25, 33654, 208539, 'XAF', 'CM',
  'bank_transfer', 'VIR-SGC-2025-05-003', 'paid', 'monthly',
  '2025-05-01 09:00:00+00', '2025-05-31 09:00:00+00', '2025-05-05 11:00:00+00',
  'Plan Enterprise mensuel — mai 2025.'
),
-- Facture annulée
(
  'aaaaaaaa-0000-0000-0000-000000000006',
  'INV-202503-0001',
  '11111111-0000-0000-0000-000000000008',
  NULL,
  'sme', 28635, 18.90, 5412, 34047, 'XAF', 'CG',
  'bank_transfer', NULL, 'cancelled', 'monthly',
  '2025-03-01 08:00:00+00', '2025-03-31 08:00:00+00', NULL,
  'Facture annulée suite à changement de plan.'
),
-- Facture en attente — Cacao juin
(
  'aaaaaaaa-0000-0000-0000-000000000007',
  'INV-202601-0001',
  '11111111-0000-0000-0000-000000000006',
  '33333333-0000-0000-0000-000000000002',
  'sme', 28635, 19.25, 5512, 34147, 'XAF', 'CM',
  'mtn_momo', NULL, 'pending', 'monthly',
  '2026-01-01 09:00:00+00', '2026-02-01 09:00:00+00', NULL,
  'Plan PME Pro mensuel — janvier 2026.'
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 12. CONTACT REQUESTS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.contact_requests (id, full_name, email, company, country, reason, message) VALUES
(
  'bbbbbbbb-0000-0000-0000-000000000001',
  'Amadou Koné', 'a.kone@dakar-import.sn',
  'Dakar Import & Export', 'SN', 'certification',
  'Bonjour, nous sommes une société sénégalaise intéressée par l''accès aux certifications Made in CEMAC pour importer des produits camerounais. Pourriez-vous nous indiquer la procédure pour les acheteurs hors CEMAC ?'
),
(
  'bbbbbbbb-0000-0000-0000-000000000002',
  'Laura Fernández', 'l.fernandez@grupo-africa.es',
  'Grupo África Investments', 'ES', 'marketplace',
  'We are a Spanish investment group looking to source CEMAC-certified timber products for European construction projects. We would like to understand the Marketplace verification process and how to access product catalogues.'
),
(
  'bbbbbbbb-0000-0000-0000-000000000003',
  'Ibrahim Al-Rashidi', 'i.rashidi@gcc-trade.ae',
  'GCC Trade Partners LLC', 'AE', 'partnership',
  'Notre société basée à Dubaï souhaite établir un partenariat avec CEMAC INTEGRA pour distribuer des produits cosmétiques naturels certifiés dans la région du Golfe. Merci de nous contacter.'
),
(
  'bbbbbbbb-0000-0000-0000-000000000004',
  'Fatima Ndiaye', 'f.ndiaye@ong-cemac.org',
  'ONG CEMAC Solidaire', 'CM', 'support',
  'Notre ONG appuie des petits producteurs agricoles au nord du Cameroun. Est-il possible de bénéficier d''un tarif associatif pour accéder à la plateforme de certification ? Merci.'
),
(
  'bbbbbbbb-0000-0000-0000-000000000005',
  'Jean-Pierre Lamarche', 'jp.lamarche@afd.fr',
  'Agence Française de Développement', 'FR', 'partnership',
  'L''AFD finance plusieurs projets d''industrialisation en zone CEMAC. Nous souhaiterions intégrer CEMAC INTEGRA comme outil de traçabilité dans nos projets. Peut-on organiser une réunion technique ?'
),
(
  'bbbbbbbb-0000-0000-0000-000000000006',
  'Moussa Diallo', 'm.diallo@bcceao.int',
  'BCEAO', 'SN', 'other',
  'Je représente la BCEAO dans le cadre d''une étude comparative sur les plateformes de certification d''origine en Afrique. Pourrais-je obtenir des statistiques agrégées sur les certifications délivrées via CEMAC INTEGRA ?'
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 13. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.notifications (id, user_id, title, body, message, type, read, certification_id) VALUES
('cccccccc-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005',
 'Certification approuvée', 'Votre dossier CI-2025-00001 (Cacao Fermenté Grand Cru) a été approuvé.',
 'Votre dossier CI-2025-00001 (Cacao Fermenté Grand Cru) a été approuvé.',
 'certification_status', false, '44444444-0000-0000-0000-000000000001'),
('cccccccc-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000006',
 'Paiement confirmé', 'Votre facture INV-202504-0002 a bien été reçue et confirmée.',
 'Votre facture INV-202504-0002 a bien été reçue et confirmée.',
 'payment_confirmed', true, NULL),
('cccccccc-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000007',
 'Certification approuvée', 'Votre dossier CI-2025-00002 (Parquet Ayous) a été approuvé. Certificat disponible.',
 'Votre dossier CI-2025-00002 (Parquet Ayous) a été approuvé. Certificat disponible.',
 'certification_status', false, '44444444-0000-0000-0000-000000000002'),
('cccccccc-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000005',
 'Dossier en révision', 'Votre dossier CI-2025-00003 (Farine de Manioc) est en cours de révision par la commission.',
 'Votre dossier CI-2025-00003 (Farine de Manioc) est en cours de révision par la commission.',
 'certification_status', false, '44444444-0000-0000-0000-000000000003'),
('cccccccc-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000008',
 'Facture en attente', 'Votre facture INV-202505-0001 est en attente de paiement. Échéance : 31/05/2025.',
 'Votre facture INV-202505-0001 est en attente de paiement. Échéance : 31/05/2025.',
 'payment_confirmed', false, NULL),
('cccccccc-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001',
 'Nouvelle demande de contact', 'Amadou Koné (Dakar Import) a soumis une demande de renseignements.',
 'Amadou Koné (Dakar Import) a soumis une demande de renseignements.',
 'system', false, NULL),
('cccccccc-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000005',
 'Produit publié', 'Votre produit "Café Robusta Torréfié" est maintenant visible sur le Marketplace.',
 'Votre produit "Café Robusta Torréfié" est maintenant visible sur le Marketplace.',
 'system', true, NULL)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- RÉACTIVER LES TRIGGERS
-- ─────────────────────────────────────────────────────────────
SET session_replication_role = 'origin';
