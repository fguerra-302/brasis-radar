# Auditoria End-to-End — Radar Brasis

Análise crítica sem enfeites. Foco: entrega vs. plano original, integridade dos fluxos, loop holes e dead ends. Sem alterações de código nesta etapa — é diagnóstico.

---

## 1. Plano original vs. entrega atual

**O plano original (msg #1 da thread, jun/2025):** revista digital / newsletter cultural alimentada por IA — coleta multi-fonte (RSS, APIs), classificação por relevância, curadoria com aprovação humana, geração de texto final estilo "Eat Your Nut".

**Estado atual:** o núcleo foi entregue. Coleta RSS + Firecrawl (web-scraper) + API externa opcional, scoring por keywords, fluxo `A curar → Em aprovação → Para Newsletter → Em edição`, gerador de newsletter com refino por IA, Editor Brasis (formato 4-blocos), personas com teste IA, catálogo compartilhado (`shared_sources`), grupos (Radar Brasis / Clube da Glória / Views), automação por cron. Não é vaporware — funciona.

**O que ficou pelo caminho:** integração Make (só discutida), sistema de creators (só discutido), publicação direta em canais (só copia/cola manual), analytics de performance da newsletter, agendamento de envio.

---

## 2. Loop holes e dead ends encontrados

### 2.1 Críticos (bloqueiam ou confundem operação)

1. `**group_id` nunca é atribuído na coleta.** `supabase/functions/radar-automation/index.ts` não referencia `group_id` em lugar nenhum. O filtro por grupo no `ContentList` existe (Radar Brasis / Clube da Glória / Views), mas todos os itens novos chegam com `group_id = null`. Resultado: o filtro "por grupo" mostra vazio em qualquer grupo selecionado. Dead end funcional.
2. **Rota `/config/status` referenciada mas provavelmente incompleta.** `ConfigSidebar` lista "Status das Fontes" apontando para `/config/status`. Precisa validar que existe rota correspondente em `Config.tsx` (não confirmado nesta auditoria).
3. `**CuradoriaApproval` usa strings soltas ("Em aprovação", "Para Newsletter", "Em edição")** em vez do enum `ContentStatus`. Se alguém renomear um status no enum, os cards da tela de aprovação silenciosamente param de aparecer.
4. `**BrasisEditor` importa do Radar mas grava em tabela paralela (`brasis_content`)** sem retro-vincular ao item original. Depois de importar, o item continua "Em aprovação" no Radar como se nada tivesse acontecido — usuário pode importar o mesmo item várias vezes sem perceber.
5. **Toast em `CuradoriaApproval.handleSendToEditor` diz "Enviado para Redes Sociais"** mas o status gravado é `Em edição`. Mensagem mente sobre o que aconteceu.

### 2.2 Sérios (UX degradada, mas funciona)

6. **Realtime só invalida query para o usuário atual quando é outro usuário editando.** A lógica em `RadarMain` é `if (payload.new.user_id !== user?.id) debouncedRefetch()`. O React Query já tem cache local, mas cria dissonância se o próprio usuário atualiza em outra aba.
7. **Filtro "selecionados" agrupa `Para Newsletter + Em edição + Publicado**` — combinação arbitrária, sem label explicando o que é "selecionado". Usuário fica confuso.
8. **Cor de "Relevância 3" em `CuradoriaApproval` é `bg-accent text-accent-foreground**` — em algumas variantes do tema fica quase invisível. Testar contraste.
9. `**useRadarBrasis` faz o filtro por `user_id` no cliente** (`.eq('user_id', session.user.id)`) mesmo com RLS ativo. Redundante e vaza intenção — se RLS falhar, esse `eq` é a única defesa.
10. `**handleRecalcularRelevancia` é literalmente `handleExecutarCuradoria**` — dois botões, mesma ação. Falsa promessa de funcionalidade separada.
11. `**NewsletterExport` gera texto em Markdown com emojis fixos (🎯📍🔗)** — impossível personalizar sem editar código. Newsletter final é sempre no mesmo formato.

### 2.3 Menores (aceitáveis para 5 usuários internos)

12. Sem paginação nas telas de Curadoria/Aprovação/Newsletter — vai empilhar tudo em uma lista se passar de ~50 itens.
13. `BrasisEditor` limita import do radar a 50 itens sem indicar isso ao usuário.
14. `updated_at` é setado manualmente em vários lugares, mas existe trigger `audit_updated_at` no banco — trabalho duplicado.
15. Sem indicador de "última coleta com sucesso" fora do `RadarAutomationStatus` (que existe, mas depende de ler os logs).
16. `refetchOnWindowFocus: true` combinado com realtime pode gerar refetch dobrado.

### 2.4 Dívidas conhecidas (já documentadas em memória)

- Tabela `radar_sources` legada ainda existe no banco (só código-morto).
- Erros de Realtime aceitos (memória "Tech Debt").
- Auth manual configs no dashboard Supabase (OTP expiry, leaked password protection) — ainda pendentes.

---

## 3. Detalhes visuais (auditoria rápida)

- **Identidade visual coerente:** bege (#efe8d5), azul (#1e5fc2), laranja (#ed7703), Favela + Montserrat — aplicada globalmente. ✔
- **Sidebar de Curadoria usa `text-secondary**` no título — validar que resolve para azul, não para cinza padrão do shadcn.
- **Cards de aprovação usam `border-l-brasis-terracotta**` — cor não está no core memory (só terra/sage aparecem em código). Consistência de paleta imperfeita.
- **Estados vazios têm CTA correto** ("Ir ao Radar", "Ir à Aprovação") — bom.
- **Onboarding tour de 6 passos existe** e só aparece uma vez (`localStorage`). ✔
- **Responsividade:** grids são `md:grid-cols-2` / `lg:grid-cols-2`. Não testado em mobile real nesta auditoria.

---

## 4. Comparativo com plataformas de curadoria (pesquisa web)


| Ferramenta          | Pontos fortes                                                                          | O que Radar Brasis tem/não tem                                                            |
| ------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Feedly (Leo AI)** | RSS + AI prioritization + team boards + integrações (Slack, Teams)                     | Radar tem RSS+AI scoring; **falta** integrações nativas e boards colaborativos            |
| **Rasa.io**         | Newsletter automatizada personalizada por leitor, envio programado, analytics abertura | Radar **não envia** — só gera texto; **falta** envio, personalização por leitor, métricas |
| **Curata**          | Workflow de curadoria com múltiplos aprovadores, publicação multi-canal                | Radar tem workflow linear com 1 aprovador; **falta** multi-aprovação e publicação         |
| **UpContent**       | Descoberta + branded hub, integração Hubspot/Mailchimp                                 | Radar tem descoberta + editor; **falta** hub público e integrações CRM                    |
| **Scoop.it**        | Topics coletivos, SEO auto-otimizado                                                   | Radar tem grupos; **falta** SEO e distribuição pública                                    |
| **Kurator/NBot**    | Discovery baseado em LLM + resumo automático                                           | Radar tem isso (OpenAI/Gemini) ✔                                                          |


**Diferencial do Radar:** formato editorial Brasis (4 blocos: Observação → Reflexão → Exemplo → Dica), personas com teste IA, catálogo de fontes compartilhado no time. Isso não existe pronto em nenhum concorrente.

**Onde perde feio:** distribuição (só copia/cola), analytics (zero), agendamento (nenhum), colaboração multi-aprovador (não existe).

---

## 5. Pontuação (0-10, honesta)


| Dimensão                       | Nota | Justificativa                                                                    |
| ------------------------------ | ---- | -------------------------------------------------------------------------------- |
| Coleta de dados                | 8.0  | RSS + scraping + API funcionam; falta health-check contínuo visível              |
| Curadoria (fluxo humano)       | 6.5  | Fluxo existe, mas dead ends nos 5 itens críticos acima                           |
| IA / classificação             | 7.5  | Scoring por keyword + refino por IA funcionam; sem feedback loop de qualidade    |
| Editor Brasis                  | 7.0  | Bem estruturado, mas desconectado do Radar depois do import                      |
| Distribuição                   | 3.0  | Só copia/cola. Sem envio, sem agendamento, sem tracking                          |
| Configuração/admin             | 8.0  | Sidebar completo, catálogo compartilhado, personas persistidas                   |
| Design/UX                      | 7.5  | Identidade forte e coerente; algumas dissonâncias de cor e labels                |
| Segurança                      | 8.0  | RLS permissivo por escolha, findings críticos corrigidos, admin role para writes |
| Robustez técnica               | 7.0  | Build limpo, tipagem forte; strings soltas de status é o maior risco             |
| Alinhamento com plano original | 7.5  | Núcleo entregue; extensões (Make, creators, envio) não                           |


### **Nota geral: 7.0 / 10**

---

## 6. Veredicto GO LIVE

**Para 5 funcionários internos, uso operacional de curadoria: SIM, com ressalvas.**

**Está pronto porque:**

- O fluxo principal (coletar → aprovar → gerar texto) funciona ponta-a-ponta.
- Segurança está adequada para time interno (RLS + admin role).
- Estados vazios guiam usuário novo.
- Onboarding tour existe.

**NÃO está pronto para:**

- Uso externo / clientes finais (falta distribuição, analytics, colaboração).
- Grupos (Radar Brasis / Clube da Glória / Views) — hoje é filtro decorativo, não segmenta nada.

**Recomendação de bloqueadores mínimos antes do go-live:**

1. Corrigir atribuição de `group_id` na `radar-automation` (crítico #1).
2. Corrigir toast enganoso do "Redes Sociais" (crítico #5) — trivial.
3. Trocar strings soltas por `ContentStatus` enum em `CuradoriaApproval` (crítico #3).
4. Decidir: `BrasisEditor` marca item importado ou não? (crítico #4).
5. Remover botão "Recalcular Relevância" duplicado (sério #10).

Se aceitar rodar com os 5 pontos acima resolvidos e o resto como backlog, **libere o go-live**. Sem esses 5, você vai ter reclamação de usuário na primeira semana.