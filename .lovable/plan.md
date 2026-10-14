## Verificação real do estado atual do Radar Brasis

Objetivo: confirmar com dados reais (não com memória) como o app está hoje e entregar ao Mateus um relatório simples de "o que funciona, o que não funciona, próximo passo". Nenhuma alteração no código ou no banco.

### 1. Versão publicada
- Abrir https://brasis-radar.lovable.app e o preview; comparar se a versão publicada está igual à atual (tela em branco para contas novas foi corrigida?).

### 2. Banco de dados (somente leitura)
- Contar itens por status e por grupo em `radar_brasis` (tamanho real do backlog).
- Quantos usuários existem e quantos dados cada um tem (confirmar o problema de "dados por pessoa").
- Última execução da automação de coleta: quando, quantos itens, sucesso/erro.
- Quantidade de registros de auditoria e últimas ações.
- Fontes cadastradas: quantas ativas/inativas.

### 3. Fluxo principal no app (logado)
- Entrar no app e percorrer: Radar (lista, filtros, ações em massa) → Curadoria/Aprovação → Editor Brasis → Exportar newsletter → Auditoria → Fontes.
- Tirar prints de cada tela e anotar erros visíveis ou no console.

### 4. Automações e segurança
- Ver logs recentes das funções de coleta (erros nos últimos dias).
- Listar alertas de segurança pendentes.

### 5. Entrega
Relatório curto em português, em linguagem simples:
- O que está funcionando (com evidência)
- O que está quebrado ou incompleto
- Lista priorizada de próximos passos
