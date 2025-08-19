
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Radar, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const getErrorMessage = (error: any) => {
    const errorMessage = error?.message || '';
    
    if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid_credentials')) {
      return 'Email ou senha incorretos. Verifique seus dados ou recupere sua senha.';
    }
    
    if (errorMessage.includes('User already registered') || errorMessage.includes('user_already_exists')) {
      return 'Este email já possui uma conta. Tente fazer login ou recuperar sua senha.';
    }
    
    if (errorMessage.includes('Email not confirmed')) {
      return 'Confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
    }
    
    if (errorMessage.includes('Too many requests')) {
      return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
    }
    
    if (errorMessage.includes('signup_disabled')) {
      return 'Cadastro temporariamente desabilitado. Entre em contato com o suporte.';
    }

    if (errorMessage.includes('requested path is invalid') || errorMessage.includes('redirect')) {
      return 'Erro de configuração. Configure as URLs no Supabase.';
    }

    // Mensagem genérica para outros erros
    return 'Erro na autenticação. Verifique seus dados e tente novamente.';
  };

  const handleAuth = async (mode: 'signin' | 'signup') => {
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive",
      });
      return;
    }

    // Validação básica de email
    if (!email.includes('@') || !email.includes('.')) {
      toast({
        title: "Email inválido",
        description: "Por favor, digite um email válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = mode === 'signin' 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        const friendlyMessage = getErrorMessage(error);
        
        toast({
          title: mode === 'signin' ? "Erro no Login" : "Erro no Cadastro",
          description: friendlyMessage,
          variant: "destructive",
        });

        // Se o erro for de configuração, mostrar link para setup
        if (error.message.includes('requested path is invalid') || error.message.includes('redirect')) {
          setTimeout(() => {
            toast({
              title: "Precisa configurar o Supabase?",
              description: "Use nosso assistente para configurar as URLs automaticamente.",
              action: <Button 
                size="sm" 
                onClick={() => window.location.href = '/setup'}
              >
                Configurar Agora
              </Button>
            });
          }, 1000);
        }

        // Se o erro for de usuário já existente no cadastro, sugerir login
        if (mode === 'signup' && (error.message.includes('User already registered') || error.message.includes('user_already_exists'))) {
          setTimeout(() => {
            toast({
              title: "Dica",
              description: "Clique em 'Login' para acessar sua conta existente.",
            });
          }, 2000);
        }
      } else if (mode === 'signup') {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
        });
      } else {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao sistema.",
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Erro",
        description: "Falha na conexão. Verifique sua internet e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, digite seu email para recuperar a senha.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      toast({
        title: "Email inválido",
        description: "Por favor, digite um email válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`
      });

      if (error) {
        const friendlyMessage = getErrorMessage(error);
        toast({
          title: "Erro",
          description: friendlyMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setShowForgotPassword(false);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar email de recuperação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Radar className="h-10 w-10 text-white" />
            <h1 className="text-3xl font-bold text-white font-brasis">RADAR BRASIS</h1>
          </div>
          <p className="text-white/90 text-lg font-medium">
            Sistema de curadoria de conteúdo para o DNA Brasis
          </p>
        </div>

        <Card className="brasis-card backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {showForgotPassword && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForgotPassword(false)}
                  className="p-0 h-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {showForgotPassword ? "Recuperar Senha" : "Acesso ao Sistema"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Digite seu email para receber o link de recuperação de senha.
                  </p>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Login</TabsTrigger>
                  <TabsTrigger value="signup">Cadastro</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth('signin')}
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

                  <Button 
                    onClick={() => handleAuth('signin')} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>

                  <div className="text-center">
                    <Button
                      variant="link"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Crie uma senha segura"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth('signup')}
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

                  <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded">
                    <p>• Use pelo menos 6 caracteres</p>
                    <p>• Combine letras e números</p>
                  </div>

                  <Button 
                    onClick={() => handleAuth('signup')} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Cadastrando..." : "Criar Conta"}
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-white/70">
            Sistema seguro com autenticação obrigatória
          </p>
          <Button 
            variant="link" 
            size="sm"
            onClick={() => window.location.href = '/setup'}
            className="text-white/60 hover:text-white underline"
          >
            Problemas para acessar? Use nosso assistente de configuração →
          </Button>
        </div>
      </div>
    </div>
  );
};
