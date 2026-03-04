

# Review End-to-End: Brasis.IA -- Pronta para o time?

## Veredicto: NAO ESTA PRONTA

Existem 3 bloqueios criticos e 5 problemas de usabilidade que impediriam um usuario novo de usar o sistema com sucesso.

---

## BLOQUEIO 1: NADA SALVA NO BANCO (CRITICO)

**Todas as 13 tabelas** ainda tem politicas RLS marcadas como `Permissive: No` (RESTRICTIVE). Isso significa que quando ha mais de uma policy no mesmo comando (ex: SELECT), o Postgres exige que TODAS sejam verdadeiras ao mesmo tempo. Na pratica:

- Editor Brasis: nao salva conteudo
- Persona: nao salva personas
- Radar: nao carrega itens
- Keywords, Sources, Settings: inacessiveis

**As 4 migrations anteriores tentaram corrigir mas nao funcionaram.** A correcao definitiva precisa:
1. DROP de cada policy por nome exato (os nomes existentes no banco)
2. Recriar com `CREATE POLICY ... AS PERMISSIVE` (o Postgres 15+ exige a keyword explicitamente se voce quer garantir)

---

## BLOQUEIO 2: LOGIN REDIRECIONA PARA LUGAR ERRADO

- AuthPage no login bem-sucedido: `navigate('/curadoria')` (linha 110)
- AuthPage quando usuario ja logado: `navigate('/curadoria')` (linha 29)
- Mas a rota `/` (Index) mostra o Radar, que e a tela principal
- **Resultado para usuario novo:** faz login e cai direto na Curadoria (que esta vazia), sem nunca ver o Radar onde o conteudo e coletado. Confuso.

**Recomendacao:** Login deve ir para `/` (Radar) que e o hub central.

---

## BLOQUEIO 3: ONBOARDING NAO ENSINA O FLUXO COMPLETO

O tour tem 4 passos genericos (Bem-vindo, Itens, Fontes, IA). Faltam:
- Como executar a coleta (botao "Executar Curadoria")
- Como ir da coleta para aprovacao
- Como usar o Editor Brasis
- Como exportar newsletter

**Para um time novo, o tour precisa ser um guia do fluxo operacional**, nao uma lista de conceitos.

---

## PROBLEMAS DE USABILIDADE

### U1: Radar mostra "Modo Demonstracao" mesmo logado
Linha 141 de RadarMain: `if (!user)` mostra banner de demo. Mas como AuthGuard ja bloqueia usuarios nao-logados, esse banner nunca aparece. E codigo morto que confunde na leitura.

### U2: Nao ha como voltar do Curadoria para o Radar facilmente
O item "Voltar ao Radar" esta no fim da sidebar (posicao 7 de 7). Deveria ser o primeiro ou ter destaque visual. O BackButton no header tambem existe, entao ha redundancia.

### U3: Tela vazia sem orientacao
Quando CuradoriaApproval, CuradoriaEditor ou NewsletterExport estao vazias, mostram apenas icone + texto generico. Nao orientam o usuario sobre o que fazer para preenche-las (ex: "Va ao Radar e envie itens para aprovacao").

### U4: Editor Social gera conteudo local, nao salva
CuradoriaEditor gera texto para LinkedIn/Instagram/Video, mas nao persiste. Se o usuario fecha o dialog, perde tudo. Deveria ao menos ter um "rascunho salvo" ou warning antes de fechar.

### U5: Persona precisa estar preenchida para testar, mas nao ha selecao de persona salva na aba Testar
O usuario tem que ir na aba Configurar, preencher/editar uma persona, depois ir na aba Testar. Se ele so quer testar uma persona salva, nao tem como selecionar direto.

---

## PLANO DE EXECUCAO

| # | Item | O que fazer |
|---|------|-------------|
| 1 | **Fix RLS definitivo** | Migration que dropa TODAS as policies por nome e recria como PERMISSIVE. Verificar com query no banco antes e depois. |
| 2 | **Corrigir redirect pos-login** | AuthPage deve navegar para `/` (Radar) apos login, nao `/curadoria` |
| 3 | **Reescrever onboarding** | Tour com 5-6 passos que ensinem o fluxo real: Coletar > Aprovar > Newsletter/Redes/Editor Brasis |
| 4 | **Estados vazios informativos** | Cada tela vazia deve orientar o usuario pro passo anterior do pipeline |
| 5 | **Selector de persona na aba Testar** | Dropdown que carrega personas salvas direto na aba de teste |
| 6 | **Remover banner demo morto** | Tirar o bloco `!user` do RadarMain (ja protegido por AuthGuard) |
| 7 | **Mover "Voltar ao Radar" para topo da sidebar** | Primeiro item, com icone diferenciado |

Os itens 1-4 sao obrigatorios antes de liberar para o time. Os itens 5-7 sao melhorias de experiencia recomendadas.

