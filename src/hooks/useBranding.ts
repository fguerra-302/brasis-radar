import { useState, useEffect } from 'react';
import { 
  BrandingConfig, 
  getBrandingConfig, 
  setBrandingConfig as saveBrandingConfig,
  initializeBranding 
} from '@/config/branding';

export const useBranding = () => {
  const [brandingConfig, setBrandingConfigState] = useState<BrandingConfig>(getBrandingConfig);

  useEffect(() => {
    // Inicializar branding ao montar o hook
    initializeBranding();
  }, []);

  const updateBrandingConfig = (config: Partial<BrandingConfig>) => {
    const newConfig = { ...brandingConfig, ...config };
    setBrandingConfigState(newConfig);
    saveBrandingConfig(config);
  };

  const resetBrandingConfig = () => {
    localStorage.removeItem('branding-config');
    const defaultConfig = getBrandingConfig();
    setBrandingConfigState(defaultConfig);
    initializeBranding();
  };

  return {
    brandingConfig,
    updateBrandingConfig,
    resetBrandingConfig,
  };
};