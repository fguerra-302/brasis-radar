import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Palette, Type, Image, Upload, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBranding } from '@/hooks/useBranding';
import { useToast } from '@/hooks/use-toast';

export const BrandingConfig = () => {
  const { brandingConfig, updateBrandingConfig, resetBrandingConfig } = useBranding();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        updateBrandingConfig({ logoUrl });
        toast({
          title: "Logo atualizado",
          description: "Seu logo foi carregado com sucesso.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const faviconUrl = e.target?.result as string;
        updateBrandingConfig({ faviconUrl });
        toast({
          title: "Favicon atualizado",
          description: "Seu favicon foi carregado com sucesso.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    resetBrandingConfig();
    toast({
      title: "Configurações resetadas",
      description: "As configurações de marca foram restauradas para o padrão.",
    });
  };

  const handleColorChange = (colorKey: keyof typeof brandingConfig.colors, value: string) => {
    updateBrandingConfig({
      colors: {
        ...brandingConfig.colors,
        [colorKey]: value,
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Personalização de Marca</h1>
        <p className="text-muted-foreground">
          Configure a identidade visual e textos da sua aplicação
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          As alterações são aplicadas imediatamente e salvas no navegador. 
          Para aplicar em produção, configure essas informações no seu ambiente.
        </AlertDescription>
      </Alert>

      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>
            Configure nome, tagline e descrição da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={brandingConfig.companyName}
                onChange={(e) => updateBrandingConfig({ companyName: e.target.value })}
                placeholder="Sua Empresa"
              />
            </div>
            <div>
              <Label htmlFor="companyTagline">Tagline</Label>
              <Input
                id="companyTagline"
                value={brandingConfig.companyTagline}
                onChange={(e) => updateBrandingConfig({ companyTagline: e.target.value })}
                placeholder="Slogan da sua empresa"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="companyDescription">Descrição</Label>
            <Textarea
              id="companyDescription"
              value={brandingConfig.companyDescription}
              onChange={(e) => updateBrandingConfig({ companyDescription: e.target.value })}
              placeholder="Descrição da sua empresa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="metaTitle">Título SEO</Label>
              <Input
                id="metaTitle"
                value={brandingConfig.metaTitle}
                onChange={(e) => updateBrandingConfig({ metaTitle: e.target.value })}
                placeholder="Título para SEO"
              />
            </div>
            <div>
              <Label htmlFor="metaDescription">Descrição SEO</Label>
              <Input
                id="metaDescription"
                value={brandingConfig.metaDescription}
                onChange={(e) => updateBrandingConfig({ metaDescription: e.target.value })}
                placeholder="Descrição para SEO"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logos e Imagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logos e Imagens
          </CardTitle>
          <CardDescription>
            Carregue seu logo e favicon personalizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="mt-2 space-y-2">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="cursor-pointer"
                />
                {brandingConfig.logoUrl && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={brandingConfig.logoUrl} 
                      alt="Logo preview" 
                      className="h-12 w-12 object-contain border rounded"
                    />
                    <Badge variant="secondary">Logo carregado</Badge>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="favicon">Favicon</Label>
              <div className="mt-2 space-y-2">
                <Input
                  id="favicon"
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  className="cursor-pointer"
                />
                {brandingConfig.faviconUrl && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={brandingConfig.faviconUrl} 
                      alt="Favicon preview" 
                      className="h-6 w-6 object-contain border rounded"
                    />
                    <Badge variant="secondary">Favicon carregado</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Paleta de Cores
          </CardTitle>
          <CardDescription>
            Personalize as cores da sua aplicação (formato HSL)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primaryColor">Cor Primária</Label>
              <Input
                id="primaryColor"
                value={brandingConfig.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                placeholder="221 75% 45%"
              />
              <div 
                className="mt-2 h-8 w-full rounded border"
                style={{ backgroundColor: `hsl(${brandingConfig.colors.primary})` }}
              />
            </div>
            
            <div>
              <Label htmlFor="secondaryColor">Cor Secundária</Label>
              <Input
                id="secondaryColor"
                value={brandingConfig.colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                placeholder="22 90% 55%"
              />
              <div 
                className="mt-2 h-8 w-full rounded border"
                style={{ backgroundColor: `hsl(${brandingConfig.colors.secondary})` }}
              />
            </div>
            
            <div>
              <Label htmlFor="accentColor">Cor de Destaque</Label>
              <Input
                id="accentColor"
                value={brandingConfig.colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                placeholder="146 67% 32%"
              />
              <div 
                className="mt-2 h-8 w-full rounded border"
                style={{ backgroundColor: `hsl(${brandingConfig.colors.accent})` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Newsletter */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Newsletter</CardTitle>
          <CardDescription>
            Personalize textos da newsletter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="newsletterSignature">Assinatura</Label>
            <Input
              id="newsletterSignature"
              value={brandingConfig.newsletterSignature}
              onChange={(e) => updateBrandingConfig({ newsletterSignature: e.target.value })}
              placeholder="Equipe [Sua Empresa]"
            />
          </div>
          
          <div>
            <Label htmlFor="newsletterFooter">Rodapé</Label>
            <Textarea
              id="newsletterFooter"
              value={brandingConfig.newsletterFooter}
              onChange={(e) => updateBrandingConfig({ newsletterFooter: e.target.value })}
              placeholder="Texto do rodapé da newsletter..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
          <CardDescription>
            Resetar ou exportar configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Resetar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};