import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/components/store/Cart/CartDrawer'
import { StoreHeader } from '@/components/storefront/StoreHeader'
import { StoreFooter } from '@/components/storefront/StoreFooter'
import Script from 'next/script'

export default async function StoreLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const supabase = await createClient()

  // Fetch Store Config (with Branding)
  const { data: store } = await supabase
    .from('store_configs')
    .select(`
      *,
      seller:seller_profiles(id, store_name),
      theme:themes(*)
    `)
    .eq('store_slug', storeSlug)
    // .eq('is_published', true) // Allow preview for now
    .single()

  if (!store) {
    console.error('Store not found for slug:', storeSlug)
    notFound()
  }

  // Fetch Navigation (Pages for now, ideally Menus table if populated)
  const { data: pages } = await supabase
    .from('store_pages')
    .select('*')
    .eq('seller_id', store.seller_id)
    .eq('is_published', true)
    .eq('is_visible_in_menu', true)
    .order('menu_order', { ascending: true })

  // Construct Navigation Array
  const navigation = pages?.map(p => ({
    label: p.title,
    type: 'page',
    url: p.slug,
    page_slug: p.slug
  })) || []

  // Generate CSS Variables for Branding
  const cssVariables = {
    '--color-primary': store.colors?.primary || '#6366f1',
    '--color-secondary': store.colors?.secondary || '#f8fafc',
    '--color-accent': store.colors?.accent || '#ec4899',
    '--color-background': store.colors?.background || '#ffffff',
    // '--color-text': store.colors?.text || '#1e293b', // Optional
    '--font-heading': store.typography?.heading_font || 'Inter',
    '--font-body': store.typography?.body_font || 'Inter',
  }

  return (
    <CartProvider storeId={store.id}>
      <div style={cssVariables as React.CSSProperties} className="font-sans text-slate-900 bg-[var(--color-background)] min-h-screen flex flex-col">
        {/* Analytics Scripts */}
        {store.seo_config?.google_analytics_id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${store.seo_config.google_analytics_id}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${store.seo_config.google_analytics_id}');
              `}
            </Script>
          </>
        )}
        {store.seo_config?.facebook_pixel_id && (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${store.seo_config.facebook_pixel_id}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

        <StoreHeader store={store} navigation={navigation} />

        <main className="flex-grow">
          {children}
        </main>

        <StoreFooter store={store} navigation={navigation} />

        {/* Cart Drawer needs CSS vars too potentially */}
        <div style={cssVariables as React.CSSProperties}>
          {/* CartDrawer is triggered via Context/Header usually, 
                 but we need to ensure it renders if it needs Global State.
                 Actually CartDrawer component is usually just the UI connected to Context.
                 We put it in Header usually. But if it's a slide-over, it might need to be at root. 
                 Existing layout had it in Header.
                 StoreHeader handles the trigger (ShoppingCart icon).
                 We need to Render the Drawer somewhere?
                 Check CartDrawer implementation next. 
                 For now, assume StoreHeader trigger works if CartDrawer is mounted.
                 Wait, existing layout MOUNTED CartDrawer in Header line 83.
                 My StoreHeader has the BUTTON. But where is the Drawer?
                 I should mount CartDrawer here at root level!
             */}
          <CartDrawer checkoutUrl={`/${storeSlug}/checkout`} />
        </div>
      </div>
    </CartProvider>
  )
}
