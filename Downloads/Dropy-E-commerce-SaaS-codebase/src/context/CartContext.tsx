"use client";

import { createContext, useContext, useEffect, useState, startTransition } from "react";
import { toast } from "sonner";
import { getCart, addToCart, removeFromCart, updateCartItemQuantity, clearCart as clearCartAction } from "@/lib/cart";

export interface CartItem {
    id: string; // This is now cart_item.id (DB ID)
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    variantId?: string;
    variantName?: string;
    maxStock?: number;
    options?: any;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, storeId }: { children: React.ReactNode; storeId: string }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load from DB on mount
    useEffect(() => {
        async function load() {
            if (!storeId) return;
            try {
                const cart = await getCart(storeId);
                if (cart && cart.cart_items) {
                    const mappedItems: CartItem[] = cart.cart_items.map((item: any) => ({
                        id: item.id, // DB ID
                        productId: item.product_id,
                        name: item.product?.name || 'Unknown Product',
                        price: item.product?.price || 0,
                        quantity: item.quantity,
                        image: item.product?.images?.[0] || null,
                        options: item.options
                    }));
                    setItems(mappedItems);
                }
            } catch (e) {
                console.error("Failed to load cart", e);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [storeId]);

    const addItem = async (newItem: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) => {
        const qty = newItem.quantity || 1;

        // Optimistic Update
        const tempId = crypto.randomUUID();
        const optimisticItem: CartItem = {
            id: tempId,
            ...newItem,
            quantity: qty,
            productId: newItem.productId
        };

        setItems((prev) => {
            const existing = prev.find(i => i.productId === newItem.productId);
            if (existing) {
                return prev.map(i => i.productId === newItem.productId ? { ...i, quantity: i.quantity + qty } : i);
            }
            return [...prev, optimisticItem];
        });
        setIsOpen(true);

        try {
            const result = await addToCart(storeId, newItem.productId, qty, newItem.options);
            // Reload to get real IDs is safer than manual merge
            // But for speed we kept optimistic. 
            // Ideally we should replace the temp ID with real ID.
            // For now, let's just re-fetch silently or rely on revalidatePath to keep things in sync eventually? 
            // RevalidatePath updates server components, but client state 'items' needs update.
            // Let's re-fetch cart to be safe and consistent.
            const cart = await getCart(storeId);
            if (cart && cart.cart_items) {
                const mappedItems = cart.cart_items.map((item: any) => ({
                    id: item.id,
                    productId: item.product_id,
                    name: item.product?.name || 'Unknown Product',
                    price: item.product?.price || 0,
                    quantity: item.quantity,
                    image: item.product?.images?.[0] || null,
                    options: item.options
                }));
                setItems(mappedItems);
            }
            toast.success("Produit ajouté au panier");
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de l'ajout au panier");
            // Revert optimistic update? todo
        }
    };

    const removeItem = async (id: string) => {
        // Optimistic
        const originalItems = [...items];
        setItems((prev) => prev.filter((i) => i.id !== id));

        try {
            await removeFromCart(id);
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de la suppression");
            setItems(originalItems);
        }
    };

    const updateQuantity = async (id: string, quantity: number) => {
        if (quantity < 1) {
            // Logic handled by UI usually to not go below 1 or call remove
            return;
        }

        const originalItems = [...items];
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));

        try {
            await updateCartItemQuantity(id, quantity);
        } catch (e) {
            console.error(e);
            toast.error("Erreur mise à jour quantité");
            setItems(originalItems);
        }
    };

    const clearCart = async () => {
        setItems([]);
        try {
            await clearCartAction(storeId);
        } catch (e) {
            console.error("Failed to clear cart", e);
        }
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                total,
                itemCount,
                isOpen,
                setIsOpen,
                isLoading
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
