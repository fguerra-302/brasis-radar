

## Limpeza de Codigo Morto e Funcoes Legadas

### Situacao Atual

A auditoria revelou que varios arquivos e funcoes do banco ja estao **completamente orfaos** — nao sao importados nem referenciados por nenhum codigo ativo.

### O que sera removido

**Arquivos do projeto (todos orfaos, sem importacoes):**

| Arquivo | Por que remover |
|---------|----------------|
| `src/pages/Security.tsx` | Sem rota no App.tsx, nunca acessada |
| `src/components/config/SecurityConfig.tsx` | So era usado por Security.tsx |
| `src/components/security/SecurityStatus.tsx` | So era usado por SecurityConfig.tsx |
| `src/lib/securityValidation.ts` | Nao importado em nenhum lugar do app |

**WebScrapingManager** - voce disse para manter, mas ele ja esta orfao (nao é importado por nenhum componente). Ele tambem grava na tabela legada `radar_sources`. Opcoes:
- Se quer manter a funcionalidade, preciso reconecta-lo na aba de Fontes e migrar para `shared_sources`
- Se nao percebeu que ja estava desconectado, posso remover tambem

**Funcoes do banco PostgreSQL (migracao SQL):**

| Funcao | Motivo |
|--------|--------|
| `emergency_disable_all_rls()` | Referencia `radar_sources` legado |
| `emergency_disable_rls_brasis()` | Desliga RLS — risco desnecessario |
| `emergency_disable_rls_keywords()` | Mesma situacao |
| `emergency_disable_rls_sources()` | Referencia `radar_sources` legado |
| `source_has_credentials()` | Consulta `radar_sources` — morta |
| `update_source_credentials()` | Atualiza `radar_sources` — morta |

A funcao `log_security_event()` sera **mantida** pois é usada pelas edge functions para auditoria.

### Arquivos que NAO serao tocados

- `src/lib/inputValidation.ts` — usado ativamente por varios componentes
- `src/hooks/useExternalApi.ts` — voce quer manter, ja migrado para `useSharedSources`
- `src/services/externalApiService.ts` — usado pelo hook acima
- `src/components/config/ExternalApiConfig.tsx` — tela de config da API externa

### Execucao

1. **Deletar 4 arquivos** do projeto (Security + securityValidation)
2. **1 migracao SQL** para dropar as 6 funcoes legadas do banco
3. Nenhuma mudanca em rotas ou componentes ativos — tudo ja estava desconectado

