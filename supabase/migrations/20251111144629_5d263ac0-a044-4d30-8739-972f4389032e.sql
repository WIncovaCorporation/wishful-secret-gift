-- Enable pg_net extension for async HTTP requests from database triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions to execute HTTP requests
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Verify the trigger function exists and uses correct schema
CREATE OR REPLACE FUNCTION public.notify_new_anonymous_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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
$function$;

-- Recreate the trigger to ensure it's properly linked
DROP TRIGGER IF EXISTS on_anonymous_message_created ON public.anonymous_messages;

CREATE TRIGGER on_anonymous_message_created
  AFTER INSERT ON public.anonymous_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_anonymous_message();