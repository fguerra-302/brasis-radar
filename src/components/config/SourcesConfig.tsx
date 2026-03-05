import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsletterSearchManager } from '@/components/sources/NewsletterSearchManager';
import SharedSourcesCatalog from '@/components/sources/SharedSourcesCatalog';
import ProjectFoldersManager from '@/components/sources/ProjectFoldersManager';

export const SourcesConfig = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="projects">Meus Projetos</TabsTrigger>
          <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <SharedSourcesCatalog />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectFoldersManager />
        </TabsContent>

        <TabsContent value="newsletters">
          <NewsletterSearchManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};