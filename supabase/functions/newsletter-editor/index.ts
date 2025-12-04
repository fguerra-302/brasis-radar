import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const ALLOWED_ORIGINS = [
  'https://3d99c837-5852-4c57-9505-d2ca60666732.lovableproject.com',
  'https://vlsirftmzvmilugalbpr.supabase.co'
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Security: generic error messages for client
function createErrorResponse(
  corsHeaders: Record<string, string>,
  userMessage: string,
  status: number,
  internalContext?: string,
  internalError?: unknown
) {
  if (internalContext) {
    console.error(`[newsletter-editor] ${internalContext}:`, internalError || userMessage);
  }
  return new Response(
    JSON.stringify({ error: userMessage }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(corsHeaders, 'Autenticação necessária', 401, 'Missing auth header');
    }

    const token = authHeader.substring(7);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse(corsHeaders, 'Falha na autenticação', 401, 'Auth failed', authError);
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return createErrorResponse(corsHeaders, 'Muitas solicitações. Aguarde um momento.', 429, 'Rate limit exceeded');
    }

    if (!openAIApiKey) {
      return createErrorResponse(corsHeaders, 'Serviço temporariamente indisponível', 503, 'OpenAI API key not configured');
    }

    const { newsletterText, publicoAlvo, customPrompt } = await req.json();

    if (!newsletterText) {
      return createErrorResponse(corsHeaders, 'Texto da newsletter é obrigatório', 400);
    }

    console.log('[newsletter-editor] Processing newsletter...');

    // Get custom prompt if not provided
    let finalPrompt = customPrompt;
    
    if (!customPrompt) {
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('ai_newsletter_prompt')
        .eq('user_id', user.id)
        .maybeSingle();
      
      finalPrompt = userSettings?.ai_newsletter_prompt;
    }

    // Base prompt as fallback
    const basePrompt = `# Nome do GPT  
Lovable Editor – Texto Corrigido com Storytelling

## 🏆 Missão Principal  
"Você é um editor-chefe de newsletters. Sua função é revisar, corrigir e transformar conteúdos de diferentes editorias em um texto fluido, bem escrito e envolvente. Sua entrega deve manter o que já funciona, aplicar storytelling leve e sair pronta para ser copiada e colada na ferramenta de envio de newsletters."

## 📌 Como você deve atuar  
- **Revise apenas o necessário**: ortografia, gramática, repetição, truncamentos, falhas de coesão.  
- **Mantenha o conteúdo funcional e bem escrito.**  
- Reescreva os resumos com storytelling leve, tornando a leitura mais fluida e conectada.  
- Agrupe os conteúdos por editoria.  
- Para cada editoria:  
  - Comece com uma **frase de abertura que conecte os temas** (como se fosse um microeditorial).  
  - Liste os itens com **bullet points** usando o padrão abaixo.  
  - Finalize com uma **chamada curta de encerramento**.

## 🧩 Formato da saída (texto plano)

**[Nome da Editoria]**  
📌 [Storytelling de introdução com 1 ou 2 frases]  

• **[Título da Notícia 1]** – [Resumo com narrativa fluida e contexto leve]. [Leia mais](link)  
• **[Título da Notícia 2]** – [Resumo com storytelling curto e direto]. [Leia mais](link)

➡️ [Fechamento breve e provocativo que convide à reflexão ou leitura complementar]

(Repita esse bloco para cada editoria presente)

## ⚠️ Restrições  
- Não modifique links ou títulos já corretos.  
- Não use termos promocionais, mantenha uma linguagem editorial.  
- Mantenha o texto **economizado e direto**, sem floreios ou inchaço desnecessário.  
- Evite repetir a mesma estrutura de frase entre os itens. Varie o estilo sutilmente.

## 🛠️ Técnicas aplicadas  
- Correção mínima com impacto máximo  
- Storytelling editorial leve  
- Agrupamento lógico por editoria  
- Adaptação de tom conforme o público informado`;

    if (!finalPrompt) {
      finalPrompt = basePrompt;
    }
    
    // Add audience context if provided
    if (publicoAlvo) {
      finalPrompt += `\n\n## 📂 PÚBLICO_ALVO:\n${publicoAlvo}\n\nAdapte o texto conforme essas diretrizes de público-alvo.`;
    }

    finalPrompt += `\n\n---\n\nAGORA, refine o seguinte conteúdo de newsletter:\n\n${newsletterText}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um editor especialista em newsletters. Sempre retorne texto em formato plano, sem markdown ou formatações especiais.' 
          },
          { 
            role: 'user', 
            content: finalPrompt 
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error('[newsletter-editor] OpenAI API error:', response.status);
      return createErrorResponse(corsHeaders, 'Erro ao processar newsletter. Tente novamente.', 500, 'OpenAI API error');
    }

    const data = await response.json();
    const refinedText = data.choices[0].message.content;

    console.log('[newsletter-editor] Newsletter refined successfully');

    return new Response(
      JSON.stringify({ 
        refinedText,
        originalLength: newsletterText.length,
        refinedLength: refinedText.length,
        publicoAlvo: publicoAlvo || null,
        promptUsed: customPrompt ? 'custom' : 'saved'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[newsletter-editor] Unhandled error:', error);
    return createErrorResponse(getCorsHeaders(req), 'Erro ao processar solicitação. Tente novamente.', 500, 'Unhandled error', error);
  }
});
