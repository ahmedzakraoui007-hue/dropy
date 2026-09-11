"use client";

import { useCart } from "@/context/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CartDrawer({ children, checkoutUrl = "/checkout" }: { children?: React.ReactNode; checkoutUrl?: string }) {
    const { items, removeItem, updateQuantity, total, itemCount, isOpen, setIsOpen } = useCart();

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="relative">
                        <ShoppingCart className="w-6 h-6" />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {itemCount}
                            </span>
                        )}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle>Mon Panier ({itemCount})</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <ShoppingCart className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">Votre panier est vide</p>
                                <p className="text-gray-500 text-sm">Découvrez nos produits et commencez vos achats.</p>
                            </div>
                            <Button onClick={() => setIsOpen(false)}>
                                Continuer mes achats
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 py-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        <Image
                                            src={item.image || "/placeholder-product.jpg"}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {item.variantName && (
                                                <p className="text-xs text-gray-500 mt-1">{item.variantName}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2 border rounded-full p-1">
                                                <button
                                                    disabled={item.quantity <= 1}
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="font-bold">{(item.price * item.quantity).toFixed(2)} TND</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {items.length > 0 && (
                    <SheetFooter className="p-6 border-t bg-gray-50 mt-auto">
                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{total.toFixed(2)} TND</span>
                            </div>
                            <Button className="w-full py-6 text-lg font-bold" asChild>
                                <Link href={checkoutUrl} onClick={() => setIsOpen(false)}>
                                    Procéder au paiement
                                </Link>
                            </Button>
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
