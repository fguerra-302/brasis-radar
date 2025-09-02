import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Key, Loader2 } from 'lucide-react';
import { useSourceCredentials } from '@/hooks/useSourceCredentials';

interface SourceCredentialsBadgeProps {
  sourceId: string;
  sourceType: string;
}

const SourceCredentialsBadge: React.FC<SourceCredentialsBadgeProps> = ({ sourceId, sourceType }) => {
  const { data: hasCredentials, isLoading } = useSourceCredentials(sourceId);

  const needsCredentials = ['INSTAGRAM', 'SPOTIFY'].includes(sourceType);

  if (!needsCredentials) {
    return null;
  }

  if (isLoading) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Verificando...
      </Badge>
    );
  }

  return (
    <Badge 
      variant={hasCredentials ? "default" : "destructive"} 
      className="text-xs"
    >
      <Key className="h-3 w-3 mr-1" />
      {hasCredentials ? "Credenciais OK" : "Credenciais necessárias"}
    </Badge>
  );
};

export default SourceCredentialsBadge;