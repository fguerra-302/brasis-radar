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
      // Test basic connection
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      // Test sign up capability (without actually signing up)
      const testEmail = 'test@example.com';
      const { error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123',
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      const hasAuthError = !!(sessionError || (signUpError && !signUpError.message.includes('User already registered')));
      const configIssues = signUpError?.message.includes('requested path is invalid') || 
                          signUpError?.message.includes('redirect') ||
                          signUpError?.message.includes('Invalid redirect URL');

      setStatus({
        isConfigured: !configIssues,
        hasAuthError,
        canSignUp: !configIssues,
        canSignIn: !configIssues,
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