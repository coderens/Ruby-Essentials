-- Keep applicant email addresses on the application row so decision notifications can be sent.
ALTER TABLE public.join_applications
  ADD COLUMN IF NOT EXISTS email text;

UPDATE public.join_applications AS application
SET email = auth_user.email
FROM auth.users AS auth_user
WHERE auth_user.id = application.user_id
  AND (application.email IS NULL OR btrim(application.email) = '');

-- Confirmed signups create their membership request in this trigger. Persist the email
-- here too, because email-confirmation signups don't have a browser session at signup time.
CREATE OR REPLACE FUNCTION public.handle_confirmed_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_raw_display_name text;
  v_display_name text;
  v_ign text;
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  v_raw_display_name := btrim(coalesce(NEW.raw_user_meta_data ->> 'display_name', ''));
  v_display_name := left(v_raw_display_name, 60);

  IF char_length(v_display_name) < 2 THEN
    v_display_name := left(btrim(split_part(coalesce(NEW.email, ''), '@', 1)), 60);
  END IF;
  IF char_length(v_display_name) < 2 THEN
    v_display_name := 'Ruby Player';
  END IF;

  v_ign := left(nullif(btrim(NEW.raw_user_meta_data ->> 'ign'), ''), 40);

  INSERT INTO public.profiles (id, display_name, ign)
  VALUES (NEW.id, v_display_name, v_ign)
  ON CONFLICT (id) DO NOTHING;

  IF char_length(v_raw_display_name) >= 2 THEN
    INSERT INTO public.join_applications (user_id, display_name, ign, email, status)
    SELECT NEW.id, v_display_name, v_ign, NEW.email, 'pending'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.join_applications AS existing
      WHERE existing.user_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill confirmed users that may already exist from older application versions.
UPDATE public.join_applications AS application
SET email = auth_user.email
FROM auth.users AS auth_user
WHERE auth_user.id = application.user_id
  AND (application.email IS NULL OR btrim(application.email) = '');
