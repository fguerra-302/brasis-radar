
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SecurityStatus } from '../security/SecurityStatus';
import { BackButton } from '../ui/BackButton';

export const SecurityConfig = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configurações de Segurança</h1>
          <p className="text-slate-600">
            Monitore e configure as proteções do sistema
          </p>
        </div>
      </div>

      <SecurityStatus />
    </div>
  );
};
