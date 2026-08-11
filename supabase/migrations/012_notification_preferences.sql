-- Add notification_preferences jsonb column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb NULL;
