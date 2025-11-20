-- Fix security warning: Set search_path for function
-- First drop the trigger, then the function
DROP TRIGGER IF EXISTS set_anonymous_message_limits_updated_at ON public.anonymous_message_limits;
DROP FUNCTION IF EXISTS update_anonymous_message_limits_updated_at();

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION update_anonymous_message_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER set_anonymous_message_limits_updated_at
  BEFORE UPDATE ON public.anonymous_message_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_anonymous_message_limits_updated_at();