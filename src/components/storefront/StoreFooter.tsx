import Link from 'next/link'
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from 'lucide-react'

export function StoreFooter({ store, navigation = [] }: { store: any, navigation?: any[] }) {
    return (
        <footer className="bg-gray-900 text-white pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Logo et description */}
                    <div className="space-y-4">
                        {store.logo_dark_url || store.logo_url ? (
                            <img
                                src={store.logo_dark_url || store.logo_url}
                                alt={store.store_name}
                                className="h-8 w-auto mb-4 object-contain brightness-0 invert"
                            />
                        ) : (
                            <span className="text-2xl font-bold">{store.store_name}</span>
                        )}
                        {store.store_tagline && (
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {store.store_tagline}
                            </p>
                        )}
                    </div>

                    {/* Navigation Footer (Dynamic) */}
                    {/* If structure allows multiple columns, map them. For now assume one list or split */}
                    <div>
                        <h4 className="font-bold mb-6 text-sm uppercase tracking-wider">Navigation</h4>
                        <ul className="space-y-3">
                            {navigation.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        href={link.url || '#'}
                                        className="text-gray-400 hover:text-white text-sm transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal (Hardcoded or Configured) */}
                    <div>
                        <h4 className="font-bold mb-6 text-sm uppercase tracking-wider">Légal</h4>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Politique de confidentialité</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">CGV</Link></li>
                            <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Mentions légales</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold mb-6 text-sm uppercase tracking-wider">Contact</h4>
                        <div className="space-y-4">
                            {store.contact_info?.email && (
                                <div className="flex items-center gap-3 text-gray-400">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">{store.contact_info.email}</span>
                                </div>
                            )}
                            {store.contact_info?.phone && (
                                <div className="flex items-center gap-3 text-gray-400">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">{store.contact_info.phone}</span>
                                </div>
                            )}

                            {/* Réseaux sociaux */}
                            <div className="flex gap-4 mt-6">
                                {store.social_links?.instagram && (
                                    <a href={store.social_links.instagram} target="_blank" className="hover:text-primary transition-colors">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                )}
                                {store.social_links?.facebook && (
                                    <a href={store.social_links.facebook} target="_blank" className="hover:text-primary transition-colors">
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 pt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        {store.footer_config?.copyright_text ||
                            `© ${new Date().getFullYear()} ${store.store_name}. Tous droits réservés.`}
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
                        <span>Propulsé par</span>
                        <Link href="https://dropy.store" className="font-bold hover:text-white transition-colors">Dropy</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
