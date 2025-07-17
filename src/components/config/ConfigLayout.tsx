import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ConfigSidebar } from './ConfigSidebar';
import { BackButton } from '@/components/ui/BackButton';
import { useBranding } from '@/hooks/useBranding';

interface ConfigLayoutProps {
  children: React.ReactNode;
}

export const ConfigLayout = ({ children }: ConfigLayoutProps) => {
  const { brandingConfig } = useBranding();
  
  return (
    <SidebarProvider>
      <header className="h-12 flex items-center justify-between border-b bg-background px-4">
        <div className="flex items-center">
          <SidebarTrigger className="mr-4" />
          <h1 className="text-lg font-semibold">Configurações do {brandingConfig.companyName}</h1>
        </div>
        <BackButton to="/" label="Voltar ao Radar" />
      </header>

      <div className="flex min-h-screen w-full">
        <ConfigSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};