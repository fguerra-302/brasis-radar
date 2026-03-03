

# Auditoria Completa para Go Live -- 20 Usuários Internos

## Veredicto Geral

**O sistema PODE ir ao ar para 20 usuários internos**, com 3 ações obrigatórias no Supabase Dashboard e 2 correções recomendadas no código. Não há bloqueadores críticos de código.

---

## 1. SEGURANÇA -- Estado Atual

### 1.1 RLS (Row Level Security) -- OK
Todas as 8 tabelas têm RLS ativo com políticas por `user_id = auth.uid()`. Cada usuário só vê seus próprios dados. A tabela `user_roles` usa `has_role()` SECURITY DEFINER para evitar recursão. Sem falhas.

### 1.2 Credenciais JSONB -- ACEITÁVEL
Os campos `credentials` e `external_api_config` em `radar_sources` têm SELECT revogado para roles `anon`/`authenticated`. Acesso somente via funções SECURITY DEFINER com validação de tamanho (10KB) e estrutura. Para 20 usuários internos confiáveis, é suficiente.

### 1.3 Validação de Entrada -- OK
`inputValidation.ts` tem detecção de SQL injection, sanitização XSS, validação de URL (bloqueia localhost/IPs privados). Edge functions têm rate limiting (10 req/min).

### 1.4 Autenticação -- ATENÇÃO
- `/config/*` e `/curadoria/*` estão protegidos por `AuthGuard`.
- **A rota `/` (Index/Radar) NÃO tem AuthGuard.** O componente `RadarMain` usa `useAuth()` e as queries dependem de RLS (que exige auth), então dados ficam protegidos. Mas a página renderiza sem login, mostrando o header e UI vazia. Isso é funcional mas pode confundir novos usuários.

---

## 2. AÇÕES OBRIGATÓRIAS NO SUPABASE DASHBOARD

Estas 3 pendências são **warn** do linter e devem ser resolvidas antes do go-live para 20 pessoas:

| Item | Onde resolver | Prioridade |
|------|--------------|------------|
| **Leaked Password Protection** | Auth > Settings > Password | Alta |
| **MFA (TOTP)** | Auth > Providers > habilitar TOTP | Média |
| **Postgres Upgrade** | Settings > Database > Upgrade | Alta |

Nenhuma dessas requer mudança de código.

---

## 3. CORREÇÕES RECOMENDADAS NO CÓDIGO

### 3.1 Proteger rota `/` com AuthGuard (Recomendado)
A página principal mostra UI sem login. Com 20 usuários, todos deverão estar autenticados. Envolver a rota `/` com `AuthGuard` garante que ninguém veja a interface sem estar logado.

```
Arquivo: src/App.tsx
Mudança: <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
```

### 3.2 Remover console.logs de produção (Opcional)
Há ~10 console.log espalhados em `RadarMain`, `Index`, `RadarBrasis`, `App.tsx` que expõem lógica interna. Para 20 usuários internos confiáveis, o risco é baixo. Pode ser feito via `vite.config.ts`:

```typescript
esbuild: {
  drop: ['console', 'debugger']
}
```

---

## 4. REAL-TIME (CHANNEL_ERROR)

O real-time está falhando (37+ erros CHANNEL_ERROR). Isso já foi aceito como limitação -- usuários precisam dar refresh manual. Para 20 usuários não é bloqueante, mas o badge "Ao vivo" é enganoso. Recomendo remover ou trocar por "Atualizar" manual.

---

## 5. GAPS FUNCIONAIS CONHECIDOS

Documentados e não-bloqueantes para o fluxo core (Coletado > Selecionado > News Pronta):
- Persona config sem persistência backend
- AutomationConfig switches não salvam em `user_settings`
- External API Config sem backend funcional

---

## 6. PERFORMANCE para 20 Usuários

- Supabase Free/Pro suporta facilmente 20 usuários simultâneos
- Queries têm índices para RLS
- Rate limiting de 10 req/min por usuário é adequado
- Sem problemas de escala previstos

---

## Resumo Executivo

```text
+---------------------------+----------+------------------+
| Item                      | Status   | Ação Necessária  |
+---------------------------+----------+------------------+
| RLS em todas tabelas      | OK       | Nenhuma          |
| Credenciais protegidas    | OK       | Nenhuma          |
| Validação de entrada      | OK       | Nenhuma          |
| Auth nas rotas protegidas | OK       | Nenhuma          |
| Rota "/" sem AuthGuard    | ATENÇÃO  | Adicionar guard  |
| Leaked password protect.  | WARN     | Dashboard        |
| MFA                       | WARN     | Dashboard        |
| Postgres upgrade          | WARN     | Dashboard        |
| Console.logs produção     | INFO     | Opcional         |
| Real-time                 | WARN     | Aceito/ignorado  |
| Performance 20 users      | OK       | Nenhuma          |
+---------------------------+----------+------------------+
```

**Recomendação**: Resolva os 3 itens do Dashboard + adicione AuthGuard na rota `/`, e o sistema está pronto para go live com 20 usuários internos.

