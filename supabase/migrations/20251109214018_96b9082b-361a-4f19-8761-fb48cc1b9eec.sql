-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can view shared gift lists" ON public.gift_lists;

-- Create security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

-- Create security definer function to check if user created the group
CREATE OR REPLACE FUNCTION public.is_group_creator(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = _group_id AND created_by = _user_id
  );
$$;

-- Recreate the policy for viewing group members without recursion
CREATE POLICY "Users can view members of their groups"
ON public.group_members
FOR SELECT
USING (
  public.is_group_creator(group_id, auth.uid()) OR
  public.is_group_member(group_id, auth.uid())
);

-- Recreate policy for viewing shared gift lists
CREATE POLICY "Users can view shared gift lists"
ON public.gift_lists
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.list_id = gift_lists.id AND gm.user_id = auth.uid()
  )
);