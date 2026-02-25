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
import { 
    LayoutDashboard, 
    Store, 
    Package, 
    ShoppingCart, 
    Users, 
    BarChart3, 
    Video, 
    GraduationCap, 
    CreditCard,
    Settings,
    Menu,
    X,
    LogOut,
    ChevronDown,
    Droplet,
    Sparkles,
    HelpCircle,
    Search,
    Truck,
    PanelLeftClose,
    PanelLeft,
    Calculator,
    Send
  } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, dir } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

    const navigation = [
      { name: t("dashboard.nav.dashboard"), href: "/seller/dashboard", icon: LayoutDashboard, key: "dashboard" },
      { name: t("dashboard.nav.my_store"), href: "/seller/store-builder", icon: Store, key: "my_store" },
    { name: t("dashboard.nav.my_products"), href: "/seller/products/add", icon: Package, key: "my_products" },
    { name: t("dashboard.nav.dropy_catalog"), href: "/seller/products/catalog", icon: Truck, key: "dropy_catalog" },
    { name: t("dashboard.nav.orders"), href: "/seller/orders", icon: ShoppingCart, key: "orders" },
    { name: t("dashboard.nav.shipping"), href: "/seller/shipping", icon: Send, key: "shipping" },
    { name: t("dashboard.nav.calculator"), href: "/seller/calculator", icon: Calculator, key: "calculator" },
    { name: t("dashboard.nav.customers"), href: "/seller/customers", icon: Users, key: "customers" },
      { name: t("dashboard.nav.analytics"), href: "/seller/analytics", icon: BarChart3, key: "analytics" },
      { name: t("dashboard.nav.ugc_creators"), href: "/seller/ugc", icon: Video, key: "ugc_creators" },
      { name: t("dashboard.nav.training"), href: "/seller/training", icon: GraduationCap, key: "training" },
    { name: t("dashboard.nav.subscription"), href: "/seller/subscription", icon: CreditCard, key: "subscription" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("seller-sidebar-collapsed");
    if (saved) setSidebarCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("seller-sidebar-collapsed", String(sidebarCollapsed));
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
      }
    }
    loadProfile();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (pathname === "/seller" || pathname.includes("/signup")) {
    return <>{children}</>;
  }

  const sidebarWidth = sidebarCollapsed ? "w-[72px]" : "w-[260px]";
  const mainPadding = sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background" data-role="seller">
        <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-sidebar transform transition-all duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
              <Link href="/seller/dashboard" className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Droplet className="w-5 h-5 text-white" />
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-xl font-bold tracking-tight text-white whitespace-nowrap overflow-hidden"
                    >
                      DROPY
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  
                  const linkContent = (
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      } ${sidebarCollapsed ? "justify-center" : ""}`}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-white/60"}`} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="truncate">{item.name}</span>
                          {item.key === "ugc_creators" && !isActive && (
                            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-primary/20 text-white rounded-full border border-primary/30">NEW</span>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  return (
                    <li key={item.key}>
                      {sidebarCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {linkContent}
                          </TooltipTrigger>
                          <TooltipContent side={dir === 'rtl' ? 'left' : 'right'} className="font-medium bg-sidebar text-white border-white/10">
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

            <div className="p-3 border-t border-white/10 space-y-1">
              {!sidebarCollapsed && (
                <div className="p-4 rounded-xl bg-white/5 mb-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-white">{t("dashboard.nav.need_help")}</span>
                  </div>
                  <p className="text-xs text-white/50 mb-3">{t("dashboard.nav.help_desc")}</p>
                  <Link href="/help">
                    <Button size="sm" variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-none font-medium text-xs">
                      <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                      {t("dashboard.nav.help_center")}
                    </Button>
                  </Link>
                </div>
              )}
              
              <div className="flex flex-col gap-1">
                {sidebarCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/seller/settings">
                        <Button variant="ghost" size="icon" className="w-full text-white/70 hover:text-white hover:bg-white/10">
                          <Settings className="w-5 h-5" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side={dir === 'rtl' ? 'left' : 'right'} className="bg-sidebar text-white border-white/10">{t("dashboard.nav.settings")}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link href="/seller/settings">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-white/70 hover:text-white hover:bg-white/10 font-medium">
                      <Settings className="w-5 h-5" />
                      {t("dashboard.nav.settings")}
                    </Button>
                  </Link>
                )}

                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white transition-all ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                  ) : (
                    <>
                      <PanelLeftClose className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                      <span>{t("dashboard.nav.collapse")}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Profile info in sidebar bottom */}
              {!sidebarCollapsed && profile && (
                <div className="mt-4 p-3 rounded-xl bg-black/20 flex items-center gap-3 border border-white/5">
                  <Avatar className="w-9 h-9 border border-white/10">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-white text-xs font-bold uppercase">
                      {profile?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
                    <p className="text-[10px] text-white/50 truncate uppercase tracking-wider font-bold">Vendeur</p>
                  </div>
                  <button onClick={handleSignOut} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <div className={`${mainPadding} transition-all duration-300`}>
          <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-full px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)} 
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 w-80">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder={t("dashboard.nav.search")}
                    className="bg-transparent border-none outline-none text-sm text-gray-600 placeholder:text-gray-400 w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <NotificationCenter />

                <DropdownMenu dir={dir}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-50 transition-colors">
                      <Avatar className="w-8 h-8 border border-gray-200">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-white text-xs font-bold">
                          {profile?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <div className="px-2 py-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{profile?.full_name}</p>
                      <p className="text-xs text-gray-500">{profile?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/seller/settings" className="cursor-pointer rounded-lg">
                        <Settings className="w-4 h-4 mr-2" />
                        {t("dashboard.nav.settings")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer rounded-lg focus:bg-red-50 focus:text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("dashboard.nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="p-6 lg:p-8 min-h-[calc(100vh-64px)]">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
