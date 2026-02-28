import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const PasswordRecovery = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're in password recovery mode
    const recoveryFlag = sessionStorage.getItem('password-recovery');
    if (recoveryFlag) {
      setIsRecoveryMode(true);
      sessionStorage.removeItem('password-recovery');
    }
  }, []);

  const handlePasswordUpdate = async () => {
    if (!newPassword) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, digite sua nova senha.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, confirme sua nova senha corretamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Falha ao atualizar senha.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Senha atualizada!",
          description: "Sua senha foi atualizada com sucesso. Você já está logado.",
        });
        
        // Redirect to main page after successful password update
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecoveryMode) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md">
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Definir Nova Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-800 text-sm">
                ✅ Link de recuperação validado. Defina sua nova senha abaixo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordUpdate()}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded">
              <p>• Use pelo menos 6 caracteres</p>
              <p>• Combine letras e números</p>
              <p>• Evite senhas muito simples</p>
            </div>

            <Button 
              onClick={handlePasswordUpdate}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Atualizando..." : "Atualizar Senha"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Após atualizar, você será direcionado ao sistema automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};