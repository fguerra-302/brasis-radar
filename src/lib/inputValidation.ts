// Enhanced input validation utilities for security

// SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /(;|--|\/\*|\*\/|xp_|sp_)/i,
  /('|('')|"|(\+)|(\|\|))/i
];

// Check for potential SQL injection attempts
export const containsSQLInjection = (input: string): boolean => {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

// Check for HTML/XSS attempts
export const containsHTMLTags = (input: string): boolean => {
  return /<[^>]*>/g.test(input);
};

// Enhanced URL validation with security checks
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL é obrigatória' };
  }

  // Check for SQL injection attempts
  if (containsSQLInjection(url)) {
    return { isValid: false, error: 'Caracteres inválidos detectados na URL' };
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

    // Additional security: block common malicious patterns
    if (url.includes('javascript:') || url.includes('data:') || url.includes('vbscript:')) {
      return { isValid: false, error: 'URL contém protocolo não permitido' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Formato de URL inválido' };
  }
};

// Enhanced string sanitization
export const sanitizeString = (input: string, maxLength = 255): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Check for SQL injection attempts
  if (containsSQLInjection(input)) {
    console.warn('Potential SQL injection attempt detected:', input.substring(0, 50));
    return '';
  }
  
  // Remove HTML tags and dangerous characters
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .substring(0, maxLength);
};

// Validate content title with security checks
export const validateTitle = (title: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!title || typeof title !== 'string') {
    return { isValid: false, sanitized: '', error: 'Título é obrigatório' };
  }

  if (title.length < 3) {
    return { isValid: false, sanitized: '', error: 'Título deve ter pelo menos 3 caracteres' };
  }

  if (title.length > 200) {
    return { isValid: false, sanitized: '', error: 'Título muito longo (máximo 200 caracteres)' };
  }

  if (containsSQLInjection(title)) {
    return { isValid: false, sanitized: '', error: 'Título contém caracteres inválidos' };
  }

  if (containsHTMLTags(title)) {
    return { isValid: false, sanitized: '', error: 'HTML não é permitido no título' };
  }

  const sanitized = sanitizeString(title, 200);
  return { isValid: true, sanitized };
};

// Enhanced editoria validation
export const validateEditoria = (editoria: string): string => {
  if (!editoria || typeof editoria !== 'string') return 'Geral';
  
  const validEditorias = ['Cultura', 'Social', 'Negócios', 'Sustentabilidade', 'Regional', 'Geral', 'Newsletter'];
  const sanitized = sanitizeString(editoria, 50);
  return validEditorias.includes(sanitized) ? sanitized : 'Geral';
};

// Enhanced tags validation with security
export const validateTags = (tags: string[]): string[] => {
  if (!Array.isArray(tags)) return [];
  
  return tags
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(tag => {
      const sanitized = sanitizeString(tag, 30);
      // Additional check: reject tags with SQL injection patterns
      return containsSQLInjection(sanitized) ? '' : sanitized;
    })
    .filter(tag => tag.length > 0)
    .slice(0, 10); // Max 10 tags
};

// Enhanced score validation
export const validateScore = (score: number): number => {
  const numScore = Number(score);
  if (isNaN(numScore)) return 1;
  return Math.max(1, Math.min(5, Math.floor(numScore)));
};

// Validate search terms with security checks
export const validateSearchTerms = (searchTerms: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!searchTerms || typeof searchTerms !== 'string') {
    return { isValid: false, sanitized: '', error: 'Termo de busca é obrigatório' };
  }

  if (searchTerms.length < 2) {
    return { isValid: false, sanitized: '', error: 'Termo de busca deve ter pelo menos 2 caracteres' };
  }

  if (searchTerms.length > 100) {
    return { isValid: false, sanitized: '', error: 'Termo de busca muito longo (máximo 100 caracteres)' };
  }

  if (containsSQLInjection(searchTerms)) {
    return { isValid: false, sanitized: '', error: 'Termo de busca contém caracteres inválidos' };
  }

  const sanitized = sanitizeString(searchTerms, 100);
  return { isValid: true, sanitized };
};

// Validate status with allowed values
export const validateStatus = (status: string): string => {
  const validStatuses = [
    'Em aprovação',
    'Para Newsletter',
    'Para Redes Sociais',
    'Newsletter Enviada',
    'Redes Sociais Publicado',
    'Ignorado',
    'Publicado',
    'Na Newsletter',
    'Em edição'
  ];
  
  return validStatuses.includes(status) ? status : 'Em aprovação';
};

// Rate limiting helper for edge functions
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier)!;
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    return true;
  };
};

// Comprehensive validation for radar content
export const validateRadarContent = (content: { [key: string]: string | string[] }): { isValid: boolean; errors: string[]; sanitized?: { [key: string]: string | string[] } } => {
  const errors: string[] = [];
  const sanitized: { [key: string]: string | string[] } = {};

  // Validate title
  const titleValidation = validateTitle(content.title);
  if (!titleValidation.isValid) {
    errors.push(`Título: ${titleValidation.error}`);
  } else {
    sanitized.title = titleValidation.sanitized;
  }

  // Validate URL
  const urlValidation = validateUrl(content.link);
  if (!urlValidation.isValid) {
    errors.push(`URL: ${urlValidation.error}`);
  } else {
    sanitized.link = content.link;
  }

  // Validate source
  if (!content.source || typeof content.source !== 'string') {
    errors.push('Fonte é obrigatória');
  } else {
    sanitized.source = sanitizeString(content.source, 100);
  }

  // Validate editoria
  sanitized.editoria = validateEditoria(content.editoria);

  // Validate tags
  sanitized.tags = validateTags(content.tags);

  // Validate score
  sanitized.relevancia = validateScore(content.relevancia);

  // Validate status
  sanitized.status = validateStatus(content.status);

  // Validate resumo_curado if provided
  if (content.resumo_curado) {
    if (containsSQLInjection(content.resumo_curado)) {
      errors.push('Resumo contém caracteres inválidos');
    } else {
      sanitized.resumo_curado = sanitizeString(content.resumo_curado, 2000);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined
  };
};