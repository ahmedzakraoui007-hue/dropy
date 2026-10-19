-- Mission chat: only the seller and the selected creator of a brief can read or write its messages.
-- Before: any authenticated user could insert a message into any brief, and receivers could not mark messages as read.

CREATE OR REPLACE FUNCTION public.brief_pair(p_brief uuid, p_sender uuid, p_receiver uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM content_briefs b JOIN stores s ON s.id = b.store_id
    WHERE b.id = p_brief
      AND b.selected_creator_id IS NOT NULL
      AND (
        (s.vendor_id = p_sender AND b.selected_creator_id = p_receiver)
        OR (b.selected_creator_id = p_sender AND s.vendor_id = p_receiver)
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.brief_pair(uuid, uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.brief_pair(uuid, uuid, uuid) TO authenticated;

ALTER TABLE public.content_messages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'content_messages' AND policyname <> 'dropy_admin_all'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.content_messages', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY dropy_messages_read ON public.content_messages FOR SELECT TO authenticated
  USING ((sender_id = auth.uid() OR receiver_id = auth.uid()) AND public.brief_pair(brief_id, sender_id, receiver_id));

CREATE POLICY dropy_messages_send ON public.content_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.brief_pair(brief_id, sender_id, receiver_id));

CREATE POLICY dropy_messages_mark_read ON public.content_messages FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid()) WITH CHECK (receiver_id = auth.uid());

REVOKE UPDATE, DELETE ON public.content_messages FROM authenticated, anon;
GRANT UPDATE (is_read) ON public.content_messages TO authenticated;
REVOKE ALL ON public.content_messages FROM anon;
