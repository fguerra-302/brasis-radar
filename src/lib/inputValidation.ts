// Input validation utilities for security

export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL é obrigatória' };
  }

  try {
    const urlObj = new URL(url.trim());
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Apenas URLs HTTP/HTTPS são permitidas' };
    }

    // Block localhost and private IPs for security
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return { isValid: false, error: 'URLs locais não são permitidas' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Formato de URL inválido' };
  }
};

export const sanitizeString = (input: string, maxLength = 255): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags and dangerous characters
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, maxLength);
};

export const validateEditoria = (editoria: string): string => {
  const validEditorias = ['Cultura', 'Social', 'Negócios', 'Sustentabilidade', 'Regional', 'Geral'];
  return validEditorias.includes(editoria) ? editoria : 'Geral';
};

export const validateTags = (tags: any): string[] => {
  if (!Array.isArray(tags)) return [];
  
  return tags
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(tag => sanitizeString(tag, 50))
    .slice(0, 10); // Max 10 tags
};

export const validateScore = (score: any): number => {
  const numScore = Number(score);
  if (isNaN(numScore)) return 1;
  return Math.max(1, Math.min(5, Math.floor(numScore)));
};