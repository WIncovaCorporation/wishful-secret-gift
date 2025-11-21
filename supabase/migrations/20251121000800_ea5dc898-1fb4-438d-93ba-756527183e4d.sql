-- Create ai_usage_tracking table for rate limiting AI features
CREATE TABLE IF NOT EXISTS public.ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL DEFAULT 'gift_suggestion',
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_ai_usage_user_date ON public.ai_usage_tracking(user_id, last_reset_date);

-- Enable RLS
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI usage"
  ON public.ai_usage_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage"
  ON public.ai_usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI usage"
  ON public.ai_usage_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to check and increment usage
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  p_user_id UUID,
  p_feature_type TEXT,
  p_daily_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get or create usage record
  SELECT * INTO v_usage
  FROM public.ai_usage_tracking
  WHERE user_id = p_user_id 
    AND feature_type = p_feature_type
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.ai_usage_tracking (user_id, feature_type, usage_count, last_reset_date)
    VALUES (p_user_id, p_feature_type, 1, v_today)
    RETURNING * INTO v_usage;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'usage_count', 1,
      'limit', p_daily_limit,
      'remaining', p_daily_limit - 1,
      'reset_date', v_today
    );
  END IF;

  -- Check if we need to reset (new day)
  IF v_usage.last_reset_date < v_today THEN
    UPDATE public.ai_usage_tracking
    SET usage_count = 1,
        last_reset_date = v_today,
        updated_at = NOW()
    WHERE id = v_usage.id;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'usage_count', 1,
      'limit', p_daily_limit,
      'remaining', p_daily_limit - 1,
      'reset_date', v_today
    );
  END IF;

  -- Check if user exceeded limit
  IF v_usage.usage_count >= p_daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'usage_count', v_usage.usage_count,
      'limit', p_daily_limit,
      'remaining', 0,
      'reset_date', v_usage.last_reset_date + INTERVAL '1 day',
      'message', 'Límite diario alcanzado. Intenta mañana o actualiza tu plan.'
    );
  END IF;

  -- Increment usage
  UPDATE public.ai_usage_tracking
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = v_usage.id;

  RETURN jsonb_build_object(
    'allowed', true,
    'usage_count', v_usage.usage_count + 1,
    'limit', p_daily_limit,
    'remaining', p_daily_limit - (v_usage.usage_count + 1),
    'reset_date', v_usage.last_reset_date
  );
END;
$$;