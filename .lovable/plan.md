## Problema

No Radar (`/`) você não encontra bulk actions. O código existe (`BulkActions.tsx`), mas hoje ele:

1. Renderiza como uma **faixa cinza sutil** entre os filtros e os cards — fácil de passar batido.
2. Só mostra cada botão **quando há itens daquele status** no filtro atual (ex.: "Limpar Coletados" some se não houver nenhum "Coletado" na visão).
3. Não tem rótulo claro tipo "Ações em massa" — parece só uma barra de estatísticas.
4. Não permite **selecionar itens individuais** para agir só neles.

## O que vou fazer

### 1. Barra dedicada "Ações em massa" sempre visível
Substituir a faixa atual por um bloco com título **"Ações em massa"** acima da grade de cards, com:
- Contagem total + badges por status (mantém o que já tem).
- **Um botão primário laranja "Ações em massa ▾"** (menu dropdown) sempre presente, listando todas as opções mesmo quando desabilitadas, com o número entre parênteses:
  - Limpar Coletados (N)
  - Limpar Rejeitados (N)
  - Resetar Em Aprovação (N)
  - Excluir todos os filtrados (N)
- Opções com N=0 ficam **desabilitadas com tooltip explicando o motivo** ("Nenhum item Coletado nesta visão"), em vez de sumir.

### 2. Seleção por item (checkbox)
- Adicionar um checkbox no canto superior esquerdo de cada `ContentCard`.
- Checkbox "Selecionar todos os filtrados" na barra.
- Quando houver itens selecionados, o botão vira **"Ações em N selecionados ▾"** com opções: Aprovar, Rejeitar, Enviar para edição, Excluir.
- Todas as ações em lote continuam gerando `logBulk` no `radar_audit_logs`.

### 3. Confirmação e feedback
- Manter os `AlertDialog` de confirmação para ações destrutivas (excluir, limpar).
- Toast com contagem final ("N itens excluídos"), invalidação do React Query já existente.

## Arquivos afetados

- `src/components/content/BulkActions.tsx` — reescrever como bloco "Ações em massa" com dropdown único + checkbox "selecionar todos".
- `src/components/content/ContentCard.tsx` — adicionar prop `selected` + `onToggleSelect` e checkbox no header.
- `src/components/content/ContentList.tsx` — gerenciar estado `selectedIds`, passar para cards e BulkActions, expor callbacks de ação em selecionados.
- `src/components/radar/RadarMain.tsx` — implementar handlers `handleBulkApprove`, `handleBulkReject`, `handleBulkSendToEdit` (usa `updateMutation` em loop + `logBulk`).

## Fora de escopo

- Não muda a página `/curadoria` (só o Radar principal).
- Não altera regras de status, RLS, coleta ou tombstones — só a camada visual + seleção.
- Sem novas migrations.
