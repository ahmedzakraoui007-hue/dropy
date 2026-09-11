"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationCenter from "@/components/NotificationCenter";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Menu, 
  Bell, 
  X, 
  LogOut, 
  ChevronDown,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface Profile {
  avatar_url?: string | null;
  full_name?: string | null;
}

interface SupplierProfile {
  id: string;
  status?: string | null;
}

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, dir } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const navigation = [
    { name: t("dashboard.nav.dashboard"), href: "/supplier/dashboard", icon: LayoutDashboard, key: "dashboard" },
    { name: t("dashboard.nav.my_products"), href: "/supplier/products", icon: Package, key: "my_products" },
    { name: t("dashboard.nav.orders"), href: "/supplier/orders", icon: ShoppingCart, key: "orders" },
    { name: t("dashboard.nav.shipping"), href: "/supplier/shipping", icon: Truck, key: "shipping" },
    { name: t("dashboard.nav.payments"), href: "/supplier/payments", icon: CreditCard, key: "payments" },
    { name: t("dashboard.nav.analytics"), href: "/supplier/analytics", icon: BarChart3, key: "analytics" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("supplier-sidebar-collapsed");
    if (saved) setSidebarCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("supplier-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) setProfile(data);

        const { data: supplier } = await supabase
          .from("supplier_profiles")
          .select("id, status")
          .eq("user_id", user.id)
          .single();
        
        if (supplier) setSupplierProfile(supplier);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (pathname === "/supplier" || pathname.includes("/signup")) {
    return <>{children}</>;
  }

  const sidebarWidth = sidebarCollapsed ? "w-[72px]" : "w-64";
  const mainPadding = sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background" data-role="supplier">
        <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-card border-r border-border transform transition-all duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <Link href="/supplier" className="flex items-center gap-2 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-primary-foreground" />
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden"
                    >
                      DROPY
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  
                  const linkContent = (
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      } ${sidebarCollapsed ? "justify-center" : ""}`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );

                  return (
                    <li key={item.name}>
                      {sidebarCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {item.name}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkContent
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="p-3 border-t border-border">
              {sidebarCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/supplier/settings">
                      <Button variant="ghost" size="icon" className="w-full text-muted-foreground hover:text-foreground">
                        <Settings className="w-5 h-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Paramètres</TooltipContent>
                </Tooltip>
              ) : (
                <Link href="/supplier/settings">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
                    <Settings className="w-5 h-5" />
                    Paramètres
                  </Button>
                </Link>
              )}

              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`hidden lg:flex items-center gap-3 w-full mt-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="w-5 h-5" />
                ) : (
                  <>
                    <PanelLeftClose className="w-5 h-5" />
                    <span>Réduire</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <div className={`${mainPadding} transition-all duration-300`}>
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur border-b border-border">
            <div className="flex items-center justify-between h-full px-4 lg:px-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
                  <Menu className="w-6 h-6" />
                </button>
                
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
                  className="hidden lg:flex p-2 rounded-lg hover:bg-muted transition-colors"
                  title={sidebarCollapsed ? "Afficher le menu" : "Réduire le menu"}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-4">
                <NotificationCenter />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 transition-colors">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-violet-600 text-white text-sm">
                            {profile?.full_name?.charAt(0) || "F"}
                          </AvatarFallback>
                        </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium">{profile?.full_name || "Fournisseur"}</p>
                        <p className="text-xs text-muted-foreground">Fournisseur</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/supplier/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
