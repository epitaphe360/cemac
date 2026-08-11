-- CEMAC INTEGRA - idempotent production CMS seed.
-- Values are migrated from the frontend constants as of migration 017.

BEGIN;

INSERT INTO public.site_settings (key, value, description, is_public) VALUES
  ('app.identity', '{"name":"CEMAC INTEGRA","version":"2.0.0","tagline":{"fr":"L''infrastructure numérique du commerce africain certifié","en":"The digital infrastructure of certified African trade"}}', 'Public application identity', true),
  ('contact.primary', '{"email":"contact@cemacintegra.com","phone":"+237 699 000 000","city":"Yaoundé","country_code":"CM"}', 'Primary public contact details', true),
  ('contact.support', '{"email":"support@cemac-integra.org","phone":"+237 222 123 456","hours":{"fr":"Lun–Ven, 8h–17h (WAT)","en":"Mon–Fri, 8am–5pm (WAT)"},"website":"www.cemac-integra.org"}', 'Assistant support details', true),
  ('social.links', '{"linkedin":"https://linkedin.com","twitter":"https://twitter.com"}', 'Public social links', true),
  ('currency.default', '{"code":"XAF","locale":"fr-FR"}', 'Default billing currency', true),
  ('logistics.origin_rules', '{"cemac":{"threshold":40,"label":{"fr":"CEMAC","en":"CEMAC"},"agreement":{"fr":"TEC CEMAC","en":"CEMAC Common External Tariff"}},"zlecaf":{"threshold":30,"label":{"fr":"ZLECAF","en":"AfCFTA"},"agreement":{"fr":"ZLECAF","en":"AfCFTA"}},"eu":{"threshold":50,"label":{"fr":"UE","en":"EU"},"agreement":{"fr":"APE (Accord de Partenariat Économique)","en":"EPA (Economic Partnership Agreement)"}},"cedeao":{"threshold":35,"label":{"fr":"CEDEAO","en":"ECOWAS"},"agreement":{"fr":"TEC CEDEAO","en":"ECOWAS Common External Tariff"}}}', 'Preferential origin thresholds used by the calculator', true),
  ('media.landing', '{"hero":"https://images.unsplash.com/photo-1586528116311-ad8ed3c84a0f?q=80&w=2940&auto=format&fit=crop","countries":{"CM":"https://images.unsplash.com/photo-1519062325381-0814bd0392dc?q=80&w=800&auto=format&fit=crop","GA":"https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop","CG":"https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=800&auto=format&fit=crop","GQ":"https://images.unsplash.com/photo-1563804868019-2187cc87ea0b?q=80&w=800&auto=format&fit=crop","TD":"https://images.unsplash.com/photo-1511228227653-b09e13cf624c?q=80&w=800&auto=format&fit=crop","CF":"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop"}}', 'Landing media URLs', true)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public,
  updated_at = now();

INSERT INTO public.content_blocks (page, section, key, locale, content, media_url, sort_order, is_published, published_at) VALUES
  ('landing','hero','main','fr','{"badge":"Solution Logistique Espace CEMAC","title":"Propulsez l''Afrique Centrale vers le Monde.","description":"La plateforme d''intelligence métier pour l''import/export. Traçabilité connectée, suivi logistique et certification digitale pour les entreprises de la zone.","primary_cta":"Accéder au Portail","secondary_cta":"Espace Connecté"}',NULL,10,true,now()),
  ('landing','hero','main','en','{"badge":"CEMAC Zone Logistics Solution","title":"Power Central Africa Towards the World.","description":"The business intelligence platform for import/export. Connected traceability, logistics tracking and digital certification for companies in the zone.","primary_cta":"Access the Portal","secondary_cta":"Connected Space"}',NULL,10,true,now()),
  ('landing','countries','intro','fr','{"title":"6 Nations. 1 Écosystème Digital.","description":"Une solution logicielle qui facilite les opérations transfrontalières et le commerce inter-régional pour les entreprises."}',NULL,20,true,now()),
  ('landing','countries','intro','en','{"title":"6 Nations. 1 Digital Ecosystem.","description":"A software solution that facilitates cross-border operations and inter-regional trade for companies."}',NULL,20,true,now()),
  ('landing','countries','cm','fr','{"code":"CM","flag":"🇨🇲","name":"Cameroun","description":"Hub portuaire et moteur économique"}','https://images.unsplash.com/photo-1519062325381-0814bd0392dc?q=80&w=800&auto=format&fit=crop',21,true,now()),
  ('landing','countries','cm','en','{"code":"CM","flag":"🇨🇲","name":"Cameroon","description":"Port hub and economic engine"}','https://images.unsplash.com/photo-1519062325381-0814bd0392dc?q=80&w=800&auto=format&fit=crop',21,true,now()),
  ('landing','countries','ga','fr','{"code":"GA","flag":"🇬🇦","name":"Gabon","description":"Engagement vert et modernisation"}','https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop',22,true,now()),
  ('landing','countries','ga','en','{"code":"GA","flag":"🇬🇦","name":"Gabon","description":"Green commitment and modernization"}','https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop',22,true,now()),
  ('landing','countries','cg','fr','{"code":"CG","flag":"🇨🇬","name":"Congo","description":"Carrefour logistique régional"}','https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=800&auto=format&fit=crop',23,true,now()),
  ('landing','countries','cg','en','{"code":"CG","flag":"🇨🇬","name":"Congo","description":"Regional logistics crossroads"}','https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=800&auto=format&fit=crop',23,true,now()),
  ('landing','countries','gq','fr','{"code":"GQ","flag":"🇬🇶","name":"Guinée Équatoriale","description":"Enjeux énergétiques majeurs"}','https://images.unsplash.com/photo-1563804868019-2187cc87ea0b?q=80&w=800&auto=format&fit=crop',24,true,now()),
  ('landing','countries','gq','en','{"code":"GQ","flag":"🇬🇶","name":"Equatorial Guinea","description":"Major energy challenges"}','https://images.unsplash.com/photo-1563804868019-2187cc87ea0b?q=80&w=800&auto=format&fit=crop',24,true,now()),
  ('landing','countries','td','fr','{"code":"TD","flag":"🇹🇩","name":"Tchad","description":"Partenaire transsaharien"}','https://images.unsplash.com/photo-1511228227653-b09e13cf624c?q=80&w=800&auto=format&fit=crop',25,true,now()),
  ('landing','countries','td','en','{"code":"TD","flag":"🇹🇩","name":"Chad","description":"Trans-Saharan partner"}','https://images.unsplash.com/photo-1511228227653-b09e13cf624c?q=80&w=800&auto=format&fit=crop',25,true,now()),
  ('landing','countries','cf','fr','{"code":"CF","flag":"🇨🇫","name":"Centrafrique","description":"Ressources et minerais stratégiques"}','https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',26,true,now()),
  ('landing','countries','cf','en','{"code":"CF","flag":"🇨🇫","name":"Central African Republic","description":"Resources and strategic minerals"}','https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',26,true,now()),
  ('landing','features','certificates','fr','{"title":"Certificats Origine","description":"Émis et authentifiés sur un registre sécurisé en quelques minutes."}',NULL,30,true,now()),
  ('landing','features','certificates','en','{"title":"Origin Certificates","description":"Issued and authenticated on a secure registry in minutes."}',NULL,30,true,now()),
  ('landing','features','corridors','fr','{"title":"Traçabilité Corridor","description":"Suivi documentaire des convois pour une logistique optimisée."}',NULL,31,true,now()),
  ('landing','features','corridors','en','{"title":"Corridor Traceability","description":"Documentary tracking of convoys for optimized logistics."}',NULL,31,true,now()),
  ('landing','features','compliance','fr','{"title":"Conformité Métier","description":"Outils d''audit pour les acteurs économiques et les chambres de commerce."}',NULL,32,true,now()),
  ('landing','features','compliance','en','{"title":"Business Compliance","description":"Audit tools for economic actors and chambers of commerce."}',NULL,32,true,now()),
  ('about','hero','main','fr','{"badge":"Notre mission","title":"Numériser le commerce africain certifié","description":"CEMAC INTEGRA est né d''un constat simple : les PME africaines méritent des outils numériques modernes pour certifier leurs produits, développer leurs marchés et participer pleinement à l''intégration régionale."}',NULL,10,true,now()),
  ('about','vision','main','fr','{"badge":"Notre vision","title":"L''Afrique Centrale, hub commercial certifié du continent","paragraphs":["Nous croyons en un espace CEMAC où chaque produit local peut accéder aux marchés régionaux et internationaux avec la même crédibilité qu''un produit européen ou asiatique.","Notre plateforme dématérialise les processus de certification qui prenaient des mois, les ramène à quelques semaines et rend le commerce transfrontalier accessible aux PME de toutes tailles."],"benefits":["Certification 100 % numérique et légalement reconnue","Plateforme disponible dans les 6 langues CEMAC","Support des paiements mobiles locaux","Formation et accompagnement inclus"]}',NULL,20,true,now()),
  ('about','values','integrity','fr','{"title":"Intégrité","description":"Chaque certification émise sur notre plateforme est vérifiable, traçable et authentique."}',NULL,30,true,now()),
  ('about','values','regional-integration','fr','{"title":"Intégration régionale","description":"Nous croyons en une Afrique Centrale unie, où les échanges sont fluides et les produits reconnus."}',NULL,31,true,now()),
  ('about','values','inclusion','fr','{"title":"Inclusion","description":"Les PME africaines méritent les mêmes outils que les grandes multinationales — c''est notre mission."}',NULL,32,true,now()),
  ('about','values','innovation','fr','{"title":"Innovation","description":"L''intelligence artificielle et la blockchain au service de la certification et du commerce africain."}',NULL,33,true,now()),
  ('logistics','eur1','overview','fr','{"title":"Certificat de circulation EUR.1","description":"Le certificat EUR.1 atteste l''origine préférentielle des marchandises dans le cadre des Accords de Partenariat Économique (APE) entre l''Union Européenne et les pays ACP.","processing_time":"3 – 5 jours ouvrés","validity":"10 mois","disclaimer":"Projet non officiel, non enregistré et sans valeur douanière."}',NULL,10,true,now()),
  ('logistics','eur1','overview','en','{"title":"EUR.1 movement certificate","description":"The EUR.1 certificate attests to the preferential origin of goods under the Economic Partnership Agreements between the European Union and ACP countries.","processing_time":"3–5 business days","validity":"10 months","disclaimer":"Unofficial draft, not registered and without customs value."}',NULL,10,true,now()),
  ('logistics','eur1','required-documents','fr','{"items":["Certification CEMAC INTEGRA approuvée","Facture pro-forma ou commerciale","Liste de colisage (packing list)","Déclaration d''exportation douanière","Justificatif de règles d''origine (≥ 50 % valeur locale)","Certificat sanitaire ou phytosanitaire si requis"]}',NULL,20,true,now()),
  ('logistics','eur1','required-documents','en','{"items":["Approved CEMAC INTEGRA certification","Pro forma or commercial invoice","Packing list","Customs export declaration","Origin-rule evidence (≥ 50% local value)","Health or phytosanitary certificate when required"]}',NULL,20,true,now()),
  ('footer','brand','description','fr','{"text":"L''infrastructure numérique du commerce africain certifié. Plateforme SaaS B2G/B2B pour la certification, le marquage et l''intelligence de marché dans l''espace CEMAC et ZLECAF."}',NULL,10,true,now()),
  ('footer','brand','description','en','{"text":"The digital infrastructure of certified African trade. A B2G/B2B SaaS platform for certification, product marking, and market intelligence across CEMAC and AfCFTA."}',NULL,10,true,now())
ON CONFLICT (page, section, key, locale) DO UPDATE SET
  content = EXCLUDED.content,
  media_url = EXCLUDED.media_url,
  sort_order = EXCLUDED.sort_order,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at,
  updated_at = now();

INSERT INTO public.team_members (slug, full_name, role, country_code, country_label, initials, sort_order, is_published) VALUES
  ('koffi-mensah','Dr. Koffi Mensah','{"fr":"CEO & Co-fondateur","en":"CEO & Co-founder"}','CM','{"fr":"🇨🇲 Cameroun","en":"🇨🇲 Cameroon"}','KM',10,true),
  ('aisha-diallo','Aïsha Diallo','{"fr":"CTO & Co-fondatrice","en":"CTO & Co-founder"}','GA','{"fr":"🇬🇦 Gabon","en":"🇬🇦 Gabon"}','AD',20,true),
  ('pierre-ekanga','Pierre Ekanga','{"fr":"Directeur Opérations CEMAC","en":"CEMAC Operations Director"}','CG','{"fr":"🇨🇬 Congo","en":"🇨🇬 Congo"}','PE',30,true),
  ('mariam-toure','Mariam Toure','{"fr":"Directrice Partenariats","en":"Partnerships Director"}','TD','{"fr":"🇹🇩 Tchad","en":"🇹🇩 Chad"}','MT',40,true),
  ('jean-claude-biya','Jean-Claude Biya','{"fr":"Lead Certification","en":"Certification Lead"}','CM','{"fr":"🇨🇲 Cameroun","en":"🇨🇲 Cameroon"}','JB',50,true),
  ('sylvie-ngozi','Sylvie Ngozi','{"fr":"Head of Design","en":"Head of Design"}','GQ','{"fr":"🇬🇶 Guinée Éq.","en":"🇬🇶 Equatorial Guinea"}','SN',60,true)
ON CONFLICT (slug) DO UPDATE SET full_name=EXCLUDED.full_name, role=EXCLUDED.role,
  country_code=EXCLUDED.country_code, country_label=EXCLUDED.country_label,
  initials=EXCLUDED.initials, sort_order=EXCLUDED.sort_order, is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.partners (slug, name, description, sort_order, is_published) VALUES
  ('cemac','CEMAC','{"fr":"Communauté Économique et Monétaire de l''Afrique Centrale","en":"Economic and Monetary Community of Central Africa"}',10,true),
  ('unctad','UNCTAD','{"fr":"Conférence des Nations Unies sur le Commerce et le Développement","en":"United Nations Conference on Trade and Development"}',20,true),
  ('cci-cemac','CCI CEMAC','{"fr":"Réseau des Chambres de Commerce Régionales","en":"Regional Chambers of Commerce Network"}',30,true),
  ('afdb','BAD','{"fr":"Banque Africaine de Développement — Programme fintech","en":"African Development Bank — Fintech programme"}',40,true)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  sort_order=EXCLUDED.sort_order, is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.milestones (slug, year, title, description, sort_order, is_published) VALUES
  ('launch-2023',2023,'{"fr":"Lancement","en":"Launch"}','{"fr":"Lancement du projet CEMAC INTEGRA, premiers partenariats avec les chambres de commerce","en":"CEMAC INTEGRA project launch and first chamber of commerce partnerships"}',10,true),
  ('pilot-2024',2024,'{"fr":"Pilote régional","en":"Regional pilot"}','{"fr":"Pilote dans 3 pays (Cameroun, Gabon, Congo) — 250 certifications délivrées","en":"Pilot in 3 countries (Cameroon, Gabon, Congo) — 250 certifications issued"}',20,true),
  ('expansion-2025',2025,'{"fr":"Extension CEMAC","en":"CEMAC expansion"}','{"fr":"Extension à 6 pays CEMAC. 1 000 entreprises inscrites. Ouverture de la Marketplace.","en":"Expansion to 6 CEMAC countries. 1,000 registered companies. Marketplace launch."}',30,true),
  ('intelligence-2026',2026,'{"fr":"Intelligence de marché","en":"Market intelligence"}','{"fr":"Lancement de l''intelligence de marché IA. Intégration ZLECAF. 2 000+ entreprises.","en":"AI market intelligence launch. AfCFTA integration. 2,000+ companies."}',40,true)
ON CONFLICT (slug) DO UPDATE SET year=EXCLUDED.year, title=EXCLUDED.title,
  description=EXCLUDED.description, sort_order=EXCLUDED.sort_order,
  is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.marketing_stats (key, label, display_value, numeric_value, source, sort_order, is_published) VALUES
  ('countries','{"fr":"Pays CEMAC","en":"CEMAC countries"}','{"fr":"6","en":"6"}',6,'CEMAC membership',10,true)
ON CONFLICT (key) DO UPDATE SET label=EXCLUDED.label, display_value=EXCLUDED.display_value,
  numeric_value=EXCLUDED.numeric_value, source=EXCLUDED.source, sort_order=EXCLUDED.sort_order,
  is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.pricing_plans (id, name, description, monthly_price, yearly_price, currency, badge, cta, sort_order, is_published) VALUES
  ('free','{"fr":"Starter","en":"Starter"}','{"fr":"Pour découvrir la plateforme et tester vos premiers dossiers.","en":"Discover the platform and test your first applications."}',0,0,'XAF',NULL,'{"fr":{"label":"Commencer gratuitement","href":"/auth/register"},"en":{"label":"Get started free","href":"/auth/register"}}',10,true),
  ('sme','{"fr":"Pro","en":"Pro"}','{"fr":"Pour les PME qui souhaitent certifier et commercialiser leurs produits à l''échelle CEMAC.","en":"For SMEs seeking to certify and market products across CEMAC."}',29000,270000,'XAF','{"fr":"Le plus populaire","en":"Most popular"}','{"fr":{"label":"Commencer en Pro","href":"/auth/register?plan=sme"},"en":{"label":"Start Pro","href":"/auth/register?plan=sme"}}',20,true),
  ('enterprise','{"fr":"Enterprise","en":"Enterprise"}','{"fr":"Pour les grandes entreprises et groupes nécessitant une couverture complète et sur mesure.","en":"For large companies and groups requiring comprehensive custom coverage."}',99000,900000,'XAF',NULL,'{"fr":{"label":"Contacter les ventes","href":"/contact"},"en":{"label":"Contact sales","href":"/contact"}}',30,true),
  ('institutional','{"fr":"Institutionnel & réseaux consulaires","en":"Institutional & chamber networks"}','{"fr":"Pour les organisations d''appui au commerce, chambres consulaires et structures régionales.","en":"For trade support organizations, chambers and regional bodies."}',NULL,NULL,'XAF',NULL,'{"fr":{"label":"Nous contacter","href":"/contact"},"en":{"label":"Contact us","href":"/contact"}}',40,true)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description,
  monthly_price=EXCLUDED.monthly_price, yearly_price=EXCLUDED.yearly_price,
  currency=EXCLUDED.currency, badge=EXCLUDED.badge, cta=EXCLUDED.cta,
  sort_order=EXCLUDED.sort_order, is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.pricing_plan_features (plan_id, feature_key, label, is_included, sort_order) VALUES
  ('free','certifications-monthly','{"fr":"2 certifications / mois","en":"2 certifications / month"}',true,10),
  ('free','users','{"fr":"1 compte utilisateur","en":"1 user account"}',true,20),
  ('free','marketplace-read','{"fr":"Accès marketplace (lecture)","en":"Marketplace access (read-only)"}',true,30),
  ('free','qr-basic','{"fr":"QR Code basique","en":"Basic QR code"}',true,40),
  ('free','community-support','{"fr":"Support communauté","en":"Community support"}',true,50),
  ('free','certifications-unlimited','{"fr":"Certifications illimitées","en":"Unlimited certifications"}',false,60),
  ('free','market-intelligence','{"fr":"Intelligence de marché","en":"Market intelligence"}',false,70),
  ('free','exports','{"fr":"Export XML/JSON/PDF","en":"XML/JSON/PDF export"}',false,80),
  ('free','api','{"fr":"API REST","en":"REST API"}',false,90),
  ('free','priority-support','{"fr":"Support prioritaire","en":"Priority support"}',false,100),
  ('sme','certifications-unlimited','{"fr":"Certifications illimitées","en":"Unlimited certifications"}',true,10),
  ('sme','users','{"fr":"5 comptes utilisateurs","en":"5 user accounts"}',true,20),
  ('sme','marketplace-publish','{"fr":"Marketplace (publication)","en":"Marketplace publishing"}',true,30),
  ('sme','qr-pro','{"fr":"QR Code professionnel","en":"Professional QR code"}',true,40),
  ('sme','market-intelligence-basic','{"fr":"Intelligence de marché basique","en":"Basic market intelligence"}',true,50),
  ('sme','pdf-export','{"fr":"Export PDF certifications","en":"Certification PDF export"}',true,60),
  ('sme','email-support','{"fr":"Support email 48h","en":"48-hour email support"}',true,70),
  ('sme','logistics','{"fr":"Module logistique","en":"Logistics module"}',false,80),
  ('sme','api','{"fr":"API REST complète","en":"Full REST API"}',false,90),
  ('sme','account-manager','{"fr":"Account manager dédié","en":"Dedicated account manager"}',false,100),
  ('enterprise','certifications-unlimited','{"fr":"Certifications illimitées","en":"Unlimited certifications"}',true,10),
  ('enterprise','users-unlimited','{"fr":"Utilisateurs illimités","en":"Unlimited users"}',true,20),
  ('enterprise','marketplace-premium','{"fr":"Marketplace premium","en":"Premium marketplace"}',true,30),
  ('enterprise','market-intelligence-full','{"fr":"Intelligence de marché complète","en":"Full market intelligence"}',true,40),
  ('enterprise','logistics','{"fr":"Module logistique & transit","en":"Logistics & transit module"}',true,50),
  ('enterprise','api-webhooks','{"fr":"API REST + webhooks","en":"REST API + webhooks"}',true,60),
  ('enterprise','exports','{"fr":"Export XML/JSON/PDF","en":"XML/JSON/PDF export"}',true,70),
  ('enterprise','support-247','{"fr":"Support prioritaire 24/7","en":"24/7 priority support"}',true,80),
  ('enterprise','account-manager','{"fr":"Account manager dédié","en":"Dedicated account manager"}',true,90),
  ('enterprise','onboarding','{"fr":"Onboarding personnalisé","en":"Custom onboarding"}',true,100),
  ('institutional','custom-access','{"fr":"Accès complet sur mesure","en":"Full custom access"}',true,10),
  ('institutional','sla','{"fr":"SLA garanti","en":"Guaranteed SLA"}',true,20),
  ('institutional','account-manager','{"fr":"Account manager dédié","en":"Dedicated account manager"}',true,30),
  ('institutional','erp-api','{"fr":"Intégration ERP/API personnalisée","en":"Custom ERP/API integration"}',true,40)
ON CONFLICT (plan_id, feature_key) DO UPDATE SET label=EXCLUDED.label,
  is_included=EXCLUDED.is_included, sort_order=EXCLUDED.sort_order, updated_at=now();

INSERT INTO public.pricing_faqs (slug, question, answer, sort_order, is_published) VALUES
  ('change-plan','{"fr":"Puis-je changer de plan à tout moment ?","en":"Can I change plans at any time?"}','{"fr":"Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis les paramètres de votre compte. Le changement prend effet immédiatement.","en":"Yes. You can upgrade or downgrade at any time from account settings. The change takes effect immediately."}',10,true),
  ('payment','{"fr":"Comment se passe le paiement ?","en":"How does payment work?"}','{"fr":"Le paiement en libre-service n’est pas encore activé. Contactez notre équipe commerciale pour connaître les modalités disponibles et recevoir une facture après validation.","en":"Self-service payment is not enabled yet. Contact sales for available terms and an invoice after approval."}',20,true),
  ('trial','{"fr":"Y a-t-il une période d''essai pour les plans payants ?","en":"Is there a trial for paid plans?"}','{"fr":"Non, il n''y a pas de période d''essai automatique active pour le moment. L''activation se fait après souscription.","en":"No automatic trial is currently active. Activation follows subscription."}',30,true),
  ('official-recognition','{"fr":"Les certifications émises sont-elles reconnues officiellement ?","en":"Are issued certifications officially recognized?"}','{"fr":"Oui, CEMAC INTEGRA est partenaire des chambres de commerce CEMAC. Les certifications émises via la plateforme ont la même valeur légale que les certifications papier traditionnelles.","en":"Yes. CEMAC INTEGRA partners with CEMAC chambers of commerce and platform certifications have the same legal value as traditional paper certificates."}',40,true),
  ('expiration','{"fr":"Que se passe-t-il à l''expiration de mon abonnement ?","en":"What happens when my subscription expires?"}','{"fr":"Vos données et certifications restent accessibles. Vous passez automatiquement au plan Starter (2 certifications/mois). Aucune donnée n''est supprimée.","en":"Your data and certifications remain accessible. You automatically move to Starter (2 certifications/month). No data is deleted."}',50,true)
ON CONFLICT (slug) DO UPDATE SET question=EXCLUDED.question, answer=EXCLUDED.answer,
  sort_order=EXCLUDED.sort_order, is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.contact_offices (slug, country_code, country_name, city, address, phone, is_headquarters, sort_order, is_published) VALUES
  ('yaounde','CM','{"fr":"🇨🇲 Cameroun","en":"🇨🇲 Cameroon"}','Yaoundé','{"fr":"Avenue de l''Indépendance, BP 1234","en":"Avenue de l''Indépendance, PO Box 1234"}','+237 699 000 000',true,10,true),
  ('libreville','GA','{"fr":"🇬🇦 Gabon","en":"🇬🇦 Gabon"}','Libreville','{"fr":"Boulevard Triomphal Omar Bongo","en":"Boulevard Triomphal Omar Bongo"}','+241 01 60 00 00',false,20,true),
  ('brazzaville','CG','{"fr":"🇨🇬 Congo","en":"🇨🇬 Congo"}','Brazzaville','{"fr":"Avenue de la Paix, Centre Commercial","en":"Avenue de la Paix, Centre Commercial"}','+242 06 600 0000',false,30,true)
ON CONFLICT (slug) DO UPDATE SET country_code=EXCLUDED.country_code, country_name=EXCLUDED.country_name,
  city=EXCLUDED.city, address=EXCLUDED.address, phone=EXCLUDED.phone,
  is_headquarters=EXCLUDED.is_headquarters, sort_order=EXCLUDED.sort_order,
  is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.contact_reasons (slug, label, sort_order, is_published) VALUES
  ('demo','{"fr":"Demande de démonstration","en":"Demo request"}',10,true),
  ('subscription','{"fr":"Question sur un abonnement","en":"Subscription question"}',20,true),
  ('technical-support','{"fr":"Support technique","en":"Technical support"}',30,true),
  ('institutional-partnership','{"fr":"Partenariat institutionnel","en":"Institutional partnership"}',40,true),
  ('press','{"fr":"Presse & médias","en":"Press & media"}',50,true),
  ('other','{"fr":"Autre","en":"Other"}',60,true)
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, sort_order=EXCLUDED.sort_order,
  is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.commodity_baselines (key, world_bank_indicator, name, country_code, xaf_unit, category, usd_unit, usd_price, source_url, sort_order, is_published) VALUES
  ('raw-cocoa','PCOCOA','{"fr":"Cacao brut","en":"Raw cocoa"}','CM','{"fr":"tonne","en":"metric ton"}','{"fr":"Agricole","en":"Agricultural"}','metric_ton',8900,'https://api.worldbank.org/v2/country/all/indicator/PCOCOA',10,true),
  ('robusta-coffee','PCOFFOTM','{"fr":"Café Robusta","en":"Robusta coffee"}','CM','{"fr":"tonne","en":"metric ton"}','{"fr":"Agricole","en":"Agricultural"}','metric_ton',4200,'https://api.worldbank.org/v2/country/all/indicator/PCOFFOTM',20,true),
  ('okoume-wood',NULL,'{"fr":"Bois Okoumé","en":"Okoume wood"}','GA','{"fr":"m³","en":"m³"}','{"fr":"Forestier","en":"Forestry"}','cubic_meter',290,NULL,30,true),
  ('brent-crude','POILBRE','{"fr":"Pétrole brut (Brent)","en":"Brent crude oil"}','CG','{"fr":"baril","en":"barrel"}','{"fr":"Énergie","en":"Energy"}','barrel',82,'https://api.worldbank.org/v2/country/all/indicator/POILBRE',40,true),
  ('seed-cotton','PCOTTIND','{"fr":"Coton graine","en":"Seed cotton"}','TD','{"fr":"tonne","en":"metric ton"}','{"fr":"Agricole","en":"Agricultural"}','metric_ton',1820,'https://api.worldbank.org/v2/country/all/indicator/PCOTTIND',50,true),
  ('raw-sugar','PSUGAUSA','{"fr":"Sucre roux","en":"Raw sugar"}','CM','{"fr":"tonne","en":"metric ton"}','{"fr":"Agricole","en":"Agricultural"}','metric_ton',430,'https://api.worldbank.org/v2/country/all/indicator/PSUGAUSA',60,true),
  ('wenge-wood',NULL,'{"fr":"Bois Wengé","en":"Wenge wood"}','CG','{"fr":"m³","en":"m³"}','{"fr":"Forestier","en":"Forestry"}','cubic_meter',1040,NULL,70,true),
  ('uranium-u3o8',NULL,'{"fr":"Uranium (U3O8)","en":"Uranium (U3O8)"}','CF','{"fr":"kg","en":"kg"}','{"fr":"Minier","en":"Mining"}','kg',110,NULL,80,true),
  ('natural-gas-lng','PNGASEU','{"fr":"Gaz naturel (GNL)","en":"Natural gas (LNG)"}','GQ','{"fr":"MMBTU","en":"MMBTU"}','{"fr":"Énergie","en":"Energy"}','mmbtu',9.5,'https://api.worldbank.org/v2/country/all/indicator/PNGASEU',90,true),
  ('plantain',NULL,'{"fr":"Banane Plantain","en":"Plantain"}','CM','{"fr":"tonne","en":"metric ton"}','{"fr":"Agricole","en":"Agricultural"}','metric_ton',330,NULL,100,true)
ON CONFLICT (key) DO UPDATE SET world_bank_indicator=EXCLUDED.world_bank_indicator,
  name=EXCLUDED.name, country_code=EXCLUDED.country_code, xaf_unit=EXCLUDED.xaf_unit,
  category=EXCLUDED.category, usd_unit=EXCLUDED.usd_unit, usd_price=EXCLUDED.usd_price,
  source_url=EXCLUDED.source_url, sort_order=EXCLUDED.sort_order,
  is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.assistant_knowledge (slug, patterns, answer, tags, sort_order, is_published) VALUES
  ('origin-rules',ARRAY['règle.* origine','origin.*rule','seuil.*%'],'{"fr":"**Règles d''origine CEMAC / ZLECAF**\n\nLes seuils de valeur ajoutée locale requis sont :\n• **CEMAC** : 40 % minimum\n• **ZLECAF** : 30 % minimum\n• **APE (UE)** : 50 % minimum (ouvre droit au EUR.1)\n• **CEDEAO** : 35 % minimum\n\nLe calcul : (Coût total − Matières importées) / Coût total × 100.","en":"**CEMAC / AfCFTA origin rules**\n\nRequired local added-value thresholds:\n• **CEMAC**: 40%\n• **AfCFTA**: 30%\n• **EPA (EU)**: 50% (EUR.1 eligibility)\n• **ECOWAS**: 35%\n\nFormula: (Total cost − Imported materials) / Total cost × 100."}',ARRAY['origin','cemac','zlecaf'],10,true),
  ('eur1',ARRAY['eur\\.?1','certificat.*circulation','movement.*certificate'],'{"fr":"**Certificat EUR.1**\n\nConditions : certification CEMAC INTEGRA approuvée, valeur ajoutée locale ≥ 50 %, produit originaire d''un pays ACP. Délai : 3-5 jours ouvrés. Validité : 10 mois.","en":"**EUR.1 certificate**\n\nConditions: approved CEMAC INTEGRA certification, local added value ≥ 50%, and ACP-country origin. Processing: 3–5 business days. Validity: 10 months."}',ARRAY['eur1','origin','eu'],20,true),
  ('afcfta',ARRAY['zlecaf','afcfta','zone.*libre.*échange.*afric'],'{"fr":"**ZLECAF — Zone de Libre-Échange Continentale Africaine**\n\nEntrée en vigueur en 2021, elle couvre 55 pays africains. Elle prévoit une réduction progressive des droits de douane sur jusqu''à 90 % des lignes tarifaires et un seuil indicatif de 30 % de valeur ajoutée locale.","en":"**AfCFTA — African Continental Free Trade Area**\n\nEffective since 2021, it covers 55 African countries, with progressive tariff reductions on up to 90% of tariff lines and an indicative 30% local added-value threshold."}',ARRAY['zlecaf','afcfta'],30,true),
  ('tec-cemac',ARRAY['droits.*douane','tarif.*douan','customs.*dut','tec cemac'],'{"fr":"**Tarif Extérieur Commun (TEC) CEMAC**\n\nCatégorie 1 : 5 % · Catégorie 2 : 10 % · Catégorie 3 : 20 % · Catégorie 4 : 30 %.","en":"**CEMAC Common External Tariff**\n\nCategory 1: 5% · Category 2: 10% · Category 3: 20% · Category 4: 30%."}',ARRAY['customs','tec'],40,true),
  ('commodity-prices',ARRAY['cacao','café','coton','bois.*prix','prix.*march','commodity.*price'],'{"fr":"Consultez l''Observatoire des Prix pour les dernières références annuelles de la Banque mondiale converties en XAF. Ces valeurs ne sont ni des cours en direct, ni des offres commerciales.","en":"See the Price Observatory for the latest World Bank annual references converted to XAF. They are neither live prices nor commercial offers."}',ARRAY['prices','commodities'],50,true),
  ('made-in-cemac',ARRAY['label.*cemac','certif.*made.*in','made in cemac'],'{"fr":"Le label Made in CEMAC certifie une fabrication dans l''espace CEMAC, une valeur ajoutée locale ≥ 40 % et le respect des normes qualité applicables.","en":"The Made in CEMAC label certifies manufacturing in CEMAC, local added value ≥ 40%, and compliance with applicable quality standards."}',ARRAY['certification','label'],60,true),
  ('support',ARRAY['contact','aide','support','help'],'{"fr":"Support : support@cemac-integra.org · +237 222 123 456 · Lun–Ven, 8h–17h (WAT).","en":"Support: support@cemac-integra.org · +237 222 123 456 · Mon–Fri, 8am–5pm (WAT)."}',ARRAY['support'],70,true)
ON CONFLICT (slug) DO UPDATE SET patterns=EXCLUDED.patterns, answer=EXCLUDED.answer,
  tags=EXCLUDED.tags, sort_order=EXCLUDED.sort_order,
  is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.product_categories (slug, label, sort_order, is_published) VALUES
  ('agri-food','{"fr":"Agro-alimentaire","en":"Agri-food"}',10,true),
  ('wood-forestry','{"fr":"Bois & Forêt","en":"Wood & Forestry"}',20,true),
  ('cosmetics-wellness','{"fr":"Cosmétique & Bien-être","en":"Cosmetics & Wellness"}',30,true),
  ('fishing-aquaculture','{"fr":"Pêche & Aquaculture","en":"Fishing & Aquaculture"}',40,true),
  ('textiles-fibre','{"fr":"Textile & Fibre","en":"Textiles & Fibre"}',50,true),
  ('chemicals-agroforestry','{"fr":"Chimie & Agroforesterie","en":"Chemicals & Agroforestry"}',60,true),
  ('crafts-art','{"fr":"Artisanat & Art","en":"Crafts & Art"}',70,true),
  ('other','{"fr":"Autre","en":"Other"}',80,true)
ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, sort_order=EXCLUDED.sort_order,
  is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.tax_rates (country_code, country_name, rate, effective_from, source, is_active) VALUES
  ('CM','{"fr":"Cameroun","en":"Cameroon"}',19.25,'2026-01-01','Frontend billing reference migrated in 017',true),
  ('GA','{"fr":"Gabon","en":"Gabon"}',18.00,'2026-01-01','Frontend billing reference migrated in 017',true),
  ('CG','{"fr":"Congo","en":"Congo"}',18.90,'2026-01-01','Frontend billing reference migrated in 017',true),
  ('TD','{"fr":"Tchad","en":"Chad"}',18.00,'2026-01-01','Frontend billing reference migrated in 017',true),
  ('CF','{"fr":"Centrafrique","en":"Central African Republic"}',19.00,'2026-01-01','Frontend billing reference migrated in 017',true),
  ('GQ','{"fr":"Guinée Équatoriale","en":"Equatorial Guinea"}',15.00,'2026-01-01','Frontend billing reference migrated in 017',true)
ON CONFLICT (country_code) DO UPDATE SET country_name=EXCLUDED.country_name,
  rate=EXCLUDED.rate, effective_from=EXCLUDED.effective_from, source=EXCLUDED.source,
  is_active=EXCLUDED.is_active, updated_at=now();

INSERT INTO public.legal_documents (slug, locale, title, sections, effective_date, is_published) VALUES
  ('cgu','fr','Conditions Générales d''Utilisation',
   '[{"heading":"1. Objet","paragraphs":["Les présentes Conditions Générales d''Utilisation (CGU) régissent l''accès et l''utilisation de la plateforme CEMAC INTEGRA, service numérique dédié à la certification d''origine, au commerce et à la logistique dans l''espace CEMAC.","En créant un compte ou en utilisant la plateforme, vous acceptez sans réserve les présentes CGU."]},{"heading":"2. Services proposés","paragraphs":["CEMAC INTEGRA permet aux entreprises de soumettre des dossiers de certification, de gérer leurs produits sur la marketplace, d''accéder aux outils logistiques et aux données de marché.","Les certifications délivrées via la plateforme sont soumises aux règles applicables de la zone CEMAC et aux procédures des chambres de commerce partenaires."]},{"heading":"3. Comptes utilisateurs","paragraphs":["Chaque utilisateur est responsable de la confidentialité de ses identifiants. Toute activité réalisée depuis un compte est réputée effectuée par son titulaire.","CEMAC INTEGRA se réserve le droit de suspendre ou supprimer un compte en cas de violation des CGU ou de fraude documentaire."]},{"heading":"4. Abonnements et paiements","paragraphs":["Certains services sont proposés sous forme d''abonnements payants. Les tarifs en vigueur sont affichés sur la page Tarifs.","Les paiements sont traités par des prestataires tiers sécurisés (Stripe, Mobile Money, virement bancaire). Aucune donnée bancaire complète n''est stockée sur nos serveurs."]},{"heading":"5. Propriété intellectuelle","paragraphs":["La marque CEMAC INTEGRA, le logo, l''interface et les contenus éditoriaux sont protégés. Toute reproduction non autorisée est interdite.","Les documents téléversés par les utilisateurs restent leur propriété ; l''utilisateur accorde à CEMAC INTEGRA une licence limitée pour les traiter dans le cadre des services."]},{"heading":"6. Limitation de responsabilité","paragraphs":["CEMAC INTEGRA met en œuvre les moyens raisonnables pour assurer la disponibilité et la sécurité du service, sans garantie d''absence d''interruption.","La plateforme ne saurait être tenue responsable des pertes indirectes liées à l''utilisation du service ou aux décisions prises sur la base des informations affichées."]},{"heading":"7. Droit applicable","paragraphs":["Les présentes CGU sont soumises au droit camerounais et aux textes communautaires CEMAC applicables.","En cas de litige, les parties s''efforceront de trouver une solution amiable avant toute action judiciaire."]}]',
   '2026-06-29',true),
  ('privacy','fr','Politique de confidentialité',
   '[{"heading":"1. Responsable du traitement","paragraphs":["CEMAC INTEGRA, dont le siège est à Yaoundé (Cameroun), est responsable du traitement des données personnelles collectées via la plateforme.","Contact : contact@cemacintegra.com"]},{"heading":"2. Données collectées","paragraphs":["Nous collectons : identité (nom, email, téléphone), données entreprise (raison sociale, pays, secteur), documents de certification, logs de connexion et préférences de notification.","Les données de paiement sont traitées directement par nos prestataires certifiés PCI-DSS."]},{"heading":"3. Finalités","paragraphs":["Vos données sont utilisées pour : gestion des comptes, traitement des dossiers de certification, facturation, communication transactionnelle, amélioration du service et conformité réglementaire."]},{"heading":"4. Base légale et conservation","paragraphs":["Le traitement repose sur l''exécution du contrat, l''intérêt légitime et, le cas échéant, votre consentement.","Les données sont conservées pendant la durée du compte actif, puis archivées conformément aux obligations légales (jusqu''à 10 ans pour les dossiers de certification)."]},{"heading":"5. Vos droits","paragraphs":["Vous disposez d''un droit d''accès, de rectification, d''effacement, de limitation, de portabilité et d''opposition.","Pour exercer vos droits : contact@cemacintegra.com. Vous pouvez également introduire une réclamation auprès de l''autorité de protection des données compétente."]},{"heading":"6. Sécurité","paragraphs":["Les données sont hébergées sur Supabase (infrastructure cloud sécurisée). L''accès est protégé par chiffrement TLS, authentification et politiques RLS (Row Level Security)."]}]',
   '2026-06-29',true),
  ('cookies','fr','Politique de cookies',
   '[{"heading":"1. Qu''est-ce qu''un cookie ?","paragraphs":["Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d''un site web. Il permet de mémoriser des préférences ou de mesurer l''audience."]},{"heading":"2. Cookies utilisés","paragraphs":["Cookies essentiels : session d''authentification Supabase (cemac-integra-auth), nécessaires au fonctionnement du compte.","Cookies de préférence : langue (fr/en) via i18next.","Cookies analytiques : Sentry (monitoring d''erreurs en production, si activé)."]},{"heading":"3. Gestion des cookies","paragraphs":["Vous pouvez configurer votre navigateur pour refuser les cookies non essentiels. Le refus des cookies essentiels empêchera la connexion à votre espace."]}]',
   '2026-06-29',true),
  ('legal','fr','Mentions légales',
   '[{"heading":"Éditeur","paragraphs":["CEMAC INTEGRA — Plateforme régionale de certification et commerce","Siège : Yaoundé, Cameroun","Email : contact@cemacintegra.com · Tél. : +237 699 000 000"]},{"heading":"Hébergement","paragraphs":["Frontend : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis","Backend & base de données : Supabase Inc., région EU (eu-west-1)"]},{"heading":"Directeur de la publication","paragraphs":["Dr. Koffi Mensah — CEO, CEMAC INTEGRA"]},{"heading":"Propriété intellectuelle","paragraphs":["L''ensemble du contenu du site (textes, graphismes, logo, logiciels) est la propriété de CEMAC INTEGRA ou de ses partenaires. Toute reproduction est soumise à autorisation préalable."]}]',
   '2026-06-29',true)
ON CONFLICT (slug, locale) DO UPDATE SET title=EXCLUDED.title, sections=EXCLUDED.sections,
  effective_date=EXCLUDED.effective_date, is_published=EXCLUDED.is_published, updated_at=now();

-- Public marketing copy required by the CMS-rendered pages.
INSERT INTO public.content_blocks (page, section, key, locale, content, media_url, sort_order, is_published, published_at) VALUES
  ('landing','hero','main','fr','{"badge":"Solution Logistique Espace CEMAC","title":"Propulsez l''Afrique Centrale vers le Monde.","description":"La plateforme d''intelligence métier pour l''import/export. Traçabilité connectée, suivi logistique et certification digitale pour les entreprises de la zone.","primary_cta":"Accéder au Portail","secondary_cta":"Espace Connecté","image_alt":"Port d''Afrique centrale"}',NULL,10,true,now()),
  ('landing','hero','main','en','{"badge":"CEMAC Zone Logistics Solution","title":"Power Central Africa Towards the World.","description":"The business intelligence platform for import/export. Connected traceability, logistics tracking and digital certification for companies in the zone.","primary_cta":"Access the Portal","secondary_cta":"Connected Space","image_alt":"Central African port"}',NULL,10,true,now()),
  ('landing','live','main','fr','{"title":"Suivi logistique","status":"En transit","item_label":"Dossier de démonstration","item_status":"Certification approuvée","aria_label":"Aperçu illustratif du suivi logistique"}',NULL,15,true,now()),
  ('landing','live','main','en','{"title":"Logistics tracking","status":"In transit","item_label":"Demo application","item_status":"Certification approved","aria_label":"Illustrative logistics tracking preview"}',NULL,15,true,now()),
  ('landing','features','intro','fr','{"title":"La technologie au service du commerce régional"}',NULL,29,true,now()),
  ('landing','features','intro','en','{"title":"Technology serving regional trade"}',NULL,29,true,now()),
  ('about','hero','main','en','{"badge":"Our mission","title":"Digitize certified African trade","description":"CEMAC INTEGRA was born from a simple observation: African SMEs deserve modern digital tools to certify their products, develop their markets and fully participate in regional integration."}',NULL,10,true,now()),
  ('about','vision','main','en','{"badge":"Our vision","title":"Central Africa, the continent''s certified trade hub","paragraphs":["We believe in a CEMAC area where every local product can reach regional and international markets with the same credibility as a European or Asian product.","Our platform digitizes certification processes that used to take months, reduces them to a few weeks and makes cross-border trade accessible to SMEs of every size."],"benefits":["100% digital and legally recognized certification","Platform available across the six CEMAC countries","Support for local mobile payments","Training and assistance included"]}',NULL,20,true,now()),
  ('about','values','intro','fr','{"title":"Nos valeurs","description":"Les principes qui guident nos décisions au quotidien"}',NULL,29,true,now()),
  ('about','values','intro','en','{"title":"Our values","description":"The principles guiding our everyday decisions"}',NULL,29,true,now()),
  ('about','values','integrity','en','{"title":"Integrity","description":"Every certification issued on our platform is verifiable, traceable and authentic."}',NULL,30,true,now()),
  ('about','values','regional-integration','en','{"title":"Regional integration","description":"We believe in a united Central Africa where trade flows smoothly and products are recognized."}',NULL,31,true,now()),
  ('about','values','inclusion','en','{"title":"Inclusion","description":"African SMEs deserve the same tools as large multinationals — that is our mission."}',NULL,32,true,now()),
  ('about','values','innovation','en','{"title":"Innovation","description":"Artificial intelligence and blockchain serving African certification and trade."}',NULL,33,true,now()),
  ('about','sections','main','fr','{"team_title":"Notre équipe","team_description":"Des experts issus des 6 pays CEMAC","milestones_title":"Notre parcours","milestones_description":"De l''idée à la plateforme panafricaine","partners_title":"Partenaires & organisations membres"}',NULL,40,true,now()),
  ('about','sections','main','en','{"team_title":"Our team","team_description":"Experts from the six CEMAC countries","milestones_title":"Our journey","milestones_description":"From an idea to a pan-African platform","partners_title":"Partners & member organizations"}',NULL,40,true,now()),
  ('about','countries','intro','fr','{"title":"Zone d''opération — Espace CEMAC"}',NULL,50,true,now()),
  ('about','countries','intro','en','{"title":"Operating area — CEMAC region"}',NULL,50,true,now()),
  ('about','countries','cm','fr','{"flag":"🇨🇲","name":"Cameroun"}',NULL,51,true,now()),
  ('about','countries','cm','en','{"flag":"🇨🇲","name":"Cameroon"}',NULL,51,true,now()),
  ('about','countries','ga','fr','{"flag":"🇬🇦","name":"Gabon"}',NULL,52,true,now()),
  ('about','countries','ga','en','{"flag":"🇬🇦","name":"Gabon"}',NULL,52,true,now()),
  ('about','countries','cg','fr','{"flag":"🇨🇬","name":"Congo"}',NULL,53,true,now()),
  ('about','countries','cg','en','{"flag":"🇨🇬","name":"Congo"}',NULL,53,true,now()),
  ('about','countries','gq','fr','{"flag":"🇬🇶","name":"Guinée Équatoriale"}',NULL,54,true,now()),
  ('about','countries','gq','en','{"flag":"🇬🇶","name":"Equatorial Guinea"}',NULL,54,true,now()),
  ('about','countries','td','fr','{"flag":"🇹🇩","name":"Tchad"}',NULL,55,true,now()),
  ('about','countries','td','en','{"flag":"🇹🇩","name":"Chad"}',NULL,55,true,now()),
  ('about','countries','cf','fr','{"flag":"🇨🇫","name":"Centrafrique"}',NULL,56,true,now()),
  ('about','countries','cf','en','{"flag":"🇨🇫","name":"Central African Republic"}',NULL,56,true,now()),
  ('about','cta','main','fr','{"title":"Rejoignez le mouvement","description":"Faites partie des entreprises qui construisent l''Afrique Centrale de demain.","label":"Créer mon compte gratuit"}',NULL,60,true,now()),
  ('about','cta','main','en','{"title":"Join the movement","description":"Be part of the companies building tomorrow''s Central Africa.","label":"Create my free account"}',NULL,60,true,now()),
  ('contact','hero','main','fr','{"title":"Contactez-nous","description":"Notre équipe est disponible pour répondre à toutes vos questions. Nous répondons généralement sous 24 heures."}',NULL,10,true,now()),
  ('contact','hero','main','en','{"title":"Contact us","description":"Our team is available to answer all your questions. We usually reply within 24 hours."}',NULL,10,true,now()),
  ('contact','response','main','fr','{"title":"Délai de réponse","items":[{"label":"Support général","value":"24h"},{"label":"Support technique","value":"4h"},{"label":"Démo commerciale","value":"48h"}]}',NULL,20,true,now()),
  ('contact','response','main','en','{"title":"Response time","items":[{"label":"General support","value":"24h"},{"label":"Technical support","value":"4h"},{"label":"Sales demo","value":"48h"}]}',NULL,20,true,now()),
  ('contact','countries','main','fr','{"items":[{"code":"CM","label":"🇨🇲 Cameroun"},{"code":"GA","label":"🇬🇦 Gabon"},{"code":"CG","label":"🇨🇬 Congo"},{"code":"GQ","label":"🇬🇶 Guinée Équatoriale"},{"code":"TD","label":"🇹🇩 Tchad"},{"code":"CF","label":"🇨🇫 Centrafrique"},{"code":"other","label":"Autre"}]}',NULL,30,true,now()),
  ('contact','countries','main','en','{"items":[{"code":"CM","label":"🇨🇲 Cameroon"},{"code":"GA","label":"🇬🇦 Gabon"},{"code":"CG","label":"🇨🇬 Congo"},{"code":"GQ","label":"🇬🇶 Equatorial Guinea"},{"code":"TD","label":"🇹🇩 Chad"},{"code":"CF","label":"🇨🇫 Central African Republic"},{"code":"other","label":"Other"}]}',NULL,30,true,now()),
  ('contact','ui','main','fr','{"channels_title":"Canaux directs","offices_title":"Nos bureaux","headquarters":"Siège","form_title":"Envoyez-nous un message","name_label":"Nom complet","name_placeholder":"Marie Dupont","email_label":"Email professionnel","email_placeholder":"marie@entreprise.cm","company_label":"Entreprise","company_placeholder":"Nom de votre entreprise","country_label":"Pays","country_placeholder":"Sélectionner un pays","reason_label":"Objet de votre demande","message_label":"Message","message_placeholder":"Décrivez votre demande...","submit":"Envoyer le message","required_error":"Veuillez remplir les champs obligatoires.","success_toast":"Message envoyé avec succès !","send_error":"Votre message n’a pas pu être envoyé. Veuillez réessayer ou nous écrire par e-mail.","success_title":"Message envoyé !","success_description":"Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.","send_another":"Envoyer un autre message"}',NULL,40,true,now()),
  ('contact','ui','main','en','{"channels_title":"Direct channels","offices_title":"Our offices","headquarters":"Head office","form_title":"Send us a message","name_label":"Full name","name_placeholder":"Marie Dupont","email_label":"Work email","email_placeholder":"marie@company.cm","company_label":"Company","company_placeholder":"Your company name","country_label":"Country","country_placeholder":"Select a country","reason_label":"Reason for contacting us","message_label":"Message","message_placeholder":"Describe your request...","submit":"Send message","required_error":"Please complete all required fields.","success_toast":"Message sent successfully!","send_error":"Your message could not be sent. Please try again or email us.","success_title":"Message sent!","success_description":"Thank you for your message. Our team will reply as soon as possible.","send_another":"Send another message"}',NULL,40,true,now()),
  ('footer','brand','description','fr','{"text":"L''infrastructure numérique du commerce africain certifié. Plateforme SaaS B2G/B2B pour la certification, le marquage et l''intelligence de marché dans l''espace CEMAC et ZLECAF.","initials":"CI"}',NULL,10,true,now()),
  ('footer','brand','description','en','{"text":"The digital infrastructure of certified African trade. A B2G/B2B SaaS platform for certification, product marking, and market intelligence across CEMAC and AfCFTA.","initials":"CI"}',NULL,10,true,now()),
  ('footer','cta','main','fr','{"title":"Prêt à transformer votre commerce ?","description":"Rejoignez les entreprises qui certifient et développent leurs produits dans l''espace CEMAC.","primary_label":"Commencer gratuitement","secondary_label":"Contacter les ventes"}',NULL,20,true,now()),
  ('footer','cta','main','en','{"title":"Ready to transform your trade?","description":"Join the companies certifying and growing their products across the CEMAC region.","primary_label":"Start for free","secondary_label":"Contact sales"}',NULL,20,true,now())
ON CONFLICT (page, section, key, locale) DO UPDATE SET
  content=EXCLUDED.content, media_url=EXCLUDED.media_url, sort_order=EXCLUDED.sort_order,
  is_published=EXCLUDED.is_published, published_at=EXCLUDED.published_at, updated_at=now();

INSERT INTO public.marketing_stats (key, label, display_value, numeric_value, source, sort_order, is_published) VALUES
  ('companies','{"fr":"Entreprises","en":"Companies"}','{"fr":"2 000+","en":"2,000+"}',2000,'CEMAC INTEGRA',20,true),
  ('certifications','{"fr":"Certifications","en":"Certifications"}','{"fr":"12 500+","en":"12,500+"}',12500,'CEMAC INTEGRA',30,true),
  ('satisfaction','{"fr":"Satisfaction","en":"Satisfaction"}','{"fr":"98 %","en":"98%"}',98,'CEMAC INTEGRA',40,true)
ON CONFLICT (key) DO UPDATE SET label=EXCLUDED.label, display_value=EXCLUDED.display_value,
  numeric_value=EXCLUDED.numeric_value, source=EXCLUDED.source, sort_order=EXCLUDED.sort_order,
  is_published=EXCLUDED.is_published, updated_at=now();

INSERT INTO public.legal_documents (slug, locale, title, sections, effective_date, is_published) VALUES
  ('cgu','en','Terms of Use','[{"heading":"1. Purpose","paragraphs":["These Terms of Use govern access to and use of the CEMAC INTEGRA platform, a digital service for origin certification, trade and logistics in the CEMAC region.","By creating an account or using the platform, you accept these Terms without reservation."]},{"heading":"2. Services","paragraphs":["CEMAC INTEGRA enables companies to submit certification applications, manage marketplace products and access logistics and market-data tools.","Certifications issued through the platform remain subject to applicable CEMAC rules and partner chambers of commerce procedures."]},{"heading":"3. User accounts","paragraphs":["Each user is responsible for keeping their credentials confidential and for activity performed through their account.","CEMAC INTEGRA may suspend or delete an account in the event of a breach or document fraud."]},{"heading":"4. Subscriptions and payments","paragraphs":["Some services are offered as paid subscriptions. Current prices appear on the Pricing page.","Payments are processed by secure third-party providers. Complete banking data is not stored on our servers."]},{"heading":"5. Intellectual property","paragraphs":["The CEMAC INTEGRA brand, logo, interface and editorial content are protected. Unauthorized reproduction is prohibited."]},{"heading":"6. Liability","paragraphs":["CEMAC INTEGRA uses reasonable means to maintain service availability and security without guaranteeing uninterrupted operation."]},{"heading":"7. Applicable law","paragraphs":["These Terms are governed by Cameroonian law and applicable CEMAC community texts."]}]','2026-06-29',true),
  ('privacy','en','Privacy Policy','[{"heading":"1. Data controller","paragraphs":["CEMAC INTEGRA, headquartered in Yaoundé, Cameroon, controls personal data collected through the platform.","Contact: contact@cemacintegra.com"]},{"heading":"2. Data collected","paragraphs":["We collect identity, company, certification document, connection log and notification preference data.","Payment data is processed directly by PCI-DSS-certified providers."]},{"heading":"3. Purposes","paragraphs":["Your data is used for account management, certification processing, billing, transactional communication, service improvement and regulatory compliance."]},{"heading":"4. Legal basis and retention","paragraphs":["Processing is based on contract performance, legitimate interest and, where applicable, consent."]},{"heading":"5. Your rights","paragraphs":["You have rights of access, rectification, erasure, restriction, portability and objection.","To exercise your rights, contact contact@cemacintegra.com."]},{"heading":"6. Security","paragraphs":["Data is hosted on Supabase and protected through TLS encryption, authentication and row-level security policies."]}]','2026-06-29',true),
  ('cookies','en','Cookie Policy','[{"heading":"1. What is a cookie?","paragraphs":["A cookie is a small text file stored on your device when visiting a website."]},{"heading":"2. Cookies used","paragraphs":["Essential cookies support Supabase authentication sessions.","Preference cookies store the selected language through i18next.","Analytics cookies support production error monitoring when enabled."]},{"heading":"3. Cookie management","paragraphs":["You can configure your browser to reject non-essential cookies. Rejecting essential cookies prevents account sign-in."]}]','2026-06-29',true),
  ('legal','en','Legal Notice','[{"heading":"Publisher","paragraphs":["CEMAC INTEGRA — Regional certification and trade platform","Head office: Yaoundé, Cameroon","Email: contact@cemacintegra.com · Phone: +237 699 000 000"]},{"heading":"Hosting","paragraphs":["Frontend: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States","Backend and database: Supabase Inc., EU region (eu-west-1)"]},{"heading":"Publication director","paragraphs":["Dr. Koffi Mensah — CEO, CEMAC INTEGRA"]},{"heading":"Intellectual property","paragraphs":["All site content is owned by CEMAC INTEGRA or its partners. Reproduction requires prior authorization."]}]','2026-06-29',true)
ON CONFLICT (slug, locale) DO UPDATE SET title=EXCLUDED.title, sections=EXCLUDED.sections,
  effective_date=EXCLUDED.effective_date, is_published=EXCLUDED.is_published, updated_at=now();

COMMIT;
