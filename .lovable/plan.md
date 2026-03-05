

## Auditoria End-to-End: Problemas Encontrados

### 1. CRITICO: `source_group_assignments.source_id` aponta para `radar_sources`, nao `shared_sources`

A foreign key `source_group_assignments_source_id_fkey` referencia `radar_sources.id`. Como a coleta agora usa `shared_sources`, os IDs sao incompativeis. Resultado: **GroupsConfig mostra fontes de `radar_sources` (legadas) para associar a grupos, mas a coleta usa `shared_sources`**. A associacao fonte-grupo esta completamente desconectada do pipeline real.

### 2. CRITICO: `GroupsConfig` usa `useRadarSources` (tabela legada)

O componente lista fontes de `radar_sources` para o usuario associar a grupos. Deveria listar fontes de `shared_sources`.

### 3. CRITICO: `SourcesStatus` usa `useRadarSources` (tabela legada)

A pagina de status mostra fontes da tabela legada `radar_sources`, nao do catalogo unificado `shared_sources` que o `radar-automation` realmente usa.

### 4. MEDIO: `useInitializeDefaultSources` insere em `radar_sources`

O hook de onboarding cria fontes na tabela legada. Com a coleta unificada via `shared_sources`, essa inicializacao e inutil — as fontes ja existem no catalogo compartilhado.

### 5. MEDIO: `radar-automation` nunca define `group_id` no conteudo coletado

O conteudo coletado entra sem `group_id`, entao o filtro por grupo no Radar nunca funciona automaticamente. A atribuicao a grupos depende de acao manual do usuario apos coleta.

### 6. BAIXO: `useExternalApi` busca fontes de `radar_sources`

Hook de sincronizacao de APIs externas referencia tabela legada.

### 7. BAIXO: Projetos (pastas) sao apenas organizacionais

As pastas de projeto (`project_folders` + `project_source_links`) servem apenas para o usuario organizar fontes visualmente. **Nao influenciam a coleta nem o filtro de conteudo**. Isso esta ok como feature de organizacao, mas o usuario pode esperar que "adicionar fonte a um projeto" filtre o conteudo coletado — e isso nao acontece.

---

## Plano: Migrar tudo para `shared_sources` e limpar legados

### Passo 1: Migrar FK de `source_group_assignments`
- SQL migration: alterar foreign key de `source_id` para referenciar `shared_sources.id` em vez de `radar_sources.id`

### Passo 2: Migrar `GroupsConfig` para usar `shared_sources`
- Trocar `useRadarSources` por `useSharedSources` no componente
- As fontes listadas para associar a grupos serao do catalogo unificado

### Passo 3: Migrar `SourcesStatus` para usar `shared_sources`
- Trocar `useRadarSources` por `useSharedSources`
- Remover logica de `last_sync` (nao existe em `shared_sources`) — mostrar contagem e status ativo/inativo
- Manter botao "Coletar Dados Agora"

### Passo 4: Migrar `useExternalApi` para usar `shared_sources`
- Trocar `useRadarSources` por `useSharedSources`

### Passo 5: Remover `useInitializeDefaultSources`
- Apagar o hook e remover a chamada de `RadarMain.tsx`
- As fontes ja existem em `shared_sources`, nao precisa inicializar por usuario

### Passo 6: Remover `useRadarSources.ts`
- Apos migrar todos os consumidores, deletar o hook orfao

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| SQL migration | Alterar FK `source_group_assignments.source_id` → `shared_sources.id` |
| `src/components/config/GroupsConfig.tsx` | `useRadarSources` → `useSharedSources` |
| `src/components/sources/SourcesStatus.tsx` | `useRadarSources` → `useSharedSources`, remover `last_sync` |
| `src/hooks/useExternalApi.ts` | `useRadarSources` → `useSharedSources` |
| `src/components/radar/RadarMain.tsx` | Remover `useInitializeDefaultSources` |
| `src/hooks/useInitializeDefaultSources.ts` | Deletar |
| `src/hooks/useRadarSources.ts` | Deletar |

