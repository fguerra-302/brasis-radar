import { supabase } from '@/integrations/supabase/client';

/**
 * Secure API client that automatically includes authentication headers
 */
export class SecureApiClient {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async invokeFunction(functionName: string, body?: any) {
    try {
      const headers = await this.getAuthHeaders();
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error invoking function ${functionName}:`, error);
      throw error;
    }
  }
}

export const secureApi = new SecureApiClient();