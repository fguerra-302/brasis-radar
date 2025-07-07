
import { useContentFetcher, useUpdateContentStatus } from '@/hooks/useContentFetcher';
import { ContentStatus } from '@/types/content';
import RadarMain from './radar/RadarMain';

const RadarBrasis = () => {
  console.log('RadarBrasis component rendering - Nova arquitetura');
  
  // Usar os novos hooks da arquitetura
  const { data: contents, isLoading, error } = useContentFetcher();
  const updateStatusMutation = useUpdateContentStatus();
  
  console.log('Conteúdos carregados:', contents?.length || 0);
  
  return <RadarMain />;
};

export default RadarBrasis;
