-- ============================================================
-- CEMAC INTEGRA — Migration 005 — Corridors & Alertes logistique
-- ============================================================

-- Table des corridors de transit CEMAC (gérée par l'admin)
CREATE TABLE IF NOT EXISTS public.corridors (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route      TEXT NOT NULL,
  mode       TEXT NOT NULL DEFAULT 'Route' CHECK (mode IN ('Route', 'Maritime', 'Aérien', 'Ferroviaire', 'Mixte')),
  days       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'Opérationnel' CHECK (status IN ('Opérationnel', 'Ralenti', 'Bloqué', 'En maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_corridors_updated_at
  BEFORE UPDATE ON public.corridors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Table des alertes douanières (gérée par l'admin)
CREATE TABLE IF NOT EXISTS public.logistics_alerts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country    TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'danger')),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_logistics_alerts_updated_at
  BEFORE UPDATE ON public.logistics_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS : lecture publique, écriture admin seulement
ALTER TABLE public.corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corridors_select_all" ON public.corridors FOR SELECT USING (true);
CREATE POLICY "corridors_admin_write" ON public.corridors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','cemac_officer','chamber_agent'))
  );

CREATE POLICY "alerts_select_active" ON public.logistics_alerts FOR SELECT USING (is_active = true);
CREATE POLICY "alerts_admin_select_all" ON public.logistics_alerts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','cemac_officer','chamber_agent'))
  );
CREATE POLICY "alerts_admin_write" ON public.logistics_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin','cemac_officer','chamber_agent'))
  );

-- Seed initial des corridors
INSERT INTO public.corridors (route, mode, days, status) VALUES
  ('Douala → Bangui',           'Route',    '5-7j',  'Opérationnel'),
  ('Pointe-Noire → N''Djamena', 'Mixte',    '8-10j', 'Opérationnel'),
  ('Libreville → Yaoundé',      'Route',    '3-4j',  'Opérationnel'),
  ('Malabo → Douala',           'Maritime', '1-2j',  'Ralenti'),
  ('Bangui → Yaoundé',          'Route',    '4-6j',  'Opérationnel')
ON CONFLICT DO NOTHING;

-- Seed initial des alertes
INSERT INTO public.logistics_alerts (country, message, type) VALUES
  ('🇹🇩 Tchad',        'Nouveaux frais de transit appliqués depuis le 1er janv. 2026', 'info'),
  ('🇨🇫 Centrafrique', 'Délais rallongés au poste frontalier de Garoua-Boulaï',        'warning'),
  ('🇬🇦 Gabon',        'Mise à jour de la nomenclature tarifaire 2026',                'info')
ON CONFLICT DO NOTHING;
