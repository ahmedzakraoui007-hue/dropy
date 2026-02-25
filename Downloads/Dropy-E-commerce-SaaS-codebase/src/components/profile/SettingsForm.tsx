"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Store, 
  CreditCard, 
  Camera, 
  Loader2, 
  Save, 
  ShieldCheck,
  Building2,
  Wallet,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function SettingsForm() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showRib, setShowRib] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error) {
      setProfile(data);
    }
    setLoading(false);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        bank_name: profile.bank_name,
        bank_rib: profile.bank_rib,
        bank_iban: profile.bank_iban,
        d17_number: profile.d17_number,
        flouci_number: profile.flouci_number,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Profil mis à jour avec succès");
    }
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Erreur lors de l'upload de l'avatar");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("media")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      toast.error("Erreur lors de la mise à jour du profil");
    } else {
      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success("Avatar mis à jour !");
    }
    setUploading(false);
  }

  const maskValue = (value: string | null) => {
    if (!value) return "";
    if (showRib) return value;
    return value.replace(/.(?=.{4})/g, "*");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <Wallet className="w-4 h-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Mettez à jour vos coordonnées et votre avatar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/50">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 border-2 border-primary/20 transition-transform group-hover:scale-105">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                        {profile?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-lg hover:bg-primary/90 transition-colors"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarUpload} 
                        className="hidden" 
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold">{profile?.full_name || "Utilisateur"}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{profile?.email}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize">
                      {profile?.role === "seller" ? "Vendeur" : profile?.role === "supplier" ? "Fournisseur" : "Créateur"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        value={profile?.full_name || ""} 
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        value={profile?.phone || ""} 
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Non modifiable)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                      <Input 
                        id="email" 
                        value={profile?.email || ""} 
                        disabled 
                        className="pl-9 bg-muted/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle (Contactez le support pour modifier)</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                      <Input 
                        id="role" 
                        value={profile?.role || ""} 
                        disabled 
                        className="pl-9 bg-muted/50 capitalize"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="payment">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Détails de paiement</CardTitle>
                <CardDescription>
                  Configurez vos informations de virement bancaire ou mobile.
                  {profile?.role === "creator" && " (Nécessaire pour recevoir vos gains)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Nom de la banque</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="bank_name" 
                        placeholder="BIAT, BH, Amen Bank..." 
                        value={profile?.bank_name || ""} 
                        onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bank_rib">RIB (20 chiffres)</Label>
                      <button 
                        type="button" 
                        onClick={() => setShowRib(!showRib)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {showRib ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showRib ? "Masquer" : "Afficher"}
                      </button>
                    </div>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="bank_rib" 
                        placeholder="XX XXX XXXXXXXXXXXXXXXX XX" 
                        value={maskValue(profile?.bank_rib)} 
                        onChange={(e) => setProfile({ ...profile, bank_rib: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Paiements Mobiles (Optionnel)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="d17">Numéro D17</Label>
                      <Input 
                        id="d17" 
                        placeholder="Numéro associé" 
                        value={profile?.d17_number || ""} 
                        onChange={(e) => setProfile({ ...profile, d17_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flouci">Numéro Flouci</Label>
                      <Input 
                        id="flouci" 
                        placeholder="Numéro associé" 
                        value={profile?.flouci_number || ""} 
                        onChange={(e) => setProfile({ ...profile, flouci_number: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder les modes de paiement
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>Gérez votre mot de passe et l'authentification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Changer le mot de passe</p>
                    <p className="text-sm text-muted-foreground">Modifier votre mot de passe de connexion.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Fonctionnalité disponible via l'email de réinitialisation")}>
                  Modifier
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-500/20 bg-red-500/5 rounded-xl">
                <div className="flex items-center gap-3 text-red-600">
                  <ShieldCheck className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-red-700">Supprimer le compte</p>
                    <p className="text-sm text-red-600/70">Action irréversible. Toutes vos données seront effacées.</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm">Supprimer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
