-- Fix search_path for notify_new_anonymous_message function
CREATE OR REPLACE FUNCTION public.notify_new_anonymous_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the edge function asynchronously using pg_net
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/notify-anonymous-message',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'anonymous_messages',
        'record', row_to_json(NEW),
        'schema', 'public'
      )
    );
  
  RETURN NEW;
END;
$$;