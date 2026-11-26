-- Allow administrators to review every join application while keeping member
-- access limited to their own application row.
-- The role claim must be set in app_metadata by a trusted administrator.

GRANT UPDATE (status) ON public.join_applications TO authenticated;

DROP POLICY IF EXISTS "Admins can view all applications" ON public.join_applications;
CREATE POLICY "Admins can view all applications"
  ON public.join_applications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can decide pending applications" ON public.join_applications;
CREATE POLICY "Admins can decide pending applications"
  ON public.join_applications
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND status = 'pending'
  )
  WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    AND status IN ('approved', 'rejected')
  );

