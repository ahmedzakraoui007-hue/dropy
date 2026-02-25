// src/hooks/store-builder/useStoreConfig.ts
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  StoreConfig, Theme, ThemeConfig, ColorConfig, 
  TypographyConfig, HeaderConfig, FooterConfig, LayoutConfig 
} from '@/types/store-builder';

export function useStoreConfig(sellerId: string) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      if (!sellerId) return;
      const supabase = createClient();
      
      const { data: configData } = await supabase
        .from('store_configs')
        .select('*, theme:themes(*)')
        .eq('seller_id', sellerId)
        .single();

      if (configData) {
        setConfig(configData);
        setTheme(configData.theme);
      }
      setLoading(false);
    }
    fetch();
  }, [sellerId]);

  const finalConfig = useMemo((): ThemeConfig | null => {
    if (!theme) return null;

    return {
      colors: { ...theme.default_config.colors, ...config?.colors },
      typography: { ...theme.default_config.typography, ...config?.typography },
      layout: { ...theme.default_config.layout, ...config?.layout },
      header: { ...theme.default_config.header, ...config?.header_config },
      footer: { ...theme.default_config.footer, ...config?.footer_config }
    } as ThemeConfig;
  }, [theme, config]);

  const updateConfig = async (updates: Partial<StoreConfig>) => {
    if (!sellerId) return false;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('store_configs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('seller_id', sellerId);

    if (!error) {
      setConfig(prev => prev ? { ...prev, ...updates } : null);
    } else {
      console.error('Error updating store config:', error);
    }
    setSaving(false);
    return !error;
  };

  const updateColors = (colors: Partial<ColorConfig>) => 
    updateConfig({ colors: { ...config?.colors, ...colors } });

  const updateTypography = (typography: Partial<TypographyConfig>) =>
    updateConfig({ typography: { ...config?.typography, ...typography } });

  const updateHeader = (header: Partial<HeaderConfig>) =>
    updateConfig({ header_config: { ...config?.header_config, ...header } });

  const updateFooter = (footer: Partial<FooterConfig>) =>
    updateConfig({ footer_config: { ...config?.footer_config, ...footer } });

  const uploadAsset = async (file: File, type: 'logo' | 'logo_dark' | 'favicon') => {
    const supabase = createClient();
    const fileName = `${sellerId}/${type}-${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('store-assets')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Error uploading asset:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('store-assets')
      .getPublicUrl(fileName);

    const field = type === 'logo' ? 'logo_url' : type === 'logo_dark' ? 'logo_dark_url' : 'favicon_url';
    await updateConfig({ [field]: publicUrl });

    return publicUrl;
  };

  const publish = async () => {
    return updateConfig({ 
      is_published: true, 
      published_at: new Date().toISOString() 
    });
  };

  const unpublish = async () => {
    return updateConfig({ is_published: false });
  };

  return {
    config,
    theme,
    finalConfig,
    loading,
    saving,
    updateConfig,
    updateColors,
    updateTypography,
    updateHeader,
    updateFooter,
    uploadAsset,
    publish,
    unpublish
  };
}
