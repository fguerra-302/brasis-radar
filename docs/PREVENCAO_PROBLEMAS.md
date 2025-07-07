# Prevenção de Problemas Recorrentes

## Problema Identificado
Problemas de fluxo já identificados não foram corrigidos adequadamente, causando:
- Itens aprovados não aparecendo na curadoria
- Status incorretos no banco de dados
- Funcionalidades quebradas mesmo após "correção"

## Soluções Implementadas

### 1. Validação Automática ✅
- Hook `useFluxoValidation` verifica o fluxo a cada 30s
- Alertas automáticos no header quando há problemas
- Console logs para debugging

### 2. Checklist de Testes ✅
- Documento `CHECKLIST_TESTES.md` com todos os cenários
- Queries SQL para verificar dados
- Status válidos documentados

### 3. Processo de Desenvolvimento ✅
**Antes de qualquer mudança:**
1. Executar checklist completo
2. Verificar se validação automática está funcionando
3. Testar fluxo completo end-to-end

**Após qualquer mudança:**
1. Executar checklist novamente
2. Verificar se novos alertas apareceram
3. Testar cenários críticos

### 4. Monitoramento Contínuo ✅
- Validação roda automaticamente
- Alertas visíveis no header
- Logs automáticos no console

## Como Usar

### Para Desenvolver
```bash
# Sempre verificar antes de mudanças
1. Abrir console do navegador
2. Procurar por "🔍 Validando fluxo de curadoria..."
3. Verificar se há warnings
4. Executar checklist manual se necessário
```

### Para Testar
```bash
# Fluxo completo
1. Dashboard → Aprovar item
2. Curadoria/Aprovação → Verificar se apareceu
3. Enviar para Newsletter  
4. Curadoria/Newsletter → Verificar se apareceu
5. Gerar newsletter
```

### Para Diagnosticar
```sql
-- Ver distribuição de status
SELECT status, COUNT(*) FROM radar_brasis GROUP BY status;

-- Ver itens recentes
SELECT id, title, status, created_at FROM radar_brasis 
ORDER BY created_at DESC LIMIT 10;
```

## Compromisso de Qualidade
- ✅ Validação automática sempre ativa
- ✅ Alertas visíveis quando há problemas  
- ✅ Checklist obrigatório antes de mudanças
- ✅ Documentação atualizada sempre
- ✅ Testes end-to-end em cada mudança

**Nunca mais um problema já identificado passará despercebido.**