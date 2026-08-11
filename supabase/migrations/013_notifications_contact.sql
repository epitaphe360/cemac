-- ============================================================
-- 009b — Tables notifications & contact_requests
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type             TEXT NOT NULL DEFAULT 'system',
  title            TEXT,
  body             TEXT,
  message          TEXT,
  read             BOOLEAN NOT NULL DEFAULT FALSE,
  certification_id UUID REFERENCES public.certifications(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read) WHERE read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;
CREATE POLICY "notifications_insert_service"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.contact_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  company     TEXT,
  country     TEXT,
  reason      TEXT,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_insert_public" ON public.contact_requests;
CREATE POLICY "contacts_insert_public"
  ON public.contact_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contacts_select_admin" ON public.contact_requests;
CREATE POLICY "contacts_select_admin"
  ON public.contact_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));
