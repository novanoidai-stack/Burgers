---
name: Code Analysis Findings F2
description: Technical debt and bugs discovered in F1+F2 code analysis (2026-04-01)
type: feedback
---

# Code Analysis Findings - F1+F2

**Fecha**: 2026-04-01
**Estado**: F2 70% completado + fixes P0-P1 aplicados
**Tests**: 37/37 PASS
**Compilación**: 0 errores TypeScript

---

## 🟢 Resumen Ejecutivo

Código F1+F2 está en estado **SÓLIDO** para avanzar a F3. Se identificaron y corrigieron issues críticos de pagos y lógica de menú. No hay bloqueadores técnicos para el smoke test de T13.

---

## ✅ Issues Fixed (P0-P1)

### P0 - CRITICAL (Bloqueador de F3)

**1. Stripe API Version - paymentService.ts:8**
- **Problema**: `apiVersion: '2026-03-25.dahlia'` inválido
- **Impacto**: Stripe rechazaba requests → pagos rotos
- **Fix**: Eliminar parámetro `apiVersion`, usar default de Stripe SDK
- **Archivo**: `src/services/paymentService.ts`
- **Commit**: `1fb133e` - "fix: correct P0-P1 critical bugs discovered in code analysis"

**2. Payment Link Expiration - FALSO POSITIVO**
- **Problema**: None - cálculo era correcto
- **Mi análisis incorrecto**: `Date.now() / 1000` es la forma correcta de convertir milisegundos a segundos UNIX
- **Estado**: No changes needed

### P1 - HIGH (Bloqueador funcional)

**3. LLM Menu Filtering - llmOrchestrator.ts:36**
- **Problema**: `p.category` debería ser `item.category`
- **Impacto**: Error de compilación en TypeScript strict
- **Fix**: Renombrar variable en `buildSystemPrompt`
- **Archivo**: `src/services/llmOrchestrator.ts`
- **Commit**: `1fb133e`

**4. Auth Header Syntax - FALSO POSITIVO**
- **Problema**: None - código era correcto
- **Mi análisis incorrecto**: La sintaxis `'Bearer '` estaba bien
- **Estado**: No changes needed

---

## 🟡 Technical Debt - P2 (Para F3)

**5. Session Race Condition - llmOrchestrator.ts:205**
- **Problema**: Mutación directa de `session.order_draft` sin deep clone
- **Impacto**: Data corruption potencial en concurrencia
- **Prioridad**: P2
- **Solución**: Implementar inmutabilidad o structuredClone
- **Fase**: F3 (durante integración TPV)

**6. Hardcoded Restaurant Name - llmOrchestrator.ts:173**
- **Problema**: `restaurantName = 'El Mesón'` hardcoded
- **Impacto**: Multi-tenancy incompleto
- **Prioridad**: P2
- **Solución**: Añadir restaurant name a config o products table
- **Fase**: F3

**7. Missing Structured Logging - Routes**
- **Problema**: Console.log básicos sin request ID
- **Impacto**: Debugging difícil en producción
- **Prioridad**: P2
- **Solución**: Implementar Winston/Pino logging
- **Fase**: F3

**8. No Idempotency Key - paymentService.ts:32**
- **Problema**: Stripe session sin `idempotency_key`
- **Impacto**: Doble cobro en race conditions
- **Prioridad**: P2
- **Solución**: Añadir `idempotency_key: orderId`
- **Fase**: F3

**9. Session Cleanup - sessionManager.ts**
- **Problema**: No hay limpieza de sesiones abandonadas
- **Impacto**: Sesiones huérfanas en BD
- **Prioridad**: P2
- **Solución**: Job cleanup o TTL en BD
- **Fase**: F4 (deployment)

---

## 🟢 Fortalezas del Código

**Arquitectura**:
- ✅ Multi-tenancy bien implementada (`restaurant_${tenantSlug}`)
- ✅ Input normalization pattern sólido
- ✅ Adapter pattern preparado para TPV (F3)
- ✅ Separación de responsabilidades clara (services/routes/middleware)

**TypeScript**:
- ✅ Tipos bien definidos en `conversation.ts`
- ✅ Zod validation robusta en config
- ✅ Interfaces limpias y bien documentadas

**Testing**:
- ✅ 37 tests unitarios + integración PASS
- ✅ TDD aplicado correctamente
- ✅ Mocking adecuado de servicios externos

**Error Handling**:
- ✅ Validaciones apropiadas
- ✅ Mensajes de error claros
- ✅ Try/catch en llamadas externas

---

## 📋 Próximos Pasos Recomendados

**Inmediato (T13 - HOY)**:
- Smoke test manual de voz y WhatsApp
- Verificar Stripe payment links funcionales tras fixes
- Validar LLM responses con menú correcto

**F3 - TPV Integration**:
- Address P2 issues durante integración
- Implementar logging estructurado
- Completar multi-tenancy (restaurant name dinámico)

**F4 - Production**:
- Session cleanup job
- Monitoring (Datadog/New Relic)
- Destructive QA testing

---

## 🎯 Conclusion

Estado del proyecto **LISTO PARA PROGRESAR**. Base técnica sólida, 37 tests PASS, issues críticos corregidos. F2 está en condiciones de completarse tras T13 smoke test exitoso.
