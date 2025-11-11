-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_anonymous_message_created ON public.anonymous_messages;
DROP FUNCTION IF EXISTS public.notify_new_anonymous_message();

-- We'll call the edge function directly from the frontend instead