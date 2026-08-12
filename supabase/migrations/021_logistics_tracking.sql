-- CEMAC INTEGRA — production expedition and convoy tracking (forward-only).
BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.expedition_reference_seq;
CREATE SEQUENCE IF NOT EXISTS public.convoy_reference_seq;

CREATE TABLE public.convoys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT (
    'CNV-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('public.convoy_reference_seq')::text, 7, '0')
  ),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  country text NOT NULL CHECK (country IN ('CM', 'CF', 'CG', 'GA', 'GQ', 'TD')),
  origin text NOT NULL CHECK (char_length(btrim(origin)) BETWEEN 2 AND 160),
  destination text NOT NULL CHECK (char_length(btrim(destination)) BETWEEN 2 AND 160),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'planned', 'operational', 'completed', 'cancelled')),
  agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  planned_departure timestamptz,
  planned_arrival timestamptz,
  actual_departure timestamptz,
  actual_arrival timestamptz,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 4000),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (planned_arrival IS NULL OR planned_departure IS NULL OR planned_arrival >= planned_departure),
  CHECK (actual_arrival IS NULL OR actual_departure IS NULL OR actual_arrival >= actual_departure)
);

CREATE TABLE public.expeditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT (
    'EXP-' || to_char(CURRENT_DATE, 'YYYY') || '-' ||
    lpad(nextval('public.expedition_reference_seq')::text, 8, '0')
  ),
  entreprise_id uuid NOT NULL REFERENCES public.entreprises(id) ON DELETE RESTRICT,
  certification_id uuid NOT NULL REFERENCES public.certifications(id) ON DELETE RESTRICT,
  convoy_id uuid REFERENCES public.convoys(id) ON DELETE SET NULL,
  assigned_agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'in_transit', 'checkpoint_hold', 'delivered', 'cancelled')),
  origin_country text NOT NULL CHECK (origin_country IN ('CM', 'CF', 'CG', 'GA', 'GQ', 'TD')),
  origin_city text NOT NULL CHECK (char_length(btrim(origin_city)) BETWEEN 2 AND 160),
  destination_country text NOT NULL CHECK (destination_country IN ('CM', 'CF', 'CG', 'GA', 'GQ', 'TD')),
  destination_city text NOT NULL CHECK (char_length(btrim(destination_city)) BETWEEN 2 AND 160),
  goods_description text NOT NULL CHECK (char_length(btrim(goods_description)) BETWEEN 3 AND 4000),
  gross_weight_kg numeric(14,3) CHECK (gross_weight_kg IS NULL OR gross_weight_kg > 0),
  package_count integer CHECK (package_count IS NULL OR package_count > 0),
  declared_value numeric(16,2) CHECK (declared_value IS NULL OR declared_value >= 0),
  currency text NOT NULL DEFAULT 'XAF' CHECK (currency ~ '^[A-Z]{3}$'),
  expected_departure timestamptz,
  expected_arrival timestamptz,
  delivered_at timestamptz,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 4000),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expected_arrival IS NULL OR expected_departure IS NULL OR expected_arrival >= expected_departure),
  CHECK ((status = 'delivered' AND delivered_at IS NOT NULL) OR status <> 'delivered')
);

CREATE TABLE public.expedition_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid NOT NULL REFERENCES public.expeditions(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created', 'status', 'checkpoint', 'note', 'document')),
  previous_status text,
  new_status text,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 200),
  description text CHECK (description IS NULL OR char_length(description) <= 4000),
  location text CHECK (location IS NULL OR char_length(location) <= 240),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (event_type = 'status' AND new_status IS NOT NULL)
    OR (event_type <> 'status' AND previous_status IS NULL AND new_status IS NULL)
  )
);

CREATE TABLE public.expedition_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expedition_id uuid NOT NULL REFERENCES public.expeditions(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (
    document_type IN ('eur1', 'invoice', 'packing_list', 'customs', 'transport', 'insurance', 'other')
  ),
  file_name text NOT NULL CHECK (char_length(btrim(file_name)) BETWEEN 1 AND 240),
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL CHECK (
    mime_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
  ),
  file_size bigint NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS expedition_id uuid REFERENCES public.expeditions(id) ON DELETE SET NULL;

CREATE INDEX idx_convoys_country_status ON public.convoys(country, status);
CREATE INDEX idx_convoys_agent ON public.convoys(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_expeditions_company_created ON public.expeditions(entreprise_id, created_at DESC);
CREATE INDEX idx_expeditions_status ON public.expeditions(status);
CREATE INDEX idx_expeditions_agent_status ON public.expeditions(assigned_agent_id, status);
CREATE INDEX idx_expeditions_convoy ON public.expeditions(convoy_id) WHERE convoy_id IS NOT NULL;
CREATE INDEX idx_expeditions_certification ON public.expeditions(certification_id);
CREATE INDEX idx_expeditions_route ON public.expeditions(origin_country, destination_country);
CREATE INDEX idx_expedition_events_timeline ON public.expedition_events(expedition_id, created_at DESC);
CREATE INDEX idx_expedition_documents_expedition ON public.expedition_documents(expedition_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expedition ON public.notifications(expedition_id)
  WHERE expedition_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.can_access_expedition(expedition_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.expeditions AS x
    JOIN public.entreprises AS e ON e.id = x.entreprise_id
    LEFT JOIN public.convoys AS c ON c.id = x.convoy_id
    WHERE x.id = expedition_uuid
      AND (
        e.owner_id = auth.uid()
        OR public.get_my_role() IN ('super_admin', 'cemac_officer')
        OR (
          public.get_my_role() = 'chamber_agent'
          AND e.pays = public.get_my_country()
        )
        OR (
          public.get_my_role() = 'logistics_agent'
          AND (x.assigned_agent_id = auth.uid() OR c.agent_id = auth.uid())
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_logistics_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.agent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = NEW.agent_id AND p.role = 'logistics_agent'
  ) THEN
    RAISE EXCEPTION 'convoy agent must have logistics_agent role' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_expedition_links()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  cert_company uuid;
  cert_status text;
  agent_role text;
BEGIN
  SELECT c.entreprise_id, c.statut INTO cert_company, cert_status
  FROM public.certifications c WHERE c.id = NEW.certification_id;
  IF NOT FOUND OR cert_company <> NEW.entreprise_id OR cert_status <> 'approved' THEN
    RAISE EXCEPTION 'expedition requires an approved certification owned by the same company'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.assigned_agent_id IS NOT NULL THEN
    SELECT p.role INTO agent_role FROM public.profiles p WHERE p.id = NEW.assigned_agent_id;
    IF agent_role IS DISTINCT FROM 'logistics_agent' THEN
      RAISE EXCEPTION 'assigned agent must have logistics_agent role' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_convoy_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.reference IS DISTINCT FROM OLD.reference
     OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'convoy identity fields are immutable' USING ERRCODE = '42501';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
    (OLD.status = 'draft' AND NEW.status IN ('planned', 'cancelled'))
    OR (OLD.status = 'planned' AND NEW.status IN ('operational', 'cancelled'))
    OR (OLD.status = 'operational' AND NEW.status IN ('completed', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'invalid convoy status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_expedition_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  caller_role text := public.get_my_role();
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.reference IS DISTINCT FROM OLD.reference
     OR NEW.entreprise_id IS DISTINCT FROM OLD.entreprise_id
     OR NEW.certification_id IS DISTINCT FROM OLD.certification_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'expedition identity fields are immutable' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'draft' AND NEW.status IN ('ready', 'cancelled'))
      OR (OLD.status = 'ready' AND NEW.status IN ('in_transit', 'cancelled'))
      OR (OLD.status = 'in_transit' AND NEW.status IN ('checkpoint_hold', 'delivered', 'cancelled'))
      OR (OLD.status = 'checkpoint_hold' AND NEW.status IN ('in_transit', 'cancelled'))
    ) THEN
      RAISE EXCEPTION 'invalid expedition status transition: % -> %', OLD.status, NEW.status
        USING ERRCODE = '23514';
    END IF;
    IF caller_role = 'company_admin' AND NOT (OLD.status = 'draft' AND NEW.status IN ('ready', 'cancelled')) THEN
      RAISE EXCEPTION 'company administrators may only ready or cancel draft expeditions'
        USING ERRCODE = '42501';
    END IF;
    IF caller_role NOT IN ('company_admin', 'logistics_agent', 'super_admin', 'cemac_officer', 'chamber_agent') THEN
      RAISE EXCEPTION 'role cannot transition expeditions' USING ERRCODE = '42501';
    END IF;
    IF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    ELSIF NEW.status <> 'delivered' THEN
      NEW.delivered_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_expedition_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  owner_user uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.expedition_events (
      expedition_id, event_type, new_status, title, created_by
    ) VALUES (NEW.id, 'status', NEW.status, 'Expedition created', NEW.created_by);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.expedition_events (
      expedition_id, event_type, previous_status, new_status, title, created_by
    ) VALUES (
      NEW.id, 'status', OLD.status, NEW.status, 'Status: ' || OLD.status || ' → ' || NEW.status,
      COALESCE(actor, NEW.created_by)
    );
    SELECT e.owner_id INTO owner_user
    FROM public.entreprises e WHERE e.id = NEW.entreprise_id;
    IF owner_user IS NOT NULL AND owner_user IS DISTINCT FROM actor THEN
      INSERT INTO public.notifications (user_id, type, title, body, message, expedition_id)
      VALUES (
        owner_user, 'expedition', 'Expedition ' || NEW.reference,
        'Status updated to ' || NEW.status, 'Status updated to ' || NEW.status, NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_expedition_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'expedition events are immutable' USING ERRCODE = '42501';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_expedition_document()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF split_part(NEW.storage_path, '/', 1) <> NEW.expedition_id::text
     OR NEW.storage_path ~ '(^|/)\.\.?(/|$)' THEN
    RAISE EXCEPTION 'document path must start with the expedition UUID'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER convoys_updated_at BEFORE UPDATE ON public.convoys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER expeditions_updated_at BEFORE UPDATE ON public.expeditions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER validate_convoy_agent BEFORE INSERT OR UPDATE ON public.convoys
  FOR EACH ROW EXECUTE FUNCTION public.validate_logistics_profile();
CREATE TRIGGER validate_convoy_status BEFORE UPDATE ON public.convoys
  FOR EACH ROW EXECUTE FUNCTION public.validate_convoy_transition();
CREATE TRIGGER validate_expedition_relationships BEFORE INSERT OR UPDATE ON public.expeditions
  FOR EACH ROW EXECUTE FUNCTION public.validate_expedition_links();
CREATE TRIGGER validate_expedition_status BEFORE UPDATE ON public.expeditions
  FOR EACH ROW EXECUTE FUNCTION public.validate_expedition_transition();
CREATE TRIGGER audit_expedition_status AFTER INSERT OR UPDATE OF status ON public.expeditions
  FOR EACH ROW EXECUTE FUNCTION public.audit_expedition_status();
CREATE TRIGGER expedition_events_immutable BEFORE UPDATE OR DELETE ON public.expedition_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_expedition_event_mutation();
CREATE TRIGGER validate_expedition_document_path BEFORE INSERT OR UPDATE ON public.expedition_documents
  FOR EACH ROW EXECUTE FUNCTION public.validate_expedition_document();

ALTER TABLE public.convoys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedition_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedition_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY convoys_select_scope ON public.convoys FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('super_admin', 'cemac_officer')
  OR (public.get_my_role() = 'chamber_agent' AND country = public.get_my_country())
  OR (public.get_my_role() = 'logistics_agent' AND agent_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.expeditions x WHERE x.convoy_id = convoys.id AND public.can_access_expedition(x.id))
);
CREATE POLICY convoys_insert_staff ON public.convoys FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.get_my_role() IN ('super_admin', 'cemac_officer')
    OR (public.get_my_role() = 'chamber_agent' AND country = public.get_my_country())
    OR (public.get_my_role() = 'logistics_agent' AND agent_id = auth.uid())
  )
);
CREATE POLICY convoys_update_staff ON public.convoys FOR UPDATE TO authenticated
USING (
  public.get_my_role() IN ('super_admin', 'cemac_officer')
  OR (public.get_my_role() = 'chamber_agent' AND country = public.get_my_country())
  OR (public.get_my_role() = 'logistics_agent' AND agent_id = auth.uid())
)
WITH CHECK (
  public.get_my_role() IN ('super_admin', 'cemac_officer')
  OR (public.get_my_role() = 'chamber_agent' AND country = public.get_my_country())
  OR (public.get_my_role() = 'logistics_agent' AND agent_id = auth.uid())
);

CREATE POLICY expeditions_select_access ON public.expeditions FOR SELECT TO authenticated
USING (public.can_access_expedition(id));
CREATE POLICY expeditions_insert_company ON public.expeditions FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND public.get_my_role() = 'company_admin'
  AND EXISTS (
    SELECT 1 FROM public.entreprises e
    WHERE e.id = expeditions.entreprise_id
      AND e.owner_id = auth.uid()
      AND e.subscription_plan IN ('enterprise', 'institutional')
      AND e.subscription_status IN ('active', 'trialing')
  )
);
CREATE POLICY expeditions_update_access ON public.expeditions FOR UPDATE TO authenticated
USING (public.can_access_expedition(id))
WITH CHECK (public.can_access_expedition(id));

CREATE POLICY expedition_events_select_access ON public.expedition_events FOR SELECT TO authenticated
USING (public.can_access_expedition(expedition_id));
CREATE POLICY expedition_events_insert_access ON public.expedition_events FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND event_type IN ('checkpoint', 'note')
  AND public.can_access_expedition(expedition_id)
);

CREATE POLICY expedition_documents_select_access ON public.expedition_documents FOR SELECT TO authenticated
USING (public.can_access_expedition(expedition_id));
CREATE POLICY expedition_documents_insert_access ON public.expedition_documents FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid() AND public.can_access_expedition(expedition_id));
CREATE POLICY expedition_documents_delete_own_draft ON public.expedition_documents FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid()
  AND public.can_access_expedition(expedition_id)
  AND EXISTS (SELECT 1 FROM public.expeditions x WHERE x.id = expedition_id AND x.status = 'draft')
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expedition-docs', 'expedition-docs', false, 10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Expedition documents read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'expedition-docs'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND public.can_access_expedition(((storage.foldername(name))[1])::uuid)
);
CREATE POLICY "Expedition documents upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'expedition-docs'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND public.can_access_expedition(((storage.foldername(name))[1])::uuid)
  AND lower(storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')
);
CREATE POLICY "Expedition documents delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'expedition-docs'
  AND owner_id = auth.uid()::text
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND public.can_access_expedition(((storage.foldername(name))[1])::uuid)
);

REVOKE ALL ON FUNCTION public.can_access_expedition(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_expedition(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.audit_expedition_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_logistics_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_expedition_links() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_convoy_transition() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_expedition_transition() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_expedition_event_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_expedition_document() FROM PUBLIC, anon, authenticated;

REVOKE UPDATE, DELETE, TRUNCATE ON public.expedition_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.notifications FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.convoys, public.expeditions TO authenticated;
GRANT SELECT, INSERT ON public.expedition_events TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.expedition_documents TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.expedition_reference_seq, public.convoy_reference_seq TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.expeditions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expedition_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.convoys;

COMMENT ON TABLE public.expedition_events IS 'Append-only logistics audit timeline.';
COMMENT ON COLUMN public.expedition_documents.storage_path IS 'Private expedition-docs object path: <expedition UUID>/<random UUID>.<ext>.';

COMMIT;
