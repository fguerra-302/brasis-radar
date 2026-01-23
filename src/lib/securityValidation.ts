
/**
 * Validações de segurança adicionais para o sistema
 */

export const SecurityValidator = {
  /**
   * Valida se um conteúdo contém tentativas de código malicioso
   */
  validateContent: (content: string): { isValid: boolean; reason?: string } => {
    if (!content || typeof content !== 'string') {
      return { isValid: false, reason: 'Conteúdo inválido' };
    }

    // Detectar tentativas de script injection
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:\s*text\/html/gi,
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(content)) {
        return { isValid: false, reason: 'Conteúdo contém código potencialmente malicioso' };
      }
    }

    // Verificar tamanho máximo
    if (content.length > 50000) {
      return { isValid: false, reason: 'Conteúdo excede tamanho máximo permitido' };
    }

    return { isValid: true };
  },

  /**
   * Valida URLs para prevenir SSRF
   */
  validateUrl: (url: string): { isValid: boolean; reason?: string } => {
    if (!url || typeof url !== 'string') {
      return { isValid: false, reason: 'URL inválida' };
    }

    try {
      const urlObj = new URL(url);
      
      // Apenas HTTP/HTTPS permitidos
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, reason: 'Protocolo não permitido' };
      }

      // Bloquear IPs locais
      const hostname = urlObj.hostname.toLowerCase();
      const localPatterns = [
        /^localhost$/,
        /^127\./,
        /^192\.168\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^::1$/,
        /^0\.0\.0\.0$/,
      ];

      for (const pattern of localPatterns) {
        if (pattern.test(hostname)) {
          return { isValid: false, reason: 'Acesso a IPs locais não permitido' };
        }
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, reason: 'Formato de URL inválido' };
    }
  },

  /**
   * Sanitiza texto removendo caracteres perigosos
   */
  sanitizeText: (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 10000); // Limita tamanho
  },

  /**
   * Valida dados de entrada de formulários
   */
  validateFormData: (data: Record<string, string>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Verificar cada campo
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        const contentCheck = SecurityValidator.validateContent(value);
        if (!contentCheck.isValid) {
          errors.push(`Campo ${key}: ${contentCheck.reason}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
