"use client";

import { useState, use } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function CheckoutPage({
    params
}: {
    params: Promise<{ 'vendor-slug': string }>
}) {
    const { 'vendor-slug': vendorSlug } = use(params);
    const { items, total, clearCart, isLoading } = useCart();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zipCode: "",
        country: "Tunisie",
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h1 className="text-xl font-bold mb-2">Votre panier est vide</h1>
                    <p className="text-gray-500 mb-6">Ajoutez des produits pour passer commande.</p>
                    <Button onClick={() => router.push(`/${vendorSlug}`)}>Retour à la boutique</Button>
                </Card>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.firstName || !formData.address || !formData.phone) {
                throw new Error("Veuillez remplir tous les champs obligatoires");
            }

            // Fetch Store ID via API or Supabase based on slug
            // We can also let the API resolve the slug

            const response = await fetch("/api/store/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug: vendorSlug,
                    storeId: items[0]?.productId ? null : null, // API handles resolution via slug if storeId missing? 
                    // Wait, the API route:
                    // const { storeId ... } = body;
                    // if (!storeId ... ) return error.
                    // So I MUST provide storeId.
                    // I need to fetch it first.

                    customer: {
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        phone: formData.phone,
                        address: `${formData.address}, ${formData.city} ${formData.zipCode}`
                    },
                    cart: items.map(item => ({
                        id: item.id, // This is variant ID or product ID
                        // Wait, API expects: store_product_id.
                        // If item.id is store_product_id, we are good.
                        // Check FeaturedProducts: 
                        // setProducts(data.map(item => ({ ...item })))
                        // data is from store_products table.
                        // So item.id is store_product_id.
                        // CORRECT.
                        title: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image
                    }))
                })
            });

            // API expects storeId. I don't have it easily here without fetching.
            // I should update the API to accept slug OR storeId.
            // But I can't easily change the API right now if I want to be safe.
            // Wait, I can fetch the store by slug here first.
        } catch (error: any) {
            // Placeholder
        } finally {
            // Placeholder
        }
    };

    // Improved Submit with Fetch Store
    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: store } = await supabase.from('stores').select('id').eq('slug', vendorSlug).single();

            if (!store) throw new Error("Boutique introuvable");

            const response = await fetch("/api/store/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storeId: store.id,
                    slug: vendorSlug,
                    customer: {
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        phone: formData.phone,
                        address: `${formData.address}, ${formData.city} ${formData.zipCode}`
                    },
                    cart: items.map(item => ({
                        id: item.id,
                        title: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image
                    }))
                })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            toast.success("Commande validée !");
            clearCart();
            router.push(`/track/${result.orderNumber}`);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Form */}
                <div className="md:col-span-7 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations de livraison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form id="checkout-form" onSubmit={handleFinalSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Prénom</Label>
                                        <Input required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nom</Label>
                                        <Input required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Téléphone</Label>
                                        <Input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Adresse</Label>
                                    <Input required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Ville</Label>
                                        <Input required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Code Postal</Label>
                                        <Input required value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} />
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Paiement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5" />
                                Paiement à la livraison (COD)
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary */}
                <div className="md:col-span-5 space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Résumé</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                            <Image src={item.image || "/placeholder-product.jpg"} alt={item.name} fill className="object-cover" />
                                            <span className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-md font-bold">{item.quantity}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                                        </div>
                                        <div className="font-bold text-sm">{(item.price * item.quantity).toFixed(2)} TND</div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-4 flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>{total.toFixed(2)} TND</span>
                            </div>
                            <Button className="w-full h-12 text-lg font-bold" form="checkout-form" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Commander
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
