

## Plano: Refatoracao Visual Completa - Padrao Brasis

### Analise do Site de Referencia (brasis.lovable.app)

O site oficial usa:
- **Fundo dominante**: Azul escuro (#1e5fc2) no hero, beige (#efe8d5) nas secoes internas
- **Titulos**: Fonte Favela Black, cor branca sobre azul, ou azul sobre beige
- **Botoes CTA**: Laranja solido (#ed7703) com bordas arredondadas, sem gradiente
- **Logo**: Imagem PNG do logo BRASIS (nao texto)
- **Cards**: Fundo branco limpo sobre beige
- **Navegacao**: Fundo azul escuro com texto branco
- **Sem gradientes nos textos ou botoes**

### Problemas Atuais vs Referencia

1. Fundo `--background` ainda e beige muito claro (96% lightness), deveria ser beige real (89%)
2. `.brasis-text-gradient` aplica gradiente nos titulos - deveria ser azul solido
3. `.brasis-button-primary` usa gradiente - deveria ser laranja solido
4. `.brasis-card` usa gradiente de fundo - deveria ser branco limpo
5. Pagina de login usa `bg-gradient-warm` generico - deveria usar azul escuro (#1e5fc2) como o hero do site
6. Icone Bot generico no header - substituir pelo logo oficial BRASIS_AZUL.png
7. Header nao segue o padrao visual do site (nav azul escuro)

### Implementacao

**Passo 1 - Copiar logos para o projeto**
- Copiar `BRASIS_AZUL.png` para `src/assets/` (uso principal no header sobre beige)
- Copiar `BRASIS_BRANCO.png` para `src/assets/` (uso na pagina de login sobre azul)
- Copiar `BRASIS_LARANJA.png` para `src/assets/` (uso alternativo)

**Passo 2 - Reescrever tokens CSS em `src/index.css`**
- `--background`: beige real `42 50% 89%` (era 96%)
- `--card`: branco `0 0% 100%`
- Remover `.brasis-text-gradient` (substituir por classe simples `text-secondary`)
- `.brasis-button-primary`: `background: hsl(var(--primary))` solido, sem gradiente
- `.brasis-card`: `background: white`, borda sutil, sem gradiente
- Remover gradientes `--gradient-brasis`, `--gradient-warm` etc

**Passo 3 - Atualizar `AuthPage.tsx`**
- Trocar `bg-gradient-warm` por `bg-secondary` (azul escuro solido)
- Usar logo BRASIS_BRANCO.png no lugar de icone Radar
- Titulo branco sobre azul, sem classe gradient
- Card branco com cantos arredondados

**Passo 4 - Atualizar `AppHeader.tsx`**
- Usar logo BRASIS_AZUL.png (import do src/assets) no lugar de icone Bot
- Titulo em `text-secondary` (azul solido) sem `.brasis-text-gradient`
- Botao CTA: `bg-primary text-white` (laranja solido) sem `.brasis-button-primary`

**Passo 5 - Atualizar layouts (ConfigLayout, CuradoriaLayout)**
- Trocar `brasis-text-gradient` por `text-secondary` nos titulos
- Trocar `bg-brasis-beige/10` por `bg-background` (ja sera beige real)

**Passo 6 - Varrer todos os componentes restantes**
- Substituir toda ocorrencia de `brasis-text-gradient` por `text-secondary`
- Substituir `brasis-button-primary` por `bg-primary text-white`
- Substituir `brasis-card` por `bg-white` ou `bg-card`
- Componentes: RadarLiveStats, RadarRecentActions, RadarAutomationStatus, RadarEmpty, RadarDebugInfo, RadarStats, ContentCard, ContentFilters, ContentList, BulkActions, ConfigurationAlert, CuradoriaSidebar, OnboardingTour

**Passo 7 - Limpar tailwind.config.ts**
- Remover `backgroundImage` com gradientes obsoletos

### Resultado Esperado
- Visual identico ao site brasis.lovable.app: azul nos titulos, laranja nos CTAs, beige no fundo, cards brancos, logo oficial, zero gradientes

