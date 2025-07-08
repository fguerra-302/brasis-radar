import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CuradoriaSidebar } from './CuradoriaSidebar';
import { BackButton } from '@/components/ui/BackButton';

interface CuradoriaLayoutProps {
  children: React.ReactNode;
}

export const CuradoriaLayout = ({ children }: CuradoriaLayoutProps) => {
  return (
    <SidebarProvider>
      <header className="h-12 flex items-center justify-between border-b bg-background px-4">
        <div className="flex items-center">
          <SidebarTrigger className="mr-4" />
          <h1 className="text-lg font-semibold">Brasis.IA - Edição & Distribuição</h1>
        </div>
        <BackButton to="/" label="Voltar ao Radar" />
      </header>

      <div className="flex min-h-screen w-full">
        <CuradoriaSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};