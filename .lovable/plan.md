

## Diagnóstico: Fontes Legadas são redundantes

Você tem razão. Com o catálogo unificado (`shared_sources` com 51 fontes), a aba "Fontes Legadas" (`radar_sources` por usuário) é **redundante e confusa**. Pior: o `radar-automation` ainda coleta de `radar_sources`, ignorando completamente o catálogo compartilhado.

## Plano

### 1. Modificar `radar-automation/index.ts` para usar `shared_sources`

- **Busca de fontes**: Trocar `radar_sources` por `shared_sources` (via `supabaseAdmin`, pois não tem `user_id`)
- **Busca de usuários no cron**: Em vez de buscar usuários de `radar_sources`, buscar de `user_settings` (todo usuário ativo terá um registro)
- **Remover `last_sync` update**: `shared_sources` não tem `last_sync` por usuário, então remover essa atualização (ou adicionar a coluna se necessário)

### 2. Remover aba "Fontes Legadas" da UI

- **`src/components/config/SourcesConfig.tsx`**: Remover a aba "Fontes Legadas" e o `SourceManager`, passando de 4 abas para 3 (Catálogo, Meus Projetos, Newsletters)

### 3. Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/radar-automation/index.ts` | Coletar de `shared_sources` em vez de `radar_sources`; buscar usuários de `user_settings` |
| `src/components/config/SourcesConfig.tsx` | Remover aba "Fontes Legadas" |

Nenhuma migração SQL necessária — `shared_sources` já existe com as fontes populadas.

