import { supabase } from '@/integrations/supabase/client';

export type AuditAction =
  | 'approve'
  | 'reject'
  | 'send_to_newsletter'
  | 'send_to_editor'
  | 'status_change'
  | 'delete'
  | 'import_to_editor'
  | 'bulk_delete_collected'
  | 'bulk_delete_filtered'
  | 'bulk_delete_rejected'
  | 'bulk_delete_approval'
  | 'marked_published'
  | 'automated_collection';

interface LogParams {
  itemId?: string | null;
  action: AuditAction;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort audit logger. Never throws — auditing must not block user actions.
 * For aggregate actions (bulk/publish) itemId can be omitted.
 */
export async function logAudit(params: LogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('radar_audit_logs' as any).insert({
      item_id: params.itemId ?? null,
      user_id: user.id,
      action: params.action,
      previous_status: params.previousStatus ?? null,
      new_status: params.newStatus ?? null,
      reason: params.reason ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (e) {
    console.warn('[audit] falha ao registrar log:', e);
  }
}

/** Aggregate log for bulk operations (no single item_id). */
export async function logBulk(
  action: Extract<AuditAction, 'bulk_delete_collected' | 'bulk_delete_filtered' | 'bulk_delete_rejected' | 'bulk_delete_approval' | 'marked_published'>,
  count: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await logAudit({ action, metadata: { count, ...metadata } });
}

export async function fetchPreviousStatus(itemId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('radar_brasis')
      .select('status')
      .eq('id', itemId)
      .maybeSingle();
    return (data?.status as string) ?? null;
  } catch {
    return null;
  }
}
