-- Create the Ruby Essentials profile and membership request when an email signup is confirmed.
-- Auth users who haven't confirmed their email do not receive a profile or join request yet.

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
  -- Guard against any future invocation before email confirmation.
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  v_raw_display_name := btrim(coalesce(NEW.raw_user_meta_data ->> 'display_name', ''));
  v_display_name := left(v_raw_display_name, 60);

  -- Keep the required profile display name valid, even for accounts created outside the site form.
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

  -- The /join form carries a display name. Create one pending application at confirmation;
  -- the existing login flow checks for an existing application to avoid duplicates.
  IF char_length(v_raw_display_name) >= 2 THEN
    INSERT INTO public.join_applications (user_id, display_name, ign, status)
    SELECT NEW.id, v_display_name, v_ign, 'pending'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.join_applications AS existing
      WHERE existing.user_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed_create_profile ON auth.users;

CREATE TRIGGER on_auth_user_confirmed_create_profile
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.handle_confirmed_auth_user();

REVOKE ALL ON FUNCTION public.handle_confirmed_auth_user() FROM PUBLIC, anon, authenticated;

-- Backfill users who confirmed before this trigger was installed.
WITH confirmed_users AS (
  SELECT
    u.id,
    u.raw_user_meta_data,
    u.email,
    CASE
      WHEN char_length(left(btrim(coalesce(u.raw_user_meta_data ->> 'display_name', '')), 60)) >= 2
        THEN left(btrim(u.raw_user_meta_data ->> 'display_name'), 60)
      WHEN char_length(left(btrim(split_part(coalesce(u.email, ''), '@', 1)), 60)) >= 2
        THEN left(btrim(split_part(coalesce(u.email, ''), '@', 1)), 60)
      ELSE 'Ruby Player'
    END AS display_name,
    left(nullif(btrim(u.raw_user_meta_data ->> 'ign'), ''), 40) AS ign
  FROM auth.users AS u
  WHERE u.email_confirmed_at IS NOT NULL
)
INSERT INTO public.profiles (id, display_name, ign)
SELECT id, display_name, ign
FROM confirmed_users
ON CONFLICT (id) DO NOTHING;

WITH confirmed_join_users AS (
  SELECT
    u.id,
    left(btrim(u.raw_user_meta_data ->> 'display_name'), 60) AS display_name,
    left(nullif(btrim(u.raw_user_meta_data ->> 'ign'), ''), 40) AS ign
  FROM auth.users AS u
  WHERE u.email_confirmed_at IS NOT NULL
    AND char_length(btrim(coalesce(u.raw_user_meta_data ->> 'display_name', ''))) BETWEEN 2 AND 60
)
INSERT INTO public.join_applications (user_id, display_name, ign, status)
SELECT c.id, c.display_name, c.ign, 'pending'
FROM confirmed_join_users AS c
WHERE NOT EXISTS (
  SELECT 1 FROM public.join_applications AS existing WHERE existing.user_id = c.id
);
