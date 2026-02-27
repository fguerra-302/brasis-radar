

## Plano de Limpeza de Código Legado

### Ações a executar:

1. **Remover `src/components/curadoria/CuradoriaNewsletter.tsx`**
   - Arquivo com ~340 linhas de código morto
   - Funcionalidade duplicada com `NewsletterExport`

2. **Remover `src/components/curadoria/NewsletterEditor.tsx`**
   - Arquivo com ~230 linhas de código morto
   - Nunca foi integrado ao fluxo da aplicação

3. **Atualizar documentação `docs/CHECKLIST_TESTES.md`**
   - Linha 35: Alterar `CuradoriaNewsletter` → `NewsletterExport`
   - Manter a documentação alinhada com o código real

### Impacto:
- **Arquivos removidos:** 2
- **Linhas de código removidas:** ~570
- **Risco:** Zero (componentes não são usados)
- **Benefício:** Código mais limpo, menos confusão para manutenção futura

