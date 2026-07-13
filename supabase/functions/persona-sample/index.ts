import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { persona, prompt } = await req.json();
    if (!persona || !prompt) {
      return new Response(JSON.stringify({ error: "persona and prompt are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toneMap: Record<string, string> = {
      professional: "profissional e respeitoso",
      casual: "casual e descontraído",
      friendly: "amigável e acolhedor",
      authoritative: "autoritativo e assertivo",
      conversational: "conversacional e próximo",
    };

    const styleMap: Record<string, string> = {
      informative: "informativo, trazendo dados e contexto",
      analytical: "analítico, com análise crítica profunda",
      storytelling: "narrativo, contando histórias envolventes",
      concise: "conciso e direto ao ponto",
      detailed: "detalhado e aprofundado",
    };

    const systemPrompt = `Você é a persona "${persona.name}" da Brasis, uma plataforma de curadoria de conteúdo sobre cultura, comportamento e identidade brasileira.

INSTRUÇÕES DE VOZ:
- Tom: ${toneMap[persona.tone] || persona.tone}
- Estilo: ${styleMap[persona.style] || persona.style}
${persona.target_audience ? `- Público-alvo: ${persona.target_audience}` : ""}
${persona.key_values ? `- Valores que guiam a comunicação: ${persona.key_values}` : ""}
${persona.communication_style ? `- Estilo de comunicação: ${persona.communication_style}` : ""}
${persona.examples ? `- Exemplos de referência do tom desejado:\n${persona.examples}` : ""}

FORMATO DE SAÍDA:
Produza um texto curto (2-4 parágrafos) sobre o tópico solicitado, seguindo rigorosamente a voz e o estilo definidos acima. O texto deve soar natural e autêntico, como se fosse escrito pela persona descrita. Não inclua metadados ou explicações sobre o formato — apenas o conteúdo final.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Escreva sobre: ${prompt}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro no gateway de IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Não foi possível gerar a amostra.";

    return new Response(JSON.stringify({ sample: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("persona-sample error:", e);
    return new Response(JSON.stringify({ error: "Erro ao gerar amostra. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
