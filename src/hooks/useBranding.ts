import { useState, useEffect, useMemo } from 'react';
import { useUserSettings, useUpsertUserSettings, UserSettings } from './useUserSettings';
import { defaultBrandingConfig, BrandingConfig } from '@/config/branding';

export const useBranding = () => {
  const { data: userSettings, isLoading } = useUserSettings();
  const upsertSettings = useUpsertUserSettings();
  
  // Converter configurações do usuário para formato de branding
  const brandingConfig = useMemo((): BrandingConfig => {
    if (!userSettings) {
      return defaultBrandingConfig;
    }

    return {
      companyName: userSettings.company_name,
      companyTagline: "Inteligência Artificial para Curadoria de Conteúdo",
      companyDescription: userSettings.company_description,
      logoUrl: userSettings.logo_url || undefined,
      faviconUrl: userSettings.favicon_url || undefined,
      colors: {
        primary: convertColorToHSL(userSettings.primary_color),
        secondary: convertColorToHSL(userSettings.secondary_color),
        accent: "146 67% 32%", // Manter padrão
        background: "0 0% 100%", // Manter padrão
        foreground: "222.2 84% 4.9%", // Manter padrão
      },
      newsletterSignature: userSettings.newsletter_signature,
      newsletterFooter: userSettings.newsletter_footer,
      welcomeMessage: `Bem-vindo ao ${userSettings.company_name}`,
      dashboardTitle: "Radar Brasis",
      metaTitle: userSettings.company_name,
      metaDescription: userSettings.company_description,
    };
  }, [userSettings]);

  // Load local branding config on startup
  useEffect(() => {
    const localBranding = localStorage.getItem('branding-config');
    if (localBranding) {
      try {
        const parsed = JSON.parse(localBranding);
        console.log('🎨 Aplicando branding local:', parsed);
        applyCSSVariables(parsed);
        updatePageMeta(parsed);
      } catch (error) {
        console.error('Erro ao carregar branding local:', error);
      }
    }
  }, []);

  // Aplicar CSS ao montar/atualizar
  useEffect(() => {
    if (!isLoading) {
      applyCSSVariables(brandingConfig);
      updatePageMeta(brandingConfig);
      // Save to localStorage for immediate local persistence
      localStorage.setItem('branding-config', JSON.stringify(brandingConfig));
    }
  }, [brandingConfig, isLoading]);

  const updateBrandingConfig = async (config: Partial<BrandingConfig>) => {
    try {
      // Apply immediately to DOM for instant feedback
      const updatedConfig = { ...brandingConfig, ...config };
      applyCSSVariables(updatedConfig);
      updatePageMeta(updatedConfig);
      
      // Save to localStorage for persistence
      localStorage.setItem('branding-config', JSON.stringify(updatedConfig));
      
      // Also save to database if user is authenticated
      const payload = {
        company_name: config.companyName,
        company_description: config.companyDescription,
        logo_url: config.logoUrl,
        favicon_url: config.faviconUrl,
        primary_color: config.colors?.primary ? convertHSLToHex(config.colors.primary) : undefined,
        secondary_color: config.colors?.secondary ? convertHSLToHex(config.colors.secondary) : undefined,
        newsletter_signature: config.newsletterSignature,
        newsletter_footer: config.newsletterFooter,
      };

      // Filtrar valores undefined
      const filteredPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined)
      );

      await upsertSettings.mutateAsync(filteredPayload);
    } catch (error) {
      console.log('🎨 Branding aplicado localmente (sem login)');
      // If database save fails, branding is still applied locally
    }
  };

  const resetBrandingConfig = async () => {
    try {
      const defaultPayload = {
        company_name: defaultBrandingConfig.companyName,
        company_description: defaultBrandingConfig.companyDescription,
        logo_url: null,
        favicon_url: null,
        primary_color: convertHSLToHex(defaultBrandingConfig.colors.primary),
        secondary_color: convertHSLToHex(defaultBrandingConfig.colors.secondary),
        newsletter_signature: defaultBrandingConfig.newsletterSignature,
        newsletter_footer: defaultBrandingConfig.newsletterFooter,
      };

      await upsertSettings.mutateAsync(defaultPayload);
    } catch (error) {
      console.error('Erro ao resetar branding:', error);
    }
  };

  return {
    brandingConfig,
    updateBrandingConfig,
    resetBrandingConfig,
    isLoading,
    userSettings,
  };
};

// Utilitários para conversão de cores
function convertColorToHSL(hexColor: string): string {
  // Se já está em formato HSL, retornar como está
  if (!hexColor.startsWith('#')) {
    return hexColor;
  }
  
  // Converter hex para HSL
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const sum = max + min;
  const l = sum / 2;

  let h = 0;
  let s = 0;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - sum) : diff / sum;
    
    switch (max) {
      case r:
        h = ((g - b) / diff) + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function convertHSLToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map((val, index) => {
    if (index === 0) return parseInt(val);
    return parseInt(val.replace('%', '')) / 100;
  });

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function applyCSSVariables(config: BrandingConfig): void {
  if (typeof window === "undefined") return;
  
  const root = document.documentElement;
  
  // Aplicar cores personalizadas
  root.style.setProperty('--primary', config.colors.primary);
  root.style.setProperty('--secondary', config.colors.secondary);
  root.style.setProperty('--accent', config.colors.accent);
  root.style.setProperty('--background', config.colors.background);
  root.style.setProperty('--foreground', config.colors.foreground);
  
  // Aplicar fonte personalizada se fornecida
  if (config.fontFamily) {
    root.style.setProperty('--font-family', config.fontFamily);
    document.body.style.fontFamily = config.fontFamily;
  }
}

function updatePageMeta(config: BrandingConfig): void {
  if (typeof window === "undefined") return;
  
  // Atualizar título da página
  document.title = config.metaTitle;
  
  // Atualizar meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', config.metaDescription);
  }
  
  // Atualizar favicon se existir
  if (config.faviconUrl) {
    updateFavicon(config.faviconUrl);
  }
}

function updateFavicon(faviconUrl: string): void {
  if (typeof window === "undefined") return;
  
  // Remove favicon existente
  const existingFavicon = document.querySelector('link[rel="icon"]');
  if (existingFavicon) {
    existingFavicon.remove();
  }
  
  // Adiciona novo favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = faviconUrl;
  link.type = 'image/png';
  document.head.appendChild(link);
}