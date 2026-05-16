-- =============================================
-- Account self-deletion RPC
-- =============================================
-- Allows the currently authenticated user to delete their own auth.users row.
-- All user-owned tables that reference auth.users(id) ON DELETE CASCADE
-- (profiles, push_tokens, collections, saved_items, etc.) are removed automatically.

CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_account() TO authenticated;
