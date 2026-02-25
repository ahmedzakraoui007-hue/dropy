-- Create carts table
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    visitor_id TEXT, -- For guest users (cookie based)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- For logged in users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS carts_store_id_idx ON public.carts(store_id);
CREATE INDEX IF NOT EXISTS carts_visitor_id_idx ON public.carts(visitor_id);
CREATE INDEX IF NOT EXISTS carts_user_id_idx ON public.carts(user_id);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    options JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for cart items
CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON public.cart_items(cart_id);

-- Enable RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Policies (Open for now to allow anonymous carts, but in prod should be tighter)
-- Ideally we'd use anonymous auth, but for simple guest carts:
-- Allow anyone to create a cart
CREATE POLICY "Allow public insert on carts" ON public.carts FOR INSERT WITH CHECK (true);

-- Allow access if you have the ID (UUID is the secret)
CREATE POLICY "Allow public access to carts by ID" ON public.carts FOR SELECT USING (true);
CREATE POLICY "Allow public update on carts" ON public.carts FOR UPDATE USING (true);

-- Cart Items inherit access via cart_id (simplified)
CREATE POLICY "Allow public access to cart_items" ON public.cart_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.carts WHERE id = cart_items.cart_id
    )
);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_cart_updated ON public.carts;
CREATE TRIGGER on_cart_updated
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
