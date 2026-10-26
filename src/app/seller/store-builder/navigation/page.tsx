"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Reorder } from "framer-motion";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GripVertical, Loader2, Navigation, PanelBottom, Plus, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { storeText } from "@/lib/storefront-i18n";
import { autoFooterLinks, autoHeaderLinks, customLinks, isExternalUrl, normalizeExternalUrl, type MenuLink } from "@/lib/store-menus";

type Kind = "header" | "footer";
type Option = { value: string; label: string };
type MenuState = { items: MenuLink[]; custom: boolean };

const EXTERNAL = "__external__";

export default function NavigationPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.menus.${key}`);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [menus, setMenus] = useState<Record<Kind, MenuState>>({ header: { items: [], custom: false }, footer: { items: [], custom: false } });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      const { data: storeData } = await supabase
        .from("stores")
        .select("id, slug, storefront_language")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setStore(storeData);
      if (!storeData) return setLoading(false);
      const [{ data: pagesData }, { data: navData }, { data: productData }] = await Promise.all([
        supabase.from("store_pages").select("id, slug, title, is_homepage, is_published, show_in_navigation, sort_order").eq("store_id", storeData.id).order("sort_order", { ascending: true }),
        supabase.from("store_navigation").select("type, items").eq("store_id", storeData.id),
        supabase.from("store_products").select("id, name").eq("store_id", storeData.id).eq("is_active", true).order("created_at", { ascending: false }).limit(200),
      ]);
      const pageList = pagesData || [];
      const st = storeText(storeData.storefront_language === "ar" ? "ar" : "fr");
      const saved = (type: Kind) => customLinks((navData || []).find((n: any) => n.type === type)?.items);
      const header = saved("header");
      const footer = saved("footer");
      setPages(pageList);
      setProducts(productData || []);
      setMenus({
        header: header.length ? { items: header, custom: true } : { items: autoHeaderLinks(pageList, { home: st("nav.home"), products: st("nav.products") }), custom: false },
        footer: footer.length ? { items: footer, custom: true } : { items: autoFooterLinks(pageList), custom: false },
      });
      setLoading(false);
    })();
  }, []);

  const options = useMemo(() => {
    const pageOptions: Option[] = [
      { value: "/home", label: tr("dest_home") },
      { value: "/shop", label: tr("dest_shop") },
      { value: "/track", label: tr("dest_track") },
      ...pages
        .filter((p) => p.slug && !p.is_homepage && p.slug !== "shop" && p.slug !== "home")
        .map((p) => ({ value: `/${p.slug}`, label: p.title || p.name || p.slug })),
    ];
    const productOptions: Option[] = products.map((p) => ({ value: `/p/${p.id}`, label: p.name }));
    return { pageOptions, productOptions };
  }, [pages, products, t]);

  const update = (kind: Kind, items: MenuLink[]) => {
    setMenus((prev) => ({ ...prev, [kind]: { items, custom: true } }));
    setDirty(true);
  };

  const addItem = (kind: Kind) => {
    update(kind, [...menus[kind].items, { id: crypto.randomUUID(), label: tr("new_link"), url: "/shop" }]);
  };

  const move = (kind: Kind, index: number, delta: number) => {
    const items = [...menus[kind].items];
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    update(kind, items);
  };

  const resetToAuto = (kind: Kind) => {
    const st = storeText(store?.storefront_language === "ar" ? "ar" : "fr");
    const items = kind === "header" ? autoHeaderLinks(pages, { home: st("nav.home"), products: st("nav.products") }) : autoFooterLinks(pages);
    setMenus((prev) => ({ ...prev, [kind]: { items, custom: false } }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!store) return;
    const invalid = (["header", "footer"] as Kind[]).some((kind) =>
      menus[kind].items.some((i) => !i.label.trim() || (isExternalUrl(i.url) && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(i.url)))
    );
    if (invalid) {
      toast.error(tr("invalid"));
      return;
    }
    setSaving(true);
    const supabase = createClient();
    try {
      for (const kind of ["header", "footer"] as Kind[]) {
        const items = menus[kind].custom ? menus[kind].items.map((i) => ({ id: i.id, label: i.label.trim(), url: i.url })) : [];
        const { data: existing } = await supabase.from("store_navigation").select("id").eq("store_id", store.id).eq("type", kind).limit(1).maybeSingle();
        const row = {
          store_id: store.id,
          type: kind,
          location: kind,
          label: kind === "header" ? "Menu principal" : "Pied de page",
          link_type: "page",
          link_value: kind,
          items,
        };
        const { error } = existing
          ? await supabase.from("store_navigation").update(row).eq("id", existing.id)
          : await supabase.from("store_navigation").insert(row);
        if (error) throw error;
      }
      setDirty(false);
      toast.success(tr("saved"));
    } catch {
      toast.error(tr("save_error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">{tr("no_store")}</p>
        <Button asChild className="mt-4">
          <Link href="/seller/store/create">{tr("create_store")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8 pb-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">{tr("title")}</h1>
          <p className="mt-1 text-gray-500">{tr("subtitle")}</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !dirty} className="h-11 rounded-xl bg-purple-600 px-6 font-bold hover:bg-purple-700">
          {saving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Save className="w-4 h-4 me-2" />}
          {tr("save")}
        </Button>
      </div>

      {(["header", "footer"] as Kind[]).map((kind) => {
        const menu = menus[kind];
        return (
          <Card key={kind} className="rounded-3xl border-none shadow-xl shadow-gray-200/50">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {kind === "header" ? <Navigation className="w-5 h-5 text-purple-600" /> : <PanelBottom className="w-5 h-5 text-teal-600" />}
                  {tr(`${kind}_title`)}
                </CardTitle>
                <CardDescription className="mt-1">{tr(`${kind}_help`)}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => addItem(kind)} className="shrink-0 rounded-xl">
                <Plus className="w-4 h-4 me-1" />
                {tr("add")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {!menu.custom ? (
                <div className="flex items-start gap-2 rounded-2xl bg-purple-50 p-3 text-sm text-purple-800">
                  <Sparkles className="mt-0.5 w-4 h-4 shrink-0" />
                  <span>{tr(`${kind}_auto`)}</span>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => resetToAuto(kind)} className="text-gray-500">
                    <RotateCcw className="w-4 h-4 me-1" />
                    {tr("reset")}
                  </Button>
                </div>
              )}
              {menu.items.length === 0 ? (
                <p className="rounded-2xl border-2 border-dashed p-6 text-center text-sm text-gray-400">{tr("empty")}</p>
              ) : (
                <Reorder.Group axis="y" values={menu.items} onReorder={(items) => update(kind, items)} className="space-y-2">
                  {menu.items.map((item, index) => (
                    <MenuRow
                      key={item.id}
                      item={item}
                      options={options}
                      tr={tr}
                      first={index === 0}
                      last={index === menu.items.length - 1}
                      onMove={(delta) => move(kind, index, delta)}
                      onChange={(next) => update(kind, menu.items.map((i) => (i.id === item.id ? next : i)))}
                      onRemove={() => update(kind, menu.items.filter((i) => i.id !== item.id))}
                    />
                  ))}
                </Reorder.Group>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function MenuRow({
  item,
  options,
  tr,
  first,
  last,
  onMove,
  onChange,
  onRemove,
}: {
  item: MenuLink;
  options: { pageOptions: Option[]; productOptions: Option[] };
  tr: (key: string) => string;
  first: boolean;
  last: boolean;
  onMove: (delta: number) => void;
  onChange: (item: MenuLink) => void;
  onRemove: () => void;
}) {
  const external = isExternalUrl(item.url) || item.url === "https://";
  const known = [...options.pageOptions, ...options.productOptions].some((o) => o.value === item.url);
  const selectValue = external ? EXTERNAL : known ? item.url : undefined;

  return (
    <Reorder.Item value={item} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3">
      <GripVertical className="mt-8 hidden w-4 h-4 shrink-0 cursor-grab text-gray-300 md:block" />
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-500">{tr("label")}</Label>
          <Input value={item.label} onChange={(e) => onChange({ ...item, label: e.target.value })} className="h-10 rounded-xl" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-500">{tr("destination")}</Label>
          <Select
            value={selectValue}
            onValueChange={(v) => onChange({ ...item, url: v === EXTERNAL ? "https://" : v })}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder={tr("choose")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{tr("group_pages")}</SelectLabel>
                {options.pageOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              {options.productOptions.length > 0 && (
                <SelectGroup>
                  <SelectLabel>{tr("group_products")}</SelectLabel>
                  {options.productOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              <SelectGroup>
                <SelectLabel>{tr("group_other")}</SelectLabel>
                <SelectItem value={EXTERNAL}>{tr("dest_external")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {external && (
            <Input
              dir="ltr"
              placeholder="https://instagram.com/maboutique"
              value={item.url === "https://" ? "" : item.url}
              onChange={(e) => onChange({ ...item, url: e.target.value ? normalizeExternalUrl(e.target.value) : "https://" })}
              className="mt-2 h-10 rounded-xl"
            />
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1 pt-6">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" disabled={first} onClick={() => onMove(-1)} aria-label={tr("move_up")}>
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" disabled={last} onClick={() => onMove(1)} aria-label={tr("move_down")}>
          <ArrowDown className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-500" onClick={onRemove} aria-label={tr("remove")}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}
