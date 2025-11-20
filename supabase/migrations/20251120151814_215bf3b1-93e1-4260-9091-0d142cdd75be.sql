-- Create table for tracking anonymous message rate limits
CREATE TABLE IF NOT EXISTS public.anonymous_message_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.anonymous_message_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own message limits"
  ON public.anonymous_message_limits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own message limits"
  ON public.anonymous_message_limits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own message limits"
  ON public.anonymous_message_limits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to check and update message limit
CREATE OR REPLACE FUNCTION public.check_anonymous_message_limit(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit RECORD;
  v_max_messages INTEGER := 5;
  v_reset_hours INTEGER := 24;
BEGIN
  -- Get or create limit record
  SELECT * INTO v_limit
  FROM public.anonymous_message_limits
  WHERE user_id = p_user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.anonymous_message_limits (user_id, message_count, last_reset_at)
    VALUES (p_user_id, 0, NOW())
    RETURNING * INTO v_limit;
  END IF;

  -- Check if we need to reset (24 hours passed)
  IF NOW() - v_limit.last_reset_at > INTERVAL '24 hours' THEN
    UPDATE public.anonymous_message_limits
    SET message_count = 0, last_reset_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_limit;
  END IF;

  -- Check if user has exceeded limit
  IF v_limit.message_count >= v_max_messages THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'message_count', v_limit.message_count,
      'reset_at', v_limit.last_reset_at + INTERVAL '24 hours'
    );
  END IF;

  -- Return allowed with remaining count
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_max_messages - v_limit.message_count,
    'message_count', v_limit.message_count,
    'reset_at', v_limit.last_reset_at + INTERVAL '24 hours'
  );
END;
$$;

-- Function to increment message count
CREATE OR REPLACE FUNCTION public.increment_message_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.anonymous_message_limits (user_id, message_count, last_reset_at)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    message_count = anonymous_message_limits.message_count + 1,
    updated_at = NOW();
END;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_message_limits_user_id 
  ON public.anonymous_message_limits(user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_anonymous_message_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_anonymous_message_limits_updated_at
  BEFORE UPDATE ON public.anonymous_message_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_anonymous_message_limits_updated_at();