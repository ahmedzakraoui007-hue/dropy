"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  ExternalLink, 
  Check, 
  RefreshCw,
  Navigation as NavIcon,
  Layout,
  Link as LinkIcon,
  PlusCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NavigationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [footerItems, setFooterItems] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data: storeData } = await supabase
            .from("stores")
            .select("*")
            .eq("vendor_id", user.id)
            .single();
        setStore(storeData);

        if (storeData) {
          const { data: pagesData } = await supabase
            .from("store_pages")
            .select("*")
            .eq("store_id", storeData.id);
          setPages(pagesData || []);

          const { data: navData } = await supabase
            .from("store_navigation")
            .select("*")
            .eq("store_id", storeData.id);
          
          const header = navData?.find(n => n.type === 'header');
          const footer = navData?.find(n => n.type === 'footer');
          
          setMenuItems(header?.items || []);
          setFooterItems(footer?.items || []);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    try {
      // Upsert header
      const { error: hError } = await supabase
        .from("store_navigation")
        .upsert({
          store_id: store.id,
          type: 'header',
          items: menuItems
        }, { onConflict: 'store_id,type' });
      
      if (hError) throw hError;

      // Upsert footer
      const { error: fError } = await supabase
        .from("store_navigation")
        .upsert({
          store_id: store.id,
          type: 'footer',
          items: footerItems
        }, { onConflict: 'store_id,type' });

      if (fError) throw fError;

      toast.success("Navigation enregistrée !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const addItem = (type: 'header' | 'footer') => {
    const newItem = { id: crypto.randomUUID(), label: 'Nouveau lien', url: '/', target: '_self' };
    if (type === 'header') setMenuItems([...menuItems, newItem]);
    else setFooterItems([...footerItems, newItem]);
  };

  const removeItem = (type: 'header' | 'footer', id: string) => {
    if (type === 'header') setMenuItems(menuItems.filter(i => i.id !== id));
    else setFooterItems(footerItems.filter(i => i.id !== id));
  };

  const updateItem = (type: 'header' | 'footer', id: string, field: string, value: any) => {
    const updater = (items: any[]) => items.map(i => i.id === id ? { ...i, [field]: value } : i);
    if (type === 'header') setMenuItems(updater(menuItems));
    else setFooterItems(updater(footerItems));
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  if (!store) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Aucune boutique trouvée</h1>
        <p className="text-gray-500">Vous devez d'abord créer une boutique pour accéder à la navigation.</p>
        <Button asChild>
          <a href="/seller/store/create">Créer une boutique</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">NAVIGATION & MENUS</h1>
          <p className="text-gray-500 font-medium">Configurez les liens de navigation de votre boutique</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 px-8"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Enregistrer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Header Navigation */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <NavIcon className="w-5 h-5 text-blue-600" />
              Menu Principal (Header)
            </h2>
            <Button variant="outline" size="sm" onClick={() => addItem('header')} className="rounded-lg h-8 border-gray-200 text-blue-600 font-bold">
              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Ajouter
            </Button>
          </div>
          
          <Card className="border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <Reorder.Group axis="y" values={menuItems} onReorder={setMenuItems} className="space-y-2">
                {menuItems.map((item) => (
                  <NavigationItem 
                    key={item.id} 
                    item={item} 
                    pages={pages}
                    onUpdate={(f, v) => updateItem('header', item.id, f, v)}
                    onRemove={() => removeItem('header', item.id)}
                  />
                ))}
                {menuItems.length === 0 && (
                  <div className="text-center py-8 text-gray-400 italic text-sm">
                    Aucun lien dans le menu principal
                  </div>
                )}
              </Reorder.Group>
            </CardContent>
          </Card>
        </section>

        {/* Footer Navigation */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Layout className="w-5 h-5 text-blue-600" />
              Navigation Bas de Page (Footer)
            </h2>
            <Button variant="outline" size="sm" onClick={() => addItem('footer')} className="rounded-lg h-8 border-gray-200 text-blue-600 font-bold">
              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Ajouter
            </Button>
          </div>
          
          <Card className="border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <Reorder.Group axis="y" values={footerItems} onReorder={setFooterItems} className="space-y-2">
                {footerItems.map((item) => (
                  <NavigationItem 
                    key={item.id} 
                    item={item} 
                    pages={pages}
                    onUpdate={(f, v) => updateItem('footer', item.id, f, v)}
                    onRemove={() => removeItem('footer', item.id)}
                  />
                ))}
                {footerItems.length === 0 && (
                  <div className="text-center py-8 text-gray-400 italic text-sm">
                    Aucun lien dans le footer
                  </div>
                )}
              </Reorder.Group>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function NavigationItem({ item, pages, onUpdate, onRemove }: any) {
  return (
    <Reorder.Item 
      value={item}
      className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 group"
    >
      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab active:cursor-grabbing shrink-0" />
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-gray-400 uppercase">Label</Label>
          <Input 
            value={item.label} 
            onChange={(e) => onUpdate('label', e.target.value)} 
            className="h-9 rounded-xl bg-gray-50 border-none text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-gray-400 uppercase">Destination</Label>
          <div className="flex gap-2">
            <Select value={item.url} onValueChange={(v) => onUpdate('url', v)}>
              <SelectTrigger className="h-9 rounded-xl bg-gray-50 border-none text-sm flex-1">
                <SelectValue placeholder="Lien vers..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/">Accueil</SelectItem>
                <SelectItem value="/shop">Toute la boutique</SelectItem>
                {pages.map((p: any) => (
                  <SelectItem key={p.id} value={`/${p.slug}`}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-9 w-9 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}
