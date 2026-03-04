

# Auditoria Completa do Radar Brasis

## Visao Geral - O que encontrei

Analisei cada arquivo do projeto, cruzando com o que sei sobre a Brasis (identidade visual, fluxo editorial, pipeline de curadoria). Abaixo organizo em 3 blocos: o que funciona, o que tem redundancia/lixo, e o que precisa de ajuste.

---

## 1. CODIGO MORTO E REDUNDANCIAS (para remover)

### 1.1 CuradoriaConfig.tsx - LIXO COMPLETO
- Componente com campos de NewsAPI Key e OpenAI Key hardcoded em estado local
- Lista de fontes fixa (G1, Folha, etc.) que nao conecta com nada
- Intervalo de curadoria que nao salva em lugar nenhum
- **Nao e usado por nenhuma rota** -- esta importado em lugar nenhum
- **Acao:** Deletar `src/components/CuradoriaConfig.tsx`

### 1.2 GPTClient.tsx - MORTO
- Classe que tenta chamar `/api/ai-enhance` (rota que nao existe)
- Usa `process.env.OPENAI_API_KEY` que nao funciona no browser
- Nunca e importado por nenhum componente
- **Acao:** Deletar `src/lib/gptClient.ts`

### 1.3 ContentStatus enum duplicado e confuso
- O enum tem 11 valores, 4 sao "legacy" mas ainda usados no codigo real
- `COLLECTED` e `IMPORTED` apontam para o mesmo valor `"Coletado"`
- O radar insere com `"Em aprovacao"` mas o enum define `SELECTED = "Selecionado"` e `NEWS_READY = "News Pronta"` que nao sao usados em nenhum lugar
- **Problema real:** CuradoriaApproval filtra `status = 'Em aprovacao'`, CuradoriaEditor filtra `status = 'Em edicao'`, Newsletter filtra `status = 'Para Newsletter'` -- os status "novos" (COLLECTED, SELECTED, NEWS_READY) nunca sao gravados
- **Acao:** Limpar o enum, manter apenas os status realmente usados

### 1.4 Migrations excessivas
- 56 migrations, muitas conflitantes (criando e recriando as mesmas policies)
- 4 migrations nos ultimos dias tentando corrigir o mesmo problema de RLS RESTRICTIVE
- **Acao:** Nao impacta funcionalidade, mas vale consolidar no futuro

---

## 2. PROBLEMA CRITICO: RLS AINDA RESTRICTIVE

Toda a conversa anterior tentou corrigir isso com 4 migrations, mas **as policies no banco ainda estao RESTRICTIVE** segundo o schema reportado. Isso significa:
- **brasis_content** (Editor Brasis): nao salva, nao carrega
- **Todas as outras tabelas**: mesmo problema potencial

**Acao:** Uma migration definitiva que:
1. `DROP POLICY IF EXISTS` de cada policy existente
2. Recria como `PERMISSIVE` (sem a keyword RESTRICTIVE)

---

## 3. FLUXO DE STATUS - RECOMENDACAO

Baseado no que sei do fluxo operacional Brasis (mapeamento por IA -> selecao humana -> texto newsletter por IA -> aprovacao final):

**Fluxo recomendado (5 status):**

```text
Coletado --> Em aprovacao --> Para Newsletter --> Publicado
                |                  |
                +--> Ignorado      +--> Em edicao (redes sociais)
```

**Remover:** `Selecionado`, `News Pronta`, `Para Redes Sociais`, `Para Newsletter e Redes`, `Na Newsletter` -- nenhum deles e usado no codigo real.

**Manter:**
- `Coletado` (radar-automation insere)
- `Em aprovacao` (RadarMain envia para revisao)
- `Para Newsletter` (CuradoriaApproval envia)
- `Em edicao` (CuradoriaApproval envia para redes sociais)
- `Ignorado` (rejeicao)
- `Publicado` (finalizacao)

---

## 4. PERSONA NAO PERSISTE

- CuradoriaPersona.tsx salva tudo em `useState` -- perde ao recarregar
- "Personas Salvas" mostra 2 cards hardcoded que nao vem do banco
- A funcao "Gerar Amostra" so concatena strings, nao usa IA

**Acao:**
- Criar tabela `personas` no Supabase (user_id, name, tone, style, target_audience, key_values, communication_style, examples)
- Conectar Lovable AI para gerar amostras de teste reais
- Remover cards hardcoded

---

## 5. EDITOR BRASIS - CONEXAO COM RADAR

Voce confirmou que o Editor Brasis deve funcionar tanto para conteudo original quanto para transformar itens do radar. Hoje ele so faz conteudo original (formulario vazio).

**Acao:**
- Adicionar botao "Importar do Radar" que busca itens com status `Para Newsletter` ou `Em aprovacao`
- Pre-preenche o titulo e bloco de Observacao com o titulo/resumo do item do radar
- O usuario transforma no formato dos 4 blocos

---

## 6. INCONSISTENCIAS VISUAIS

- CuradoriaApproval, CuradoriaEditor e NewsletterExport usam `text-slate-800`, `bg-slate-50`, `bg-blue-50` -- cores do Tailwind padrao, nao da identidade Brasis (bege, azul escuro, laranja)
- O Editor Brasis usa corretamente `brasis-terracotta` e `brasis-sage`
- O header da CuradoriaLayout usa `font-display` e cores Brasis corretamente

**Acao:** Padronizar os 3 componentes legados (Approval, Editor, Newsletter) para usar as cores do design system Brasis

---

## 7. TOASTER DUPLICADO

- RadarMain renderiza `<Toaster />` dentro do componente
- App.tsx ja renderiza `<Toaster />` e `<Sonner />`
- O projeto mistura dois sistemas de toast: `useToast` (radix) e `toast` do Sonner
- **Resultado:** Possivel toast duplicado ou inconsistente

**Acao:** Escolher um sistema (Sonner e mais moderno e ja usado no Editor Brasis) e migrar os componentes antigos

---

## 8. CONSOLE.LOG EXCESSIVO

- 20+ `console.log` com emojis espalhados pelo codigo de producao
- RadarMain, useRadarBrasis, App.tsx, etc.
- **Acao:** Remover todos exceto logs de erro reais

---

## PLANO DE EXECUCAO (por prioridade)

| # | Acao | Impacto |
|---|------|---------|
| 1 | Fix RLS definitivo (migration unica para TODAS as tabelas) | CRITICO - nada funciona sem isso |
| 2 | Deletar CuradoriaConfig.tsx e gptClient.ts | Limpeza |
| 3 | Limpar ContentStatus enum (remover 5 status mortos) | Clareza |
| 4 | Criar tabela `personas` e conectar CuradoriaPersona ao Supabase | Funcionalidade |
| 5 | Adicionar "Importar do Radar" no Editor Brasis | Funcionalidade |
| 6 | Padronizar cores Brasis nos componentes de curadoria | Visual |
| 7 | Unificar sistema de toast (Sonner) e remover Toaster duplicado | Limpeza |
| 8 | Remover console.logs de producao | Limpeza |

Posso executar todos esses itens ou voce quer priorizar alguns primeiro?

