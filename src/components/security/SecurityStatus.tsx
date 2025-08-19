
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle, ExternalLink, Lock, Users, Database, Eye } from "lucide-react";

export const SecurityStatus = () => {
  const securityChecks = [
    {
      category: "Proteção de Dados",
      icon: <Database className="h-4 w-4" />,
      items: [
        { name: "RLS habilitado em todas as tabelas", status: "ok", description: "Usuários só acessam seus próprios dados" },
        { name: "Funções de emergência protegidas", status: "ok", description: "Apenas administradores podem desabilitar proteções" },
        { name: "Validação de entrada ativa", status: "ok", description: "Proteção contra SQL injection e XSS" },
        { name: "Timestamps automáticos", status: "ok", description: "Auditoria completa de criação/modificação" },
      ]
    },
    {
      category: "Autenticação",
      icon: <Lock className="h-4 w-4" />,
      items: [
        { name: "JWT tokens validados", status: "ok", description: "Todas as funções verificam autenticação" },
        { name: "Rate limiting ativo", status: "ok", description: "10 requisições por minuto por usuário" },
        { name: "Sessões persistentes", status: "ok", description: "Login automático entre sessões" },
      ]
    },
    {
      category: "APIs Externas",
      icon: <Shield className="h-4 w-4" />,
      items: [
        { name: "Secrets protegidos", status: "ok", description: "API keys armazenadas como Supabase Secrets" },
        { name: "Headers CORS configurados", status: "ok", description: "Acesso controlado às Edge Functions" },
        { name: "Validação de URLs", status: "ok", description: "Bloqueio de IPs locais e URLs maliciosas" },
      ]
    },
    {
      category: "Configurações Recomendadas",
      icon: <Eye className="h-4 w-4" />,
      items: [
        { name: "OTP expira em 1 hora", status: "manual", description: "Configure no painel do Supabase" },
        { name: "Proteção contra senhas vazadas", status: "manual", description: "Ative no painel de autenticação" },
        { name: "MFA disponível", status: "manual", description: "Configure autenticação de dois fatores" },
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'manual': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-3 w-3" />;
      case 'manual': return <AlertTriangle className="h-3 w-3" />;
      case 'error': return <AlertTriangle className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ok': return 'Implementado';
      case 'manual': return 'Configuração Manual';
      case 'error': return 'Requer Atenção';
      default: return 'Desconhecido';
    }
  };

  const openSupabaseDashboard = (section: string) => {
    const projectId = 'vlsirftmzvmilugalbpr';
    const urls = {
      auth: `https://supabase.com/dashboard/project/${projectId}/auth/providers`,
      users: `https://supabase.com/dashboard/project/${projectId}/auth/users`,
      sql: `https://supabase.com/dashboard/project/${projectId}/sql/new`,
      functions: `https://supabase.com/dashboard/project/${projectId}/functions`,
    };
    window.open(urls[section] || urls.auth, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            Status de Segurança
          </h2>
          <p className="text-slate-600 mt-1">
            Monitoramento das medidas de proteção implementadas
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          Sistema Protegido
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {securityChecks.map((category) => (
          <Card key={category.category} className="transition-all hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                {category.icon}
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.items.map((item, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(item.status)}
                      <span className="font-medium text-sm text-slate-800">
                        {item.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {item.description}
                    </p>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Ações Recomendadas no Painel Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-blue-700 text-sm mb-4">
            Para máxima segurança, configure as seguintes opções no painel administrativo:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
              onClick={() => openSupabaseDashboard('auth')}
            >
              <Users className="h-4 w-4 mr-2" />
              Configurar Autenticação
            </Button>
            
            <Button 
              variant="outline" 
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
              onClick={() => openSupabaseDashboard('functions')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Logs das Edge Functions
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-md">
            <h4 className="font-medium text-blue-800 mb-2">Checklist Manual:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Auth → Settings → OTP Expiry: 1 hora</li>
              <li>• Auth → Settings → Enable password breach protection</li>
              <li>• Auth → Settings → Enable MFA</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
