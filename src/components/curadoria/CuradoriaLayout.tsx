import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CuradoriaSidebar } from './CuradoriaSidebar';

interface CuradoriaLayoutProps {
  children: React.ReactNode;
}

export const CuradoriaLayout = ({ children }: CuradoriaLayoutProps) => {
  return (
    <SidebarProvider>
      <header className="h-12 flex items-center border-b bg-background px-4">
        <SidebarTrigger className="mr-4" />
        <h1 className="text-lg font-semibold">Sistema de Curadoria Brasis</h1>
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