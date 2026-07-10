# Expansão do log de auditoria

Adicionar registros em `radar_audit_logs` para todos os eventos operacionais além dos 3 já cobertos (aprovar / rejeitar / enviar à edição).

## Eventos a instrumentar

1. **Bulk delete "Limpar Coletados"** (`BulkActions` / `ContentList`)
   - action: `bulk_delete_collected`
   - metadata: contagem de itens deletados, filtro aplicado
   - 1 log por operação (não por item) para não inundar a tabela

2. **Bulk delete "Excluir Filtrados"** (`BulkActions`)
   - action: `bulk_delete_filtered`
   - metadata: contagem, filtros ativos

3. **Import no BrasisEditor** (`BrasisEditor`)
   - action: `imported_to_editor`
   - status_before/after: `coletado` → `em edição`
   - item_id do radar

4. **Publicação de newsletter** (`NewsletterExport` → botão "Marcar itens como Publicado")
   - action: `marked_published`
   - metadata: contagem de itens marcados
   - 1 log agregado

5. **Coleta automática do cron** (`radar-automation` Edge Function)
   - action: `automated_collection`
   - user_id: `null` (sistema) ou id de service
   - metadata: fontes processadas, itens novos, itens filtrados por tombstone, duração
   - 1 log por execução do cron

## Ajustes técnicos

- **Schema**: `radar_audit_logs.user_id` provavelmente é `NOT NULL`. Migração leve para permitir `NULL` (eventos de sistema) OU usar um UUID sentinela `00000000-0000-0000-0000-000000000000` documentado. Verifico o schema atual antes de decidir.
- **`item_id` opcional**: para logs agregados (bulk/cron), `item_id` fica `NULL` — verificar se coluna já permite.
- **Edge Function log**: `radar-automation` roda com service_role, então usa `supabase.from('radar_audit_logs').insert(...)` direto, sem depender do helper `logAudit` (que é client-side).

## Página /auditoria

- Adicionar as novas actions ao dropdown de filtro "Ação"
- Renderização: quando `item_id` é null, mostrar badge "Operação em massa" ou "Sistema" no lugar do link do item

## Arquivos afetados

- `supabase/migrations/*` — ajuste de nullability em `user_id` e `item_id` se necessário
- `src/lib/auditLog.ts` — adicionar helpers `logBulkAction`, `logImport`, `logPublish`
- `src/components/content/BulkActions.tsx` — chamar log nos 2 bulks
- `src/components/curadoria/BrasisEditor.tsx` — log no import
- `src/components/newsletter/NewsletterExport.tsx` — log no "Marcar como Publicado"
- `supabase/functions/radar-automation/index.ts` — insert direto após cada execução
- `src/pages/Auditoria.tsx` — novas actions no filtro + renderização de logs agregados

## Fora de escopo

- Backfill retroativo (dado histórico não foi capturado, impossível)
- Retenção/rotação de logs (deixar para quando volume justificar)
