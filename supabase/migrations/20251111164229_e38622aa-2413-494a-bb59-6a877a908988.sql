-- Add RLS policy to allow givers to view their assigned receiver's gift lists
CREATE POLICY "Givers can view their assigned receiver's gift lists"
ON public.gift_lists
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.gift_exchanges ge
    WHERE ge.receiver_id = gift_lists.user_id
      AND ge.giver_id = auth.uid()
  )
);

-- Add RLS policy to allow givers to view their assigned receiver's gift items
CREATE POLICY "Givers can view their assigned receiver's gift items"
ON public.gift_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.gift_lists gl
    JOIN public.gift_exchanges ge ON ge.receiver_id = gl.user_id
    WHERE gl.id = gift_items.list_id
      AND ge.giver_id = auth.uid()
  )
);