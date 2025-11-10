-- Create table for anonymous messages between Secret Santa participants
CREATE TABLE IF NOT EXISTS public.anonymous_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;

-- Givers can insert messages to their receivers
CREATE POLICY "Givers can send anonymous messages to their receivers"
ON public.anonymous_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = giver_id
  AND EXISTS (
    SELECT 1 FROM public.gift_exchanges ge
    WHERE ge.group_id = anonymous_messages.group_id
      AND ge.giver_id = auth.uid()
      AND ge.receiver_id = anonymous_messages.receiver_id
  )
);

-- Receivers can view messages sent to them (but not see who sent them)
CREATE POLICY "Receivers can view anonymous messages sent to them"
ON public.anonymous_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = receiver_id
);

-- Givers can view messages they sent
CREATE POLICY "Givers can view messages they sent"
ON public.anonymous_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = giver_id
);

-- Receivers can mark messages as read
CREATE POLICY "Receivers can mark messages as read"
ON public.anonymous_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Create index for performance
CREATE INDEX idx_anonymous_messages_group_receiver ON public.anonymous_messages(group_id, receiver_id, created_at DESC);
CREATE INDEX idx_anonymous_messages_group_giver ON public.anonymous_messages(group_id, giver_id, created_at DESC);

-- Enable realtime for anonymous messages
ALTER TABLE public.anonymous_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anonymous_messages;

-- Add comment for documentation
COMMENT ON TABLE public.anonymous_messages IS 'Stores anonymous messages between Secret Santa participants. Givers can ask questions without revealing identity.';