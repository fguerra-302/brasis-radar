

# Banco Unificado de Fontes + Pastas por Projeto

## Conceito

Hoje cada usuário tem suas próprias fontes (`radar_sources.user_id`). A proposta é criar um **catálogo compartilhado** de fontes visível a todos, e cada usuário monta **pastas de projeto** selecionando fontes desse catálogo.

## Arquitetura de Dados

```text
┌─────────────────────────┐
│   shared_sources        │  ← Catálogo global (sem user_id)
│   id, name, url, type   │
│   active, config, ...   │
└──────────┬──────────────┘
           │ 1:N
┌──────────┴──────────────┐
│  project_folders        │  ← Pasta/projeto do usuário
│  id, user_id, name,     │
│  description             │
└──────────┬──────────────┘
           │ N:M
┌──────────┴──────────────┐
│  project_source_links   │  ← Junction table
│  id, folder_id,         │
│  source_id, user_id     │
└─────────────────────────┘
```

## Mudanças no Banco (Migrações)

### 1. Tabela `shared_sources`
Nova tabela sem `user_id` no RLS de leitura -- todos autenticados podem ver. Apenas admins (ou qualquer autenticado, a definir) podem inserir/editar.

- Colunas: `id`, `name`, `url`, `type`, `active`, `config`, `created_at`, `updated_at`
- RLS SELECT: qualquer `authenticated` pode ler
- RLS INSERT/UPDATE/DELETE: qualquer `authenticated` pode gerenciar (time pequeno e confiável)

### 2. Tabela `project_folders`
Pastas criadas por cada usuário para organizar fontes por projeto.

- Colunas: `id`, `user_id`, `name`, `description`, `created_at`, `updated_at`
- RLS: CRUD restrito a `user_id = auth.uid()`

### 3. Tabela `project_source_links`
Junction table ligando fontes compartilhadas a pastas.

- Colunas: `id`, `folder_id`, `source_id`, `user_id`, `created_at`
- RLS: CRUD restrito a `user_id = auth.uid()`

### 4. Migração de dados
- Copiar fontes existentes de `radar_sources` para `shared_sources` (deduplicando por URL+type)
- Manter `radar_sources` funcionando para não quebrar edge functions existentes

## Mudanças no Código

### Hooks novos
- `useSharedSources()` -- lê catálogo compartilhado
- `useProjectFolders()` -- CRUD de pastas do usuário
- `useProjectSourceLinks()` -- adicionar/remover fontes de uma pasta

### UI -- Configuração de Fontes (SourceManager)
- Nova aba **"Catálogo"** mostrando todas as fontes compartilhadas com busca/filtro
- Nova aba **"Meus Projetos"** com lista de pastas do usuário
- Dentro de cada pasta: lista de fontes selecionadas + botão "Adicionar do catálogo"
- Qualquer usuário pode adicionar novas fontes ao catálogo compartilhado

### Edge Functions
- `radar-automation` precisará ser atualizado para buscar fontes de `shared_sources` filtradas pelas pastas/projetos ativos do usuário, em vez de ler diretamente `radar_sources`

## Escopo e Riscos

- **Compatibilidade**: Manter `radar_sources` em paralelo até migrar completamente as edge functions
- **Deduplicação**: Ao migrar, fontes com mesma URL+type de diferentes usuários viram uma entrada só
- **Credenciais**: Fontes que precisam de credenciais (Instagram, Spotify) terão credenciais no nível do catálogo compartilhado, já que é um time interno confiável

## Sequência de Implementação

1. Criar as 3 tabelas com RLS via migração
2. Migrar dados existentes de `radar_sources` para `shared_sources`
3. Criar hooks (`useSharedSources`, `useProjectFolders`, `useProjectSourceLinks`)
4. Atualizar UI do SourceManager com abas de catálogo e pastas
5. Atualizar edge functions para consultar a nova estrutura

