-- Add notification_mode column to groups table
ALTER TABLE public.groups 
ADD COLUMN notification_mode text NOT NULL DEFAULT 'private';

-- Add check constraint to ensure valid values
ALTER TABLE public.groups 
ADD CONSTRAINT groups_notification_mode_check 
CHECK (notification_mode IN ('private', 'group'));

COMMENT ON COLUMN public.groups.notification_mode IS 'Notification mode for anonymous messages: private (only receiver) or group (all members)';
