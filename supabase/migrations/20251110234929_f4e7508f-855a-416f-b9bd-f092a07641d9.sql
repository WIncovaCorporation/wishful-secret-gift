-- Create trigger to notify users when they receive an anonymous message
-- This will call the edge function to send email notifications

CREATE OR REPLACE FUNCTION public.notify_new_anonymous_message()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after insert on anonymous_messages
DROP TRIGGER IF EXISTS on_anonymous_message_created ON public.anonymous_messages;

CREATE TRIGGER on_anonymous_message_created
  AFTER INSERT ON public.anonymous_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_anonymous_message();

COMMENT ON FUNCTION public.notify_new_anonymous_message() IS 'Sends email notification to receiver when they get an anonymous message from their Secret Santa';
COMMENT ON TRIGGER on_anonymous_message_created ON public.anonymous_messages IS 'Triggers email notification when new anonymous message is created';