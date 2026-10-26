"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/LanguageContext";

type Member = { id: string; email: string; full_name: string | null; status: "active" | "disabled"; created_at: string };

export default function TeamPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.team.${key}`);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seller/team", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { members: [] }))
      .then((data) => setMembers(data.members || []))
      .finally(() => setLoading(false));
  }, []);

  const call = async (key: string, init: RequestInit, url = "/api/seller/team") => {
    setBusy(key);
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      toast.error(tr(`errors.${data.error || "generic"}`));
      return null;
    }
    if (data.members) setMembers(data.members);
    return data;
  };

  const invite = async () => {
    const data = await call("invite", { method: "POST", body: JSON.stringify({ name, email }) });
    if (!data) return;
    setName("");
    setEmail("");
    toast.success(data.invited ? tr("invited") : tr("invited_no_mail"));
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <div className="space-y-2">
        <Link href="/seller/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("seller_app.leads.back")}
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users className="h-6 w-6 text-purple-600" />
          {tr("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{tr("subtitle")}</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{tr("invite_title")}</CardTitle>
          <CardDescription>{tr("invite_help")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              void invite();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="agent-name">{tr("name")}</Label>
              <Input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agent-email">{tr("email")}</Label>
              <Input id="agent-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={busy === "invite" || !email.trim()} className="rounded-xl">
              {busy === "invite" ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <UserPlus className="me-2 h-4 w-4" />}
              {tr("invite")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{tr("members")}</CardTitle>
          <CardDescription>{tr("members_help")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <p className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">{tr("empty")}</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {members.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{member.full_name || member.email}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">{member.email}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={member.status === "active"}
                      disabled={busy === member.id}
                      onCheckedChange={(on) => call(member.id, { method: "PATCH", body: JSON.stringify({ id: member.id, status: on ? "active" : "disabled" }) })}
                    />
                    {tr(member.status === "active" ? "active" : "disabled")}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === member.id}
                    onClick={async () => {
                      const data = await call(member.id, { method: "PATCH", body: JSON.stringify({ id: member.id, action: "resend" }) });
                      if (data) toast.success(data.invited ? tr("invited") : tr("invited_no_mail"));
                    }}
                  >
                    <Mail className="me-1 h-4 w-4" />
                    {tr("resend")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    disabled={busy === member.id}
                    aria-label={tr("remove")}
                    onClick={() => {
                      if (window.confirm(tr("remove_confirm").replace("{name}", member.full_name || member.email))) {
                        void call(member.id, { method: "DELETE" }, `/api/seller/team?id=${member.id}`);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">{tr("access_note")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
