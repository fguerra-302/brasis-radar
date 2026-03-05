

## Análise de dependências

| Hook / Componente | Ainda em uso? | Onde? |
|---|---|---|
| `useSourceCredentials.ts` | Não | Só referenciado por `SourceCredentialsBadge.tsx`, que não é importado em lugar nenhum |
| `SourceCredentialsBadge.tsx` | Não | Nenhuma importação encontrada |
| `useRadarSources.ts` | **Sim** | `SourcesStatus.tsx` (rota `/config/status`), `GroupsConfig.tsx`, `useExternalApi.ts`, `BulkSourceUpload.tsx` |
| `BulkSourceUpload.tsx` | Não | Nenhuma importação encontrada |

## Plano

### Pode remover com segurança (sem referências):
1. `src/hooks/useSourceCredentials.ts`
2. `src/components/sources/SourceCredentialsBadge.tsx`
3. `src/components/sources/BulkSourceUpload.tsx` (também órfão)

### NÃO pode remover ainda:
- `src/hooks/useRadarSources.ts` — ainda é importado por 3 componentes ativos (`SourcesStatus`, `GroupsConfig`, `useExternalApi`). Removê-lo quebraria o build. Seria necessário primeiro migrar esses componentes para usar `shared_sources` antes de deletar o hook.

