# Checklist de Testes - Radar Brasis

## Fluxo Completo de Curadoria
- [ ] 1. Dashboard principal: Coletar dados funciona
- [ ] 2. Dashboard principal: Aprovar item → deve ir para "Em aprovação"
- [ ] 3. Curadoria/Revisão: Itens "A curar" aparecem
- [ ] 4. Curadoria/Revisão: Aprovar → vai para "Em aprovação"
- [ ] 5. Curadoria/Aprovação: Itens "Em aprovação" aparecem
- [ ] 6. Curadoria/Aprovação: Enviar para Newsletter → vai para "Para Newsletter"
- [ ] 7. Curadoria/Newsletter: Itens "Para Newsletter" aparecem
- [ ] 8. Curadoria/Newsletter: Gerar newsletter funciona
- [ ] 9. Curadoria/Newsletter: Finalizar newsletter → status atualizado

## Status válidos no banco
- [ ] "A curar" - Estado inicial após coleta
- [ ] "Em aprovação" - Após primeira aprovação
- [ ] "Para Newsletter" - Aprovado para newsletter
- [ ] "Para Redes Sociais" - Aprovado para redes sociais
- [ ] "Publicado" - Final (não usado mais no novo fluxo)
- [ ] "Ignorado" - Rejeitado

## Queries críticas a testar
```sql
-- Verificar se status estão corretos
SELECT status, COUNT(*) FROM radar_brasis GROUP BY status;

-- Verificar fluxo
SELECT id, title, status, created_at FROM radar_brasis 
ORDER BY created_at DESC LIMIT 10;
```

## Componentes críticos
- [ ] CuradoriaReview - puxar "A curar"
- [ ] CuradoriaApproval - puxar "Em aprovação"  
- [ ] NewsletterExport - puxar "Para Newsletter"
- [ ] RadarMain handleAprovar - enviar para "Em aprovação"