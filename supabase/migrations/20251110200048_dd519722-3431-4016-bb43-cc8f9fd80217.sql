-- Allow users to view groups when searching by share code for joining
DROP POLICY IF EXISTS "Users can view groups by share code" ON public.groups;

CREATE POLICY "Users can view groups by share code"
ON public.groups
FOR SELECT
TO authenticated
USING (
  -- Users can view groups if:
  -- 1. They created the group
  auth.uid() = created_by
  -- 2. They are a member of the group
  OR EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  )
  -- 3. They are searching with a valid share code (allow discovery for joining)
  OR share_code IS NOT NULL
);