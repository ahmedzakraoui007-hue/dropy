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
import { createClient } from "@/lib/supabase/client";

import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  ShieldCheck, 
  X, 
  Menu, 
  ChevronDown, 
  Settings, 
  LogOut,
  CheckCircle2
} from "lucide-react";

const navigation = [
  { name: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
  { name: "Utilisateurs", href: "/admin/users", icon: Users },
  { name: "Vendeurs & Boutiques", href: "/admin/sellers", icon: Store },
  { name: "Modération Produits", href: "/admin/products", icon: CheckCircle2 },
  { name: "Fournisseurs", href: "/admin/suppliers", icon: Package },
  { name: "Abonnements Stripe", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Modération Contenu", href: "/admin/content", icon: FileText },
  { name: "Support & Litiges", href: "/admin/support", icon: MessageSquare },
];

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
        
        if (data) {
          if (data.role !== 'admin') {
            router.push('/');
            return;
          }
          setProfile(data);
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-background text-foreground" data-role="admin">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                <Link href="/admin" className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">ADMIN DROPY</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

          <div className="p-4 border-t border-border">
            <Link href="/admin/settings">
              <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
                Paramètres Admin
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

              <div className="flex items-center gap-4">
                <NotificationCenter />

                <DropdownMenu>

                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-violet-600 text-white text-sm">
                        {profile?.full_name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{profile?.full_name || "Admin"}</p>
                      <p className="text-xs text-muted-foreground">Super Admin</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="cursor-pointer">
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
  );
}
