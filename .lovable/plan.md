

## Problema Identificado

O sistema de relevância está causando **radar vazio** para a maioria dos usuários. Aqui está o que acontece:

1. O usuário configura palavras-chave, mas as fontes RSS trazem conteúdos que **não combinam** com nenhuma delas
2. Quando nenhuma palavra-chave combina, o sistema dá nota **1** ao conteúdo
3. O filtro padrão está configurado para aceitar apenas nota **3 ou mais**
4. Resultado: **tudo é descartado silenciosamente** e o radar fica vazio sem explicação

O usuário não tem como saber que o problema é o filtro de relevância -- ele só vê "Nenhum conteúdo encontrado".

---

## O Que Vamos Fazer

### 1. Corrigir a nota mínima no motor de coleta
**Arquivo:** `supabase/functions/radar-automation/index.ts`

Quando palavras-chave existem mas nenhuma combina com o conteúdo, mudar a nota de **1** para **2**. Isso faz com que conteúdos sem match não sejam descartados tão agressivamente.

### 2. Mudar o filtro padrão de 3 para 1
**Arquivo:** Nova migração SQL

Novos usuários passam a ver **todo o conteúdo** por padrão. Depois eles podem aumentar o filtro quando entenderem o sistema. Usuários existentes mantêm suas configurações atuais.

### 3. Simplificar a tela de configuração de relevância
**Arquivo:** `src/components/config/RelevanceThresholdConfig.tsx`

Trocar o slider abstrato (1-5) por **botões com nomes claros**:
- **"Aceitar tudo"** (nível 1) -- recomendado para iniciantes
- **"Filtrar spam"** (nível 2) -- filtragem leve
- **"Curadoria moderada"** (nível 3) -- equilibrado
- **"Curadoria rigorosa"** (nível 4-5) -- só para quem já configurou bem as palavras-chave

Adicionar um **aviso amarelo** quando o nível for 3+ dizendo que conteúdos podem estar sendo descartados.

### 4. Melhorar a tela vazia do radar com diagnóstico
**Arquivo:** `src/components/radar/RadarEmpty.tsx`

Quando o radar está vazio, mostrar uma **dica específica**: "Seus conteúdos podem estar sendo filtrados pela relevância mínima. Tente reduzir nas configurações." com um botão direto para ajustar.

---

## Resumo dos Arquivos

| Arquivo | O que muda |
|---------|-----------|
| `radar-automation/index.ts` | Nota mínima de 1 → 2 quando não há match |
| Nova migração SQL | Default de `min_relevance_threshold` de 3 → 1 |
| `RelevanceThresholdConfig.tsx` | Slider → botões com nomes claros + aviso |
| `RadarEmpty.tsx` | Mensagem de diagnóstico + link para config |

Nenhuma mudança quebra o que já existe. Usuários atuais mantêm suas configurações.

