-- ============================================================
-- CEMAC INTEGRA — Migration 003 — Données de démonstration
-- Entreprises + Produits Marketplace
-- ============================================================

-- UUIDs fixes utilisés dans ce fichier :
-- Utilisateurs / Profils :
--   u1 = 00000001-0000-0000-0000-000000000001  (owner ent1, ent2, ent3 — CM)
--   u2 = 00000002-0000-0000-0000-000000000002  (owner ent4, ent5 — GA)
--   u3 = 00000003-0000-0000-0000-000000000003  (owner ent6 — CG)
--   u4 = 00000004-0000-0000-0000-000000000004  (owner ent7 — TD)
--   u5 = 00000005-0000-0000-0000-000000000005  (owner ent8 — CF)
--   u6 = 00000006-0000-0000-0000-000000000006  (owner ent9 — GQ)
-- Entreprises :
--   e1 = 10000001-0000-0000-0000-000000000001
--   e2 = 10000002-0000-0000-0000-000000000002
--   ...

-- ============================================================
-- ÉTAPE 1 — Créer des utilisateurs factices dans auth.users
-- ============================================================

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
(
  '00000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'aisc@seed.cemac.com', crypt('SeedPass123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name":"AISC Cameroun","role":"company_admin"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  FALSE, '', '', '', ''
),
(
  '00000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'gbp@seed.cemac.com', crypt('SeedPass123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name":"Gabon Bois Précieux","role":"company_admin"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  FALSE, '', '', '', ''
),
(
  '00000003-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'sdc@seed.cemac.com', crypt('SeedPass123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name":"Saveurs du Congo","role":"company_admin"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  FALSE, '', '', '', ''
),
(
  '00000004-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'cst@seed.cemac.com', crypt('SeedPass123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name":"Coton Sahel Tchad","role":"company_admin"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  FALSE, '', '', '', ''
),
(
  '00000005-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'ace@seed.cemac.com', crypt('SeedPass123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name":"Artisanat Centrafricain","role":"company_admin"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  FALSE, '', '', '', ''
),
(
  '00000006-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'cpe@seed.cemac.com', crypt('SeedPass123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"full_name":"Cacao Premium Equatorial","role":"company_admin"}'::jsonb,
  '{"provider":"email","providers":["email"]}'::jsonb,
  FALSE, '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÉTAPE 2 — Profils (le trigger handle_new_user peut le faire,
--            mais on insère manuellement pour garantir la cohérence)
-- ============================================================

INSERT INTO public.profiles (id, email, full_name, role, country, language)
VALUES
  ('00000001-0000-0000-0000-000000000001', 'aisc@seed.cemac.com',  'AISC Cameroun',             'company_admin', 'CM', 'fr'),
  ('00000002-0000-0000-0000-000000000002', 'gbp@seed.cemac.com',   'Gabon Bois Précieux',        'company_admin', 'GA', 'fr'),
  ('00000003-0000-0000-0000-000000000003', 'sdc@seed.cemac.com',   'Saveurs du Congo',           'company_admin', 'CG', 'fr'),
  ('00000004-0000-0000-0000-000000000004', 'cst@seed.cemac.com',   'Coton Sahel Tchad',          'company_admin', 'TD', 'fr'),
  ('00000005-0000-0000-0000-000000000005', 'ace@seed.cemac.com',   'Artisanat Centrafricain',    'company_admin', 'CF', 'fr'),
  ('00000006-0000-0000-0000-000000000006', 'cpe@seed.cemac.com',   'Cacao Premium Equatorial',   'company_admin', 'GQ', 'fr')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ÉTAPE 3 — ENTREPRISES
-- ============================================================

INSERT INTO public.entreprises (
  id, owner_id, raison_sociale, sigle, secteur_activite,
  pays, ville, adresse, telephone, email_contact, site_web,
  description, subscription_plan, is_verified
) VALUES

-- Cameroun — owner u1
(
  '10000001-0000-0000-0000-000000000001',
  '00000001-0000-0000-0000-000000000001',
  'Agro-Industrie Sabc Cameroun', 'AISC',
  'Agro-alimentaire', 'CM', 'Douala',
  'Zone industrielle de Bassa, Douala',
  '+237 233 400 000', 'contact@aisc-cm.com', 'www.aisc-cm.com',
  'Leader de la transformation agro-industrielle au Cameroun.',
  'enterprise', TRUE
),
(
  '10000002-0000-0000-0000-000000000002',
  '00000001-0000-0000-0000-000000000001',
  'Forêts & Bois du Cameroun', 'FBC',
  'Bois & Forêt', 'CM', 'Yaoundé',
  'Quartier Bastos, Yaoundé',
  '+237 222 123 456', 'info@fbc-cm.com', NULL,
  'Exploitation et transformation durable du bois certifié FSC.',
  'sme', TRUE
),
(
  '10000003-0000-0000-0000-000000000003',
  '00000001-0000-0000-0000-000000000001',
  'Cosmetiques Naturels du Cameroun', 'CNC',
  'Cosmétique & Bien-être', 'CM', 'Bafoussam',
  '12 Avenue des Artisans, Bafoussam',
  '+237 699 874 521', 'cnc@cosmetics-cm.com', NULL,
  'Fabrication de cosmétiques naturels à base de karité, cacao et huiles locales.',
  'sme', TRUE
),

-- Gabon — owner u2
(
  '10000004-0000-0000-0000-000000000004',
  '00000002-0000-0000-0000-000000000002',
  'Gabon Bois Précieux', 'GBP',
  'Bois & Forêt', 'GA', 'Libreville',
  'Boulevard du Bord de Mer, Libreville',
  '+241 01 741 234', 'contact@gbp-gabon.com', NULL,
  'Exportation de bois tropicaux certifiés : okoumé, ozigo, wengé.',
  'enterprise', TRUE
),
(
  '10000005-0000-0000-0000-000000000005',
  '00000002-0000-0000-0000-000000000002',
  'Pêcheries du Gabon', 'PDG',
  'Pêche & Aquaculture', 'GA', 'Port-Gentil',
  'Zone Portuaire, Port-Gentil',
  '+241 05 123 789', 'pdg@peche-gabon.com', NULL,
  'Produits de la mer frais et transformés issus des eaux gabonaises.',
  'sme', TRUE
),

-- Congo — owner u3
(
  '10000006-0000-0000-0000-000000000006',
  '00000003-0000-0000-0000-000000000003',
  'Saveurs du Congo', 'SDC',
  'Agro-alimentaire', 'CG', 'Brazzaville',
  'Marché Total, Brazzaville',
  '+242 06 654 321', 'info@saveurscongo.com', NULL,
  'Production et conservation de produits alimentaires traditionnels du Congo.',
  'sme', TRUE
),

-- Tchad — owner u4
(
  '10000007-0000-0000-0000-000000000007',
  '00000004-0000-0000-0000-000000000004',
  'Coton du Sahel TCHADIEN', 'CST',
  'Textile & Fibre', 'TD', 'N''Djamena',
  'Zone Industrielle, N''Djamena',
  '+235 66 112 233', 'cst@coton-tchad.com', NULL,
  'Filière coton tchadien — fibre brute, fil et tissu.',
  'sme', TRUE
),

-- Centrafrique — owner u5
(
  '10000008-0000-0000-0000-000000000008',
  '00000005-0000-0000-0000-000000000005',
  'Artisanat Centrafricain d''Excellence', 'ACE',
  'Artisanat & Art', 'CF', 'Bangui',
  'Quartier Lakouanga, Bangui',
  '+236 75 441 122', 'ace@artisanat-cf.com', NULL,
  'Objets d''art, bijoux et sculptures en bois, pierre et métal issus de la RCA.',
  'free', TRUE
),

-- Guinée Équatoriale — owner u6
(
  '10000009-0000-0000-0000-000000000009',
  '00000006-0000-0000-0000-000000000006',
  'Cacao Premium Equatorial', 'CPE',
  'Agro-alimentaire', 'GQ', 'Malabo',
  'Zona Industrial, Malabo',
  '+240 333 052 100', 'cpe@cacaoeq.com', NULL,
  'Production de cacao grand cru, chocolat artisanal et dérivés.',
  'enterprise', TRUE
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PRODUITS — 25 Produits CEMAC réels
-- ============================================================

INSERT INTO public.produits (
  id, entreprise_id, nom, description,
  categorie, sous_categorie,
  prix_unitaire, devise, unite,
  quantite_disponible, pays_origine,
  images, tags, is_published
) VALUES

-- ===== CAMEROUN — Agro-alimentaire  (ent e1) =====
(
  uuid_generate_v4(),
  '10000001-0000-0000-0000-000000000001',
  'Huile de palme rouge raffinée',
  'Huile de palme rouge issue de plantations durables au Cameroun. Riche en bêta-carotène et vitamine E. Conditionnée en bidon de 5L certifié alimentaire.',
  'Agro-alimentaire', 'Huiles & Corps gras',
  3500.00, 'XAF', 'bidon 5L',
  500, 'CM',
  ARRAY['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'],
  ARRAY['huile de palme', 'cameroun', 'bio', 'made in cemac', 'exportation'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000001-0000-0000-0000-000000000001',
  'Café Arabica des Highlands de l''Ouest',
  'Café arabica de spécialité cultivé à plus de 1200m d''altitude dans les hautes terres de l''Ouest Cameroun. Notes florales et caramel. Sachet 250g torréfié.',
  'Agro-alimentaire', 'Café & Thé',
  2800.00, 'XAF', 'sachet 250g',
  300, 'CM',
  ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400'],
  ARRAY['café', 'arabica', 'cameroun', 'spécialité', 'highlands'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000001-0000-0000-0000-000000000001',
  'Cacao en fèves fermentées et séchées',
  'Fèves de cacao Forastero fermentées 7 jours et naturellement séchées au soleil. Taux de beurre > 54%. Sac jute 50kg, idéal exports chocolatiers.',
  'Agro-alimentaire', 'Cacao & Chocolat',
  85000.00, 'XAF', 'sac 50kg',
  150, 'CM',
  ARRAY['https://images.unsplash.com/photo-1548940740-204726a19be3?w=400'],
  ARRAY['cacao', 'fèves', 'chocolat', 'cameroun', 'export'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000001-0000-0000-0000-000000000001',
  'Poivre noir de Penja AOP',
  'Poivre noir de Penja, première AOP africaine. Arôme puissant et complexe, notes boisées et fruitées. Sachet 100g de qualité premium.',
  'Agro-alimentaire', 'Épices & Condiments',
  4500.00, 'XAF', 'sachet 100g',
  1000, 'CM',
  ARRAY['https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=400'],
  ARRAY['poivre de penja', 'AOP', 'épices', 'cameroun', 'premium'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000001-0000-0000-0000-000000000001',
  'Miel sauvage de forêt équatoriale',
  'Miel 100% naturel récolté dans les forêts tropicales du bassin du Congo. Non chauffé, non filtré. Pot en verre 500g.',
  'Agro-alimentaire', 'Miels & Produits de la ruche',
  6500.00, 'XAF', 'pot 500g',
  200, 'CM',
  ARRAY['https://images.unsplash.com/photo-1529733494-53fa863d8a72?w=400'],
  ARRAY['miel', 'naturel', 'forêt', 'bio', 'cameroun'],
  TRUE
),

-- ===== CAMEROUN — Cosmétiques  (ent e3) =====
(
  uuid_generate_v4(),
  '10000003-0000-0000-0000-000000000003',
  'Beurre de karité pur non raffiné',
  'Beurre de karité artisanal extrait à froid dans la région du Nord Cameroun. 100% naturel, idéal peau et cheveux. Pot 300g.',
  'Cosmétique & Bien-être', 'Soins du corps',
  5000.00, 'XAF', 'pot 300g',
  400, 'CM',
  ARRAY['https://images.unsplash.com/photo-1607612645072-8d28cbcc1f40?w=400'],
  ARRAY['karité', 'beurre', 'naturel', 'cosmétique', 'bio'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000003-0000-0000-0000-000000000003',
  'Huile de coco vierge pressée à froid',
  'Huile de coco vierge extraite à froid de noix de coco fraîches du littoral camerounais. Polyvalente : cuisine, peau, cheveux. Flacon 250ml.',
  'Cosmétique & Bien-être', 'Huiles de beauté',
  4200.00, 'XAF', 'flacon 250ml',
  350, 'CM',
  ARRAY['https://images.unsplash.com/photo-1584515933487-779824d29309?w=400'],
  ARRAY['huile de coco', 'cosmétique', 'cheveux', 'peau', 'naturel'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000003-0000-0000-0000-000000000003',
  'Savon noir traditionnel au beurre de cacao',
  'Savon noir artisanal fabriqué à base de beurre de cacao et de potasse végétale. Exfoliant naturel pour le corps. Pot 400g.',
  'Cosmétique & Bien-être', 'Savons & Soins',
  3000.00, 'XAF', 'pot 400g',
  600, 'CM',
  ARRAY['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400'],
  ARRAY['savon noir', 'cacao', 'artisanal', 'exfoliant', 'traditionnel'],
  TRUE
),

-- ===== CAMEROUN — Bois  (ent e2) =====
(
  uuid_generate_v4(),
  '10000002-0000-0000-0000-000000000002',
  'Planches de Sapelli séchées sous abri',
  'Planches de sapelli (Entandrophragma cylindricum) séchées naturellement 6 mois, stabiles et prêtes à débiter. Section 25x200mm, longueur 3m.',
  'Bois & Forêt', 'Bois de construction',
  18000.00, 'XAF', 'pièce 3m',
  500, 'CM',
  ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
  ARRAY['bois', 'sapelli', 'construction', 'menuiserie', 'cameroun'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000002-0000-0000-0000-000000000002',
  'Parquet en Iroko massif huilé',
  'Lames de parquet en iroko massif (Chlorophora excelsa), pré-huilées, format 15x120x600mm. Idéal intérieur résidentiel et commercial.',
  'Bois & Forêt', 'Parquet & Revêtement',
  12500.00, 'XAF', 'm²',
  800, 'CM',
  ARRAY['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400'],
  ARRAY['parquet', 'iroko', 'bois massif', 'décoration', 'cameroun'],
  TRUE
),

-- ===== GABON — Bois précieux  (ent e4) =====
(
  uuid_generate_v4(),
  '10000004-0000-0000-0000-000000000004',
  'Grumes d''Okoumé certifiées FSC',
  'Grumes d''okoumé (Aucoumea klaineana) issues de forêts certifiées FSC du Gabon. Diamètre 40–80cm, longueur min. 6m. Idéal fabrication contreplaqué.',
  'Bois & Forêt', 'Grumes & Bois ronds',
  45000.00, 'XAF', 'm³',
  200, 'GA',
  ARRAY['https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400'],
  ARRAY['okoumé', 'FSC', 'gabon', 'contreplaqué', 'bois tropical'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000004-0000-0000-0000-000000000004',
  'Bois de Wengé débité et sec',
  'Avivés de wengé (Millettia laurentii) secs à 12% d''humidité, section 50x100mm, longueur 3m. Grain serré, très décoratif.',
  'Bois & Forêt', 'Bois exotiques',
  72000.00, 'XAF', 'm³',
  100, 'GA',
  ARRAY['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400'],
  ARRAY['wengé', 'bois exotique', 'luxe', 'gabon', 'ébénisterie'],
  TRUE
),

-- ===== GABON — Pêche  (ent e5) =====
(
  uuid_generate_v4(),
  '10000005-0000-0000-0000-000000000005',
  'Crevettes roses congelées IQF',
  'Crevettes roses sauvages (Penaeus notialis) pêchées dans les eaux atlantiques du Gabon. Calibre 30/40, surgelées individuellement (IQF). Carton 2kg.',
  'Pêche & Aquaculture', 'Crustacés',
  22000.00, 'XAF', 'carton 2kg',
  300, 'GA',
  ARRAY['https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400'],
  ARRAY['crevettes', 'surgelé', 'gabon', 'atlantique', 'IQF'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000005-0000-0000-0000-000000000005',
  'Filets de bar séchés et fumés',
  'Filets de bar (Dicentrarchus labrax) séchés et fumés au bois d''iroko selon la méthode traditionnelle gabonaise. Sachet sous-vide 500g.',
  'Pêche & Aquaculture', 'Poissons fumés',
  8500.00, 'XAF', 'sachet 500g',
  250, 'GA',
  ARRAY['https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=400'],
  ARRAY['poisson fumé', 'bar', 'gabon', 'traditionnel', 'sous-vide'],
  TRUE
),

-- ===== CONGO  (ent e6) =====
(
  uuid_generate_v4(),
  '10000006-0000-0000-0000-000000000006',
  'Gari de manioc fermenté premium',
  'Gari de manioc fermenté 72h et rôti à sec, grains fins, goût légèrement acidulé. Sac 25kg, idéal restauration collective et ménages.',
  'Agro-alimentaire', 'Féculents & Céréales',
  15000.00, 'XAF', 'sac 25kg',
  400, 'CG',
  ARRAY['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'],
  ARRAY['gari', 'manioc', 'congo', 'fermenté', 'amidon'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000006-0000-0000-0000-000000000006',
  'Sauce piment traditionnelle du Congo',
  'Sauce piment maison composée de piments locaux, oignon, ail et huile de palme. Recette ancestrale de Brazzaville. Bocal 300g.',
  'Agro-alimentaire', 'Sauces & Condiments',
  2500.00, 'XAF', 'bocal 300g',
  800, 'CG',
  ARRAY['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400'],
  ARRAY['sauce piment', 'congo', 'traditionnel', 'condiment', 'épices'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000006-0000-0000-0000-000000000006',
  'Haricots niébé secs biologiques',
  'Niébé (Vigna unguiculata) cultivés sans intrants chimiques dans la vallée du Niari. Riche en protéines végétales. Sac 10kg.',
  'Agro-alimentaire', 'Légumineuses',
  9500.00, 'XAF', 'sac 10kg',
  600, 'CG',
  ARRAY['https://images.unsplash.com/photo-1590080876851-7b47c0a22f07?w=400'],
  ARRAY['niébé', 'haricots', 'bio', 'congo', 'protéines'],
  TRUE
),

-- ===== TCHAD  (ent e7) =====
(
  uuid_generate_v4(),
  '10000007-0000-0000-0000-000000000007',
  'Coton fibre longue brut Grade A',
  'Coton fibre longue du Tchad, Grade A, longueur de soie > 28mm. Balle compressée 200kg. Idéal filature et confection textile.',
  'Textile & Fibre', 'Coton brut',
  95000.00, 'XAF', 'balle 200kg',
  120, 'TD',
  ARRAY['https://images.unsplash.com/photo-1594761051656-1c5a9f2b5c0b?w=400'],
  ARRAY['coton', 'tchad', 'fibre', 'textile', 'exportation'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000007-0000-0000-0000-000000000007',
  'Gomme arabique en larmes naturelles',
  'Gomme arabique pure (Acacia senegal) en larmes non transformées, taux d''impuretés < 1%. Sac 50kg. Utilisée en alimentation, pharmacie et cosmétique.',
  'Chimie & Agroforesterie', 'Résines & Gommes',
  55000.00, 'XAF', 'sac 50kg',
  80, 'TD',
  ARRAY['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400'],
  ARRAY['gomme arabique', 'acacia', 'tchad', 'naturel', 'pharma'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000007-0000-0000-0000-000000000007',
  'Dattes Ajwa séchées du Sahel',
  'Dattes fraîches variété Ajwa cultivées dans les oasis du nord du Tchad. Sucrées, moelleuses, séchées naturellement. Boîte 1kg.',
  'Agro-alimentaire', 'Fruits secs',
  7500.00, 'XAF', 'boîte 1kg',
  500, 'TD',
  ARRAY['https://images.unsplash.com/photo-1593465678159-d9b9d1e85d26?w=400'],
  ARRAY['dattes', 'tchad', 'sahel', 'fruits secs', 'naturel'],
  TRUE
),

-- ===== CENTRAFRIQUE  (ent e8) =====
(
  uuid_generate_v4(),
  '10000008-0000-0000-0000-000000000008',
  'Sculpture sur bois de palissandre — Masque traditionnel',
  'Masque traditionnel Banda sculpté à la main dans du bois de palissandre de Centrafrique. Pièce unique, hauteur 35cm, finition huile de lin.',
  'Artisanat & Art', 'Sculptures & Objets d''art',
  45000.00, 'XAF', 'pièce',
  20, 'CF',
  ARRAY['https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?w=400'],
  ARRAY['sculpture', 'bois', 'masque', 'centrafrique', 'artisanat', 'authentique'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000008-0000-0000-0000-000000000008',
  'Colliers perles multicolores — Bijoux Aka',
  'Colliers et bracelets en perles naturelles fabriqués selon la tradition des peuples Aka de RCA. Coloris variés, longuer 50cm.',
  'Artisanat & Art', 'Bijoux & Parures',
  12000.00, 'XAF', 'pièce',
  60, 'CF',
  ARRAY['https://images.unsplash.com/photo-1573408301185-9519f5fd8d18?w=400'],
  ARRAY['bijoux', 'perles', 'centrafrique', 'aka', 'traditionnel'],
  TRUE
),

-- ===== GUINÉE ÉQUATORIALE — Cacao  (ent e9) =====
(
  uuid_generate_v4(),
  '10000009-0000-0000-0000-000000000009',
  'Cacao Grand Cru — Chocolate Noir 72%',
  'Tablette de chocolat noir 72% réalisée à partir de fèves de cacao grand cru de Guinée Équatoriale. Notes fruitées et intensité aromatique exceptionnelle. 100g.',
  'Agro-alimentaire', 'Chocolat & Confiserie',
  9500.00, 'XAF', 'tablette 100g',
  350, 'GQ',
  ARRAY['https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400'],
  ARRAY['chocolat', 'cacao', 'guinée équatoriale', 'grand cru', 'luxe'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000009-0000-0000-0000-000000000009',
  'Poudre de cacao pur 100% non sucrée',
  'Poudre de cacao pur extrait des fèves de Guinée Équatoriale. Taux de beurre de cacao 22%. Sachet 500g pour pâtisserie, boissons chocolatées.',
  'Agro-alimentaire', 'Cacao & Chocolat',
  8000.00, 'XAF', 'sachet 500g',
  400, 'GQ',
  ARRAY['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'],
  ARRAY['poudre de cacao', 'chocolat', 'pâtisserie', 'guinée équatoriale', 'bio'],
  TRUE
),
(
  uuid_generate_v4(),
  '10000009-0000-0000-0000-000000000009',
  'Beurre de cacao vierge cosmétique',
  'Beurre de cacao vierge extrait à froid des fèves de Guinée Équatoriale. Non déodorisé, conserve toutes ses propriétés hydratantes. Pot 250g.',
  'Cosmétique & Bien-être', 'Huiles de beauté',
  11000.00, 'XAF', 'pot 250g',
  200, 'GQ',
  ARRAY['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'],
  ARRAY['beurre de cacao', 'cosmétique', 'hydratant', 'guinée équatoriale', 'naturel'],
  TRUE
)

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- ÉTAPE 4 — COMPTES ADMINISTRATEURS
-- ============================================================
-- ┌─────────────────────────────────────────────────────────┐
-- │  TABLEAU DE BORD ADMIN — Identifiants de connexion      │
-- ├──────────────────┬──────────────────────────────────────┤
-- │  Rôle            │  Email / Mot de passe                │
-- ├──────────────────┼──────────────────────────────────────┤
-- │  super_admin     │  admin@cemac-integra.cm              │
-- │                  │  Admin@CEMAC2026!                    │
-- ├──────────────────┼──────────────────────────────────────┤
-- │  cemac_officer   │  officer@cemac-integra.cm            │
-- │                  │  Officer@CEMAC2026!                  │
-- ├──────────────────┼──────────────────────────────────────┤
-- │  auditor         │  auditor@cemac-integra.cm            │
-- │                  │  Auditor@CEMAC2026!                  │
-- └──────────────────┴──────────────────────────────────────┘

-- 4a. Créer les utilisateurs dans auth.users
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data,
  is_super_admin, confirmation_token, recovery_token,
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
  FALSE, '', '', '', ''
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
  FALSE, '', '', '', ''
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
  FALSE, '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- 4b. Créer les profils correspondants
INSERT INTO public.profiles (id, email, full_name, role, country, language)
VALUES
  (
    'ad000001-0000-0000-0000-000000000001',
    'admin@cemac-integra.cm',
    'Super Administrateur CEMAC',
    'super_admin', 'CM', 'fr'
  ),
  (
    'ad000002-0000-0000-0000-000000000002',
    'officer@cemac-integra.cm',
    'Officier CEMAC',
    'cemac_officer', 'CM', 'fr'
  ),
  (
    'ad000003-0000-0000-0000-000000000003',
    'auditor@cemac-integra.cm',
    'Auditeur CEMAC',
    'auditor', 'CM', 'fr'
  )
ON CONFLICT (id) DO NOTHING;
