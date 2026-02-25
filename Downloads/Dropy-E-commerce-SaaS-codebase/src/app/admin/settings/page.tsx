"use client";

import { useEffect, useState } from "react";
import { 
  Settings, 
  Save, 
  Shield, 
  Percent, 
  Clock, 
  Mail, 
  Power,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PlatformSetting {
  key: string;
  value: any;
  description: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("key");
    
    if (error) {
      toast.error("Erreur lors du chargement des paramètres");
    } else {
      setSettings(data || []);
    }
    setLoading(false);
  };

  const handleUpdateSetting = (key: string, newValue: any) => {
    setSettings(prev => prev.map(s => 
      s.key === key ? { ...s, value: newValue } : s
    ));
  };

  const saveSettings = async () => {
    setSaving(true);
    const supabase = createClient();
    
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from("platform_settings")
          .update({ value: setting.value })
          .eq("key", setting.key);
        
        if (error) throw error;
      }
      toast.success("Paramètres mis à jour avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-500 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Paramètres de la Plateforme
          </h1>
          <p className="text-muted-foreground">Configurez les réglages globaux de Dropy.</p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-red-500 hover:bg-red-600"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Sauvegarder les modifications
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Frais et Commissions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-red-500" />
              Frais & Commissions
            </CardTitle>
            <CardDescription>Gérez les prélèvements de la plateforme.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="platform_fee_percent">Commission Plateforme (%)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="platform_fee_percent"
                  type="number"
                  value={settings.find(s => s.key === 'platform_fee_percent')?.value || 0}
                  onChange={(e) => handleUpdateSetting('platform_fee_percent', parseFloat(e.target.value))}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.find(s => s.key === 'platform_fee_percent')?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sécurité et Escrow */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Sécurité & Paiements
            </CardTitle>
            <CardDescription>Configuration du système de séquestre.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="escrow_holding_period_days">Période de rétention Escrow (jours)</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Input 
                  id="escrow_holding_period_days"
                  type="number"
                  value={settings.find(s => s.key === 'escrow_holding_period_days')?.value || 0}
                  onChange={(e) => handleUpdateSetting('escrow_holding_period_days', parseInt(e.target.value))}
                />
                <span className="text-muted-foreground">jours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.find(s => s.key === 'escrow_holding_period_days')?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact et Support */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-500" />
              Contact & Support
            </CardTitle>
            <CardDescription>Informations de contact officielles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="support_email">Email de Support</Label>
              <Input 
                id="support_email"
                type="email"
                value={settings.find(s => s.key === 'support_email')?.value || ""}
                onChange={(e) => handleUpdateSetting('support_email', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {settings.find(s => s.key === 'support_email')?.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Système */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="w-5 h-5 text-red-500" />
              Système
            </CardTitle>
            <CardDescription>Contrôle de l&apos;état de la plateforme.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance_mode">Mode Maintenance</Label>
                <p className="text-xs text-muted-foreground">
                  {settings.find(s => s.key === 'maintenance_mode')?.description}
                </p>
              </div>
              <Switch 
                id="maintenance_mode"
                checked={settings.find(s => s.key === 'maintenance_mode')?.value === true}
                onCheckedChange={(checked) => handleUpdateSetting('maintenance_mode', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex items-center gap-4 py-4">
          <Info className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Les modifications apportées ici affectent l&apos;ensemble de la plateforme en temps réel après enregistrement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
