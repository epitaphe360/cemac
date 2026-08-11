-- Move assistant prompt suggestions out of frontend translations.

BEGIN;

ALTER TABLE public.assistant_knowledge
  ADD COLUMN suggestion jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.assistant_knowledge
SET suggestion = CASE slug
  WHEN 'origin-rules' THEN '{"fr":"Quels sont les seuils d''origine CEMAC ?","en":"What are the CEMAC origin thresholds?"}'::jsonb
  WHEN 'eur1' THEN '{"fr":"Comment obtenir un certificat EUR.1 ?","en":"How to obtain a EUR.1 certificate?"}'::jsonb
  WHEN 'afcfta' THEN '{"fr":"Qu''est-ce que la ZLECAF ?","en":"What is the AfCFTA?"}'::jsonb
  WHEN 'tec-cemac' THEN '{"fr":"Quels sont les droits de douane TEC CEMAC ?","en":"What are the TEC CEMAC customs duties?"}'::jsonb
  WHEN 'commodity-prices' THEN '{"fr":"Prix actuels des matières premières","en":"Current commodity prices"}'::jsonb
  ELSE '{}'::jsonb
END;

COMMENT ON COLUMN public.assistant_knowledge.suggestion IS
  'Optional localized prompt displayed as an assistant quick action.';

COMMIT;
