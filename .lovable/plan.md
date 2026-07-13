## Diagnóstico

O motivo do erro dela é **deploy publicado desatualizado**.

- URL que ela usa: `brasis-radar.lovable.app` → serve o bundle do commit `3d8a9c28…`.
- Todas as correções recentes (bug de ordem de hooks no `ContentList`, ações em massa, `LastAutomationRun`, fluxo de status, etc.) estão **só no preview**, não no publicado.
- O bug de hooks anterior no `ContentList` tinha um `if (isLoading) return …` no meio dos `useMemo` — em contas novas (sem dados) a transição de estado dispara "Rendered fewer hooks than expected", React desmonta a árvore e sobra só o `min-h-screen bg-background` → **tela beige em branco** (exatamente o print dela). No preview isso já foi corrigido; no publicado ainda não.
- Login dela em 17:04 foi bem-sucedido (confirmado nos logs), então não é auth. RLS e permissões estão OK — a conta consegue ler `radar_brasis` (retorna vazio) sem erro.

## O que fazer

### Passo 1 — Republicar (obrigatório, resolve o caso dela)

Você precisa clicar em **Publish** no topo do editor. Sem isso, o bundle que ela baixa continua quebrado. Não é algo que eu execute — é ação sua no botão de publicar.

### Passo 2 — Blindar contra crash em contas zeradas (preventivo)

Antes de republicar, quero garantir que nenhum outro componente quebre para um usuário com 0 itens:

1. **`useFluxoValidation`** — hoje faz `SELECT status FROM radar_brasis` sem filtrar por `user_id`. Com RLS retorna vazio (ok), mas o hook roda a cada 30s em background. Vou adicionar guarda: só rodar quando houver `user` autenticado, e tratar array vazio explicitamente.
2. **`RadarLiveStats`** — já lida com `stats` zerado corretamente, só confirmar.
3. **`ContentList`** — confirmar que os `useMemo` estão antes de qualquer `return` condicional (já corrigido no último turno, revisar).
4. **`OnboardingTour`** — abre automaticamente para quem não tem `brasis-tour-completed` no localStorage. Confirmar que renderiza sem depender de dados do radar.

### Passo 3 — Verificação

Rodar `tsgo` para checar tipos e um Playwright rápido no preview simulando um usuário sem dados (via limpeza de localStorage + navegação direta) só pra ter screenshot de "estado zero" funcionando antes de você publicar.

## Fora do escopo

- Não vou dar role de admin para ela agora (você não pediu). Ela consegue usar tudo, só não escreve em `shared_sources`.
- Não vou mexer em RLS/segurança.
