import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExternalApiSource {
  id: string;
  name: string;
  url: string;
  type: string;
  active: boolean;
}

export interface ExternalApiResult {
  success: boolean;
  message?: string;
  data?: any[];
  error?: string;
}

/**
 * Serviço para integração com API externa de scraping
 * Substitui as Edge Functions complexas por chamadas diretas à sua API
 */
export class ExternalApiService {
  private static baseUrl = ''; // URL da sua API externa - será configurável

  /**
   * Define a URL base da API externa
   */
  static setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Sincroniza uma fonte específica
   */
  static async syncSource(source: ExternalApiSource): Promise<ExternalApiResult> {
    try {
      if (!this.baseUrl) {
        return {
          success: false,
          error: 'URL da API externa não configurada'
        };
      }

      const response = await fetch(`${this.baseUrl}/sync-source`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: {
            id: source.id,
            name: source.name,
            url: source.url,
            type: source.type
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Atualizar timestamp de sincronização
      await this.updateLastSync(source.id);
      
      return {
        success: true,
        data: result.data,
        message: result.message
      };

    } catch (error) {
      console.error('Erro na sincronização:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Sincroniza todas as fontes ativas
   */
  static async syncAllSources(): Promise<ExternalApiResult> {
    try {
      // Buscar fontes ativas do usuário (excluindo credentials por segurança)
      const { data: sources, error } = await supabase
        .from('radar_sources')
        .select('id, name, url, type, active, config, external_api_config, last_sync, created_at, updated_at, user_id')
        .eq('active', true);

      if (error) {
        throw new Error(`Erro ao buscar fontes: ${error.message}`);
      }

      if (!sources || sources.length === 0) {
        return {
          success: true,
          message: 'Nenhuma fonte ativa encontrada',
          data: []
        };
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const source of sources) {
        const result = await this.syncSource(source as ExternalApiSource);
        results.push({
          source: source.name,
          ...result
        });
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      return {
        success: errorCount === 0,
        message: `Sincronização concluída: ${successCount} sucessos, ${errorCount} erros`,
        data: results
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na sincronização'
      };
    }
  }

  /**
   * Testa conectividade com uma fonte
   */
  static async testSource(source: ExternalApiSource): Promise<ExternalApiResult> {
    try {
      if (!this.baseUrl) {
        return {
          success: false,
          error: 'URL da API externa não configurada'
        };
      }

      const response = await fetch(`${this.baseUrl}/test-source`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        message: result.message,
        data: result.data
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no teste'
      };
    }
  }

  /**
   * Atualiza o timestamp de última sincronização
   */
  private static async updateLastSync(sourceId: string) {
    await supabase
      .from('radar_sources')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', sourceId);
  }

  /**
   * Verifica se a API externa está disponível
   */
  static async checkHealth(): Promise<boolean> {
    try {
      if (!this.baseUrl) return false;
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit);
      
      return response.ok;
    } catch {
      return false;
    }
  }
}