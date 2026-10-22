-- Personal access keys that let a seller connect an MCP client (Claude Desktop, ...) to their own
-- store through /api/mcp. Only a SHA-256 hash is stored; the key is shown once at creation.
CREATE TABLE IF NOT EXISTS public.seller_mcp_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Claude',
  token_hash text NOT NULL UNIQUE,
  token_prefix text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS seller_mcp_tokens_user_id_idx ON public.seller_mcp_tokens(user_id);

ALTER TABLE public.seller_mcp_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dropy_mcp_tokens_owner_read ON public.seller_mcp_tokens;
CREATE POLICY dropy_mcp_tokens_owner_read ON public.seller_mcp_tokens
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS dropy_mcp_tokens_owner_delete ON public.seller_mcp_tokens;
CREATE POLICY dropy_mcp_tokens_owner_delete ON public.seller_mcp_tokens
  FOR DELETE TO authenticated USING (user_id = auth.uid());

REVOKE INSERT, UPDATE ON public.seller_mcp_tokens FROM anon, authenticated;
