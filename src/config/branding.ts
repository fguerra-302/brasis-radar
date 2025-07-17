export interface BrandingConfig {
  // Informações da Empresa
  companyName: string;
  companyTagline: string;
  companyDescription: string;
  
  // Logos e Imagens
  logoUrl?: string;
  faviconUrl?: string;
  
  // Cores (HSL format)
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  
  // Tipografia
  fontFamily?: string;
  
  // Newsletter
  newsletterSignature: string;
  newsletterFooter: string;
  
  // Textos do Sistema
  welcomeMessage: string;
  dashboardTitle: string;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
}

export const defaultBrandingConfig: BrandingConfig = {
  companyName: "BRASIS.IA",
  companyTagline: "Inteligência Artificial para Curadoria de Conteúdo",
  companyDescription: "Sistema de curadoria de conteúdo para o DNA Brasis",
  
  colors: {
    primary: "221 75% 45%", // Brasis Blue
    secondary: "22 90% 55%", // Brasis Orange
    accent: "146 67% 32%", // Brasis Green
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
  },
  
  newsletterSignature: "Equipe BRASIS.IA",
  newsletterFooter: "Este conteúdo foi curado automaticamente pelo sistema BRASIS.IA",
  
  welcomeMessage: "Bem-vindo ao Radar BRASIS.IA",
  dashboardTitle: "Radar Brasis",
  
  metaTitle: "Radar Brasis",
  metaDescription: "Sistema de curadoria de conteúdo para o DNA Brasis",
};

// Storage key for localStorage
export const BRANDING_STORAGE_KEY = "branding-config";

export const getBrandingConfig = (): BrandingConfig => {
  if (typeof window === "undefined") return defaultBrandingConfig;
  
  try {
    const stored = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultBrandingConfig, ...parsed };
    }
  } catch (error) {
    console.error("Erro ao carregar configuração de branding:", error);
  }
  
  return defaultBrandingConfig;
};

export const setBrandingConfig = (config: Partial<BrandingConfig>): void => {
  if (typeof window === "undefined") return;
  
  try {
    const currentConfig = getBrandingConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(newConfig));
    
    // Aplicar cores CSS imediatamente
    applyCSSVariables(newConfig);
    
    // Atualizar título da página
    if (config.metaTitle) {
      document.title = config.metaTitle;
    }
    
    // Atualizar meta description
    if (config.metaDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', config.metaDescription);
      }
    }
    
    // Atualizar favicon se fornecido
    if (config.faviconUrl) {
      updateFavicon(config.faviconUrl);
    }
    
  } catch (error) {
    console.error("Erro ao salvar configuração de branding:", error);
  }
};

const applyCSSVariables = (config: BrandingConfig): void => {
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
};

const updateFavicon = (faviconUrl: string): void => {
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
};

// Inicializar branding ao carregar
export const initializeBranding = (): void => {
  if (typeof window === "undefined") return;
  
  const config = getBrandingConfig();
  applyCSSVariables(config);
  
  // Atualizar título da página
  document.title = config.metaTitle;
  
  // Atualizar favicon se existir
  if (config.faviconUrl) {
    updateFavicon(config.faviconUrl);
  }
};