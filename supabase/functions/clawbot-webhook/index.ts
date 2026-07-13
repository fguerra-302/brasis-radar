import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret (from DB trigger via pg_net)
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (webhookSecret !== expectedSecret) {
      console.error('Unauthorized webhook call - invalid secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();
    const { event, record, timestamp } = payload;

    console.log(`[Clawbot Webhook] Event: ${event}, Item: ${record?.title || 'unknown'}, Time: ${timestamp}`);

    // Forward to Clawbot external URL if configured
    const clawbotUrl = Deno.env.get('CLAWBOT_WEBHOOK_URL');
    
    if (clawbotUrl) {
      const clawbotPayload = {
        event,
        source: 'brasis-radar',
        timestamp,
        data: {
          id: record.id,
          title: record.title,
          link: record.link,
          source: record.source,
          editoria: record.editoria,
          relevancia: record.relevancia,
          pub_date: record.pub_date,
          tags: record.tags,
          group_id: record.group_id,
          status: record.status,
          user_id: record.user_id,
        },
      };

      const clawbotResponse = await fetch(clawbotUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clawbotPayload),
      });

      console.log(`[Clawbot Webhook] Forwarded to Clawbot - Status: ${clawbotResponse.status}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        forwarded: true,
        clawbot_status: clawbotResponse.status 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No Clawbot URL configured - just log
    console.log('[Clawbot Webhook] No CLAWBOT_WEBHOOK_URL configured. Event logged only.');
    
    return new Response(JSON.stringify({ 
      success: true, 
      forwarded: false,
      message: 'Event received but CLAWBOT_WEBHOOK_URL not configured' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Clawbot Webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
