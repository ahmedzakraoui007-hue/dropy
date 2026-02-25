import Link from 'next/link'
import { ShoppingCart, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StoreHeaderProps {
    store: any
    navigation?: any[]
}

export function StoreHeader({ store, navigation = [] }: StoreHeaderProps) {
    const getNavLink = (item: any, storeSlug: string) => {
        // Handle internal vs external links
        if (item.url?.startsWith('http')) return item.url
        // Handle Special pages
        if (item.type === 'page') return `/${storeSlug}/${item.page_slug || item.url}`
        if (item.type === 'collection') return `/${storeSlug}/collections/${item.collection_slug}`
        if (item.type === 'product') return `/${storeSlug}/product/${item.product_slug}`
        return `/${storeSlug}/${item.url || ''}`
    }

    return (
        <header className="sticky top-0 z-50 bg-[var(--color-background)] border-b transition-all duration-200">
            {/* Barre d'annonce (si configurée) */}
            {store.header_config?.show_announcement && store.header_config.announcement_text && (
                <div
                    className="py-2 px-4 text-center text-sm font-medium"
                    style={{
                        backgroundColor: store.header_config.announcement_bg || 'var(--color-primary)',
                        color: store.header_config.announcement_text_color || '#ffffff',
                    }}
                >
                    {store.header_config.announcement_text}
                </div>
            )}

            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Trigger (ToDo) */}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="w-5 h-5" />
                    </Button>

                    {/* Logo de la BOUTIQUE */}
                    <Link href={`/${store.store_slug}`} className="transition-opacity hover:opacity-80">
                        {store.logo_url ? (
                            <img
                                src={store.logo_url}
                                alt={store.store_name}
                                className="h-10 w-auto object-contain"
                            />
                        ) : (
                            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                                {store.store_name}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    {navigation?.map((item) => (
                        <Link
                            key={item.id || item.label}
                            href={getNavLink(item, store.store_slug)}
                            className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {store.header_config?.show_search && (
                        <Button variant="ghost" size="icon">
                            <Search className="w-5 h-5" />
                        </Button>
                    )}
                    <Link href={`/${store.store_slug}/checkout`}>
                        {/* Uses Link to Checkout directly or Cart Page */}
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="w-5 h-5" />
                            {/* Cart Badge could go here */}
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
