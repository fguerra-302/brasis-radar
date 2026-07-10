## Varredura Ativa End-to-End + Correções

Objetivo: rodar cada fluxo do app com Playwright headless contra o preview local, capturar screenshots + logs + rede, listar TUDO que está quebrado (sem inventar), e corrigir na sequência.

### Fase 1 — Diagnóstico (Playwright, sem edição de código)

Autentico com a sessão Supabase injetada e percorro:

1. **Root `/` — Radar principal**
   - Botão "Coletar dados" → verificar toast, novos itens, `radar-automation` logs
   - Filtros: status, grupo (o bug de `group_id` recente), busca
   - Card: Aprovar, Ignorar (com motivo), Ver original, Alterar status manual
   - Bulk: "Limpar Coletados", "Excluir Filtrados"
   - `RadarLiveStats`, `RadarAutomationStatus`, `RadarRecentActions` renderizam com dados reais?

2. **`/curadoria` — Review / Approval / Newsletter / Editor / Persona / Library**
   - Review: itens "A curar" aparecem, aprovar move pra "Em aprovação"
   - Approval: "Enviar à Edição" e "Enviar Newsletter" mudam status certo
   - NewsletterExport: geração/finalização
   - BrasisEditor: importar item muda status pra "Em edição" (fix recente)
   - Persona: teste de voz via `persona-sample`
   - Library: lista conteúdos brasis

3. **`/auditoria`** — paginação, filtros (ação, item ID, datas), badges

4. **`/config` — Sources / Web Scraping / Projetos / Newsletters / Keywords / Weights / Groups / Automation / Branding / APIs / External API / AI**
   - CRUD em cada aba, teste do WebScrapingManager (fix recente)
   - Salvar persistência

5. **`/setup`** e onboarding tour

Para cada fluxo: screenshot antes/depois, console errors, network 4xx/5xx, edge function logs.

### Fase 2 — Relatório crítico

Entrego lista objetiva:
- **Broken** (não funciona): fluxo, evidência (screenshot/log), causa provável, arquivo suspeito
- **Dead-end** (leva a lugar nenhum): rota/botão órfão
- **UX gap** (funciona mas confunde): descrição
- **OK**: o que passou

Sem enfeite. Se nada quebrou num fluxo, digo isso.

### Fase 3 — Correções

Só depois do relatório, aplico fixes priorizados por impacto:
- P0: quebra fluxo principal (coleta, aprovação, newsletter)
- P1: quebra fluxo secundário (config, auditoria)
- P2: dead-ends / UX

Cada fix: edit mínimo no arquivo apontado, re-teste no Playwright, valida antes de marcar como resolvido.

### Escopo explícito
- **NÃO** mexo em segurança agora (você pediu)
- **NÃO** refatoro código que está funcionando
- **NÃO** invento features novas
- Se um fluxo depende de dados que não existem no banco de teste, sinalizo em vez de "consertar"

### Entregáveis
1. Relatório em `/mnt/documents/BRASIS_E2E_AUDIT.md` com evidências
2. Commits de correção arquivo a arquivo
3. Resumo final: quantos bugs reais, quantos corrigidos, quantos ficam como backlog justificado
