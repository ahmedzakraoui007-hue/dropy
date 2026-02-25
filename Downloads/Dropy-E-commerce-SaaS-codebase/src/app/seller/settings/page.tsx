"use client";

import { useState } from "react";
import { 
  Settings, 
  Globe, 
  Tag, 
  Receipt, 
  Coins, 
  Truck, 
  Users, 
  Lock, 
  ListChecks, 
  LayoutDashboard, 
  Share2, 
  Bell, 
  Package, 
  CreditCard, 
  Building2, 
  Wrench, 
  ShoppingCart,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/profile/SettingsForm";

export default function SellerSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const settingsNav = [
    { id: "general", label: "Paramètres généraux", icon: Settings },
    { id: "languages", label: "Langues", icon: Globe },
    { id: "brands", label: "Marques", icon: Tag },
    { id: "taxes", label: "Taxes", icon: Receipt },
    { id: "currency", label: "Devise", icon: Coins },
    { id: "shipping", label: "Transport", icon: Truck },
    { id: "team", label: "Équipe", icon: Users },
    { id: "security", label: "Sécurité", icon: Lock },
    { id: "order_steps", label: "Étapes de commande", icon: ListChecks },
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "social", label: "Réseaux sociaux", icon: Share2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "stock", label: "Gestion du stock", icon: Package },
    { id: "payment", label: "Paiement & Livraison", icon: CreditCard },
    { id: "bank", label: "Informations bancaires", icon: Building2 },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "checkout", label: "Checkout", icon: ShoppingCart },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Gérez les préférences de votre boutique</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <aside className="lg:col-span-1">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-2 space-y-1">
              {settingsNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === item.id
                      ? "bg-primary/5 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-primary" : "text-gray-400"}`} />
                    {item.label}
                  </div>
                  {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Settings Content */}
        <main className="lg:col-span-3">
          <Card className="border-gray-200 shadow-sm min-h-[600px]">
            <CardContent className="p-8">
              {activeTab === "general" ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Paramètres généraux</h2>
                    <p className="text-sm text-gray-500 mt-1">Gérez les informations de base de votre compte et de votre boutique.</p>
                  </div>
                  <SettingsForm />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <Settings className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Section en cours de développement</h3>
                  <p className="text-gray-500 max-w-sm mt-2">
                    Cette partie des paramètres sera bientôt disponible pour vous permettre de configurer {activeTab.replace('_', ' ')} en détail.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}