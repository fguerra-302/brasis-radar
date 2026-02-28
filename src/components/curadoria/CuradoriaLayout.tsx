import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CuradoriaSidebar } from './CuradoriaSidebar';
import { BackButton } from '@/components/ui/BackButton';
import { UserMenu } from '@/components/UserMenu';
import { useBranding } from '@/hooks/useBranding';

interface CuradoriaLayoutProps {
  children: React.ReactNode;
}

export const CuradoriaLayout = ({ children }: CuradoriaLayoutProps) => {
  const { brandingConfig } = useBranding();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CuradoriaSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-brasis-beige/40 bg-background px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-primary hover:text-brasis-orange transition-colors" />
              <h1 className="text-lg font-display text-secondary tracking-tight">
                {brandingConfig.companyName} - Edição & Distribuição
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <BackButton to="/" label="Voltar ao Radar" />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};