-- Add new columns to groups table for enhanced features
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS organizer_message TEXT,
ADD COLUMN IF NOT EXISTS suggested_budget NUMERIC(10,2);

-- Add columns to gift_exchanges for anti-cheat system
ALTER TABLE public.gift_exchanges 
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.groups.organizer_message IS 'Custom message from organizer with rules or instructions';
COMMENT ON COLUMN public.groups.suggested_budget IS 'Suggested budget amount for gifts in this group';
COMMENT ON COLUMN public.gift_exchanges.viewed_at IS 'Timestamp when giver first viewed their assignment';
COMMENT ON COLUMN public.gift_exchanges.view_count IS 'Number of times the assignment has been viewed';

-- Create index for better performance on viewed assignments
CREATE INDEX IF NOT EXISTS idx_gift_exchanges_viewed 
ON public.gift_exchanges(giver_id, viewed_at);

-- Update the gift_exchanges RLS policy to allow updates for view tracking
DROP POLICY IF EXISTS "Givers can update view status" ON public.gift_exchanges;
CREATE POLICY "Givers can update view status"
ON public.gift_exchanges
FOR UPDATE
USING (auth.uid() = giver_id)
WITH CHECK (auth.uid() = giver_id);