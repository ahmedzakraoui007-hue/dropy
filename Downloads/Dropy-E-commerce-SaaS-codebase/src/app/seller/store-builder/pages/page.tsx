"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  FileText, 
  Settings, 
  Trash2, 
  Eye, 
  Copy, 
  MoreVertical,
  ArrowRight,
  Check,
  Globe,
  Layout,
  FileCode,
  Info,
  Mail,
  HelpCircle,
    ShieldCheck,
    FileWarning,
    ShoppingCart,
    Sparkles
  } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PAGE_TEMPLATES = [
  { type: 'about', name: 'À Propos', icon: Info, description: 'Présentez votre histoire et votre équipe.' },
  { type: 'contact', name: 'Contact', icon: Mail, description: 'Formulaire et coordonnées de contact.' },
  { type: 'faq', name: 'FAQ', icon: HelpCircle, description: 'Réponses aux questions fréquentes.' },
  { type: 'shipping_policy', name: 'Livraison', icon: Globe, description: 'Politique d\'expédition et délais.' },
  { type: 'refund_policy', name: 'Retours', icon: FileWarning, description: 'Conditions de retour et remboursement.' },
  { type: 'privacy_policy', name: 'Confidentialité', icon: ShieldCheck, description: 'Protection des données personnelles.' },
];

import { useStorePages } from "@/hooks/useStorePages";

export default function PagesPage() {
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("seller_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setSellerProfile(profile);
      }
    }
    loadProfile();
  }, [supabase]);

  const { pages, loading, createPage, deletePage } = useStorePages(sellerProfile?.id);

  const handleCreatePage = async (template?: any) => {
    const name = template?.name || "Nouvelle Page";
    const slug = template?.type || `page-${Math.random().toString(36).substr(2, 5)}`;
    
    await createPage({
      title: name,
      slug,
      is_published: true,
      sort_order: pages.length
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette page ? Cette action est irréversible.")) return;
    await deletePage(id);
  };

  if (loading || !sellerProfile) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">GESTION DES PAGES</h1>
          <p className="text-gray-500 font-medium">{pages.length} pages configurées sur votre boutique</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="rounded-xl border-gray-200">
            <Link href={`/preview/${sellerProfile?.store_slug || ''}`} target="_blank">
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Link>
          </Button>
          <Button onClick={() => handleCreatePage()} className="rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Page
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pages Actuelles</h2>
          {pages.map((page) => (
            <Card key={page.id} className="border-gray-100 rounded-2xl hover:shadow-md transition-shadow group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                    {page.is_homepage ? <Layout className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{page.title}</h3>
                      {page.is_homepage && (
                        <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-purple-100 text-[10px] font-bold uppercase tracking-widest">
                          Accueil
                        </Badge>
                      )}
                      {!page.is_published && (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">
                          Brouillon
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">/{page.slug}</p>
                  </div>
                </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-lg border-gray-100 h-9 font-bold">
                      <Link href={`/seller/store-builder/builder/${page.id}`}>
                        Éditer
                      </Link>
                    </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/preview/${sellerProfile?.store_slug}/${page.slug}`} target="_blank">
                          <Eye className="w-4 h-4 mr-2" /> Voir en direct
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="w-4 h-4 mr-2" /> Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" /> Paramètres SEO
                      </DropdownMenuItem>
                      {!page.is_homepage && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(page.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Templates de Pages</h2>
          <div className="grid grid-cols-1 gap-3">
            {PAGE_TEMPLATES.map((tpl) => (
              <Card 
                key={tpl.type} 
                className="border-gray-100 rounded-2xl hover:border-purple-200 cursor-pointer group transition-all"
                onClick={() => handleCreatePage(tpl)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <tpl.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-purple-600 transition-colors">{tpl.name}</h4>
                    <p className="text-[10px] text-gray-500 leading-tight">{tpl.description}</p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-300 group-hover:text-purple-600 transition-colors" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

