import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConfigStatus {
  isConfigured: boolean;
  hasAuthError: boolean;
  canSignUp: boolean;
  canSignIn: boolean;
  lastChecked: Date;
}

export const useConfigStatus = () => {
  const [status, setStatus] = useState<ConfigStatus>({
    isConfigured: false,
    hasAuthError: false,
    canSignUp: false,
    canSignIn: false,
    lastChecked: new Date()
  });
  const [loading, setLoading] = useState(true);

  const checkConfiguration = async () => {
    setLoading(true);
    try {
      // Test basic connection only - no intrusive operations
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      // Basic check - if we can get session without errors, configuration is likely working
      const hasAuthError = !!sessionError;
      
      // For now, consider it configured if there are no session errors
      // Users will discover actual auth issues when they try to sign in/up
      setStatus({
        isConfigured: !hasAuthError,
        hasAuthError,
        canSignUp: !hasAuthError,
        canSignIn: !hasAuthError,
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('Configuration check failed:', error);
      setStatus({
        isConfigured: false,
        hasAuthError: true,
        canSignUp: false,
        canSignIn: false,
        lastChecked: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  return { status, loading, recheckConfig: checkConfiguration };
};