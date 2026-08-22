# Proposal Studio — Posicionamiento competitivo

**Estado:** Documento vivo; primera versión.
**Actualizado:** 2026-08-22

Este documento no es parte del roadmap operativo. `STUDIO_EXPANSION_PLAN.md`
sigue siendo la fuente de verdad de qué se construye y en qué orden. Este
documento registra *por qué* ese orden podría revisarse, comparando el
producto contra la categoría de herramientas comerciales de propuestas
visuales con firma y tracking (no se nombran productos específicos en este
archivo, siguiendo la regla del proyecto — ver "No nombrar aplicaciones..."
en `CLAUDE.md`).

## Cuándo consultar este documento

- Al terminar la fase operativa actual del roadmap, antes de proponer
  automáticamente "la siguiente fase en orden" — revisar acá si sigue siendo
  la prioridad correcta.
- Cuando el usuario pregunte "qué sigue" sin especificar una fase.
- Cuando cambie el objetivo de negocio del producto (ver "Ejes de decisión"
  abajo) — algunas brechas solo importan bajo ciertos objetivos.

Este documento informa la respuesta a esas preguntas; no dispara trabajo por
sí solo. No reordena `STUDIO_EXPANSION_PLAN.md` — cualquier resecuenciación
real requiere acuerdo explícito del usuario.

## Resumen de la brecha competitiva

### Dónde el proyecto está adelante

- **Layouts protegidos, no canvas libre.** La decisión de editar contenido
  dentro de geometría fija (no cuadros de texto arrastrables) es lo que
  separa a las herramientas comerciales serias de las genéricas. Acá está
  mejor ejecutado que en la mayoría de la categoría: cada bloque tiene
  geometría real (`clip-path`, no imágenes de fondo).
- **Revisiones inmutables desde el diseño, no como parche tardío.** El
  modelo server-authoritative con `editorSource`/snapshots privados por
  sección (Fase 2.3B) deja mejor preparado el terreno para firma electrónica
  (Fase 15) que si el modelo de "documento vivo" se hubiera hecho primero y
  la inmutabilidad se hubiera agregado después, que es el orden típico en la
  categoría.
- **Edición inline en el documento (Fase 10).** Un solo estado compartido
  (`usePageFieldDraft`) entre canvas e inspector evita el bug clásico de
  "preview y editor divergen" que sí existe en herramientas comparables.
- **Rigor de testing y accesibilidad.** Cobertura e2e de teclado, foco,
  drawers móviles y touch targets por encima de lo habitual para el tamaño
  del proyecto.

### Dónde está atrás

- **Un solo diseño real.** `lib/designs/registry.ts` registra dos diseños,
  pero el segundo ("Minimal Grid") es explícitamente un fixture de
  compatibilidad, no una plantilla de producción. La arquitectura
  multi-diseño existe; el catálogo de diseños no. Cada diseño nuevo hoy es
  código nuevo (componente por bloque, render script, preview route), no un
  sistema de plantillas parametrizable.
- **No es multi-propuesta.** `/` redirige a la propuesta seed `1`; no hay
  dashboard, pipeline Draft/Sent/Viewed/Won, ni creación/duplicación de
  propuestas. Cualquier herramienta de la categoría, incluidas las más
  simples, es ante todo una app de *muchas* propuestas.
- **Pricing estático.** Sin ítems opcionales marcables por el cliente ni
  recálculo en vivo — funcionalidad estándar en la categoría, no un
  diferencial. Es Fase 14, sin empezar.
- **Sin firma electrónica ni analytics de vista.** El ciclo hoy termina en
  "aprobar por link" (Fase 8). Firma y tiempo-por-página son tabla stakes en
  la categoría, no un diferencial — Fases 15 y 16, sin empezar.
- **Marca placeholder.** Logo, iconos y tipografía siguen siendo emoji y
  sans genérica (Fase 9, bloqueada por el owner, no por ejecución). Es lo
  primero que se nota en cualquier comparación visual directa.
- **Sin biblioteca de contenido reutilizable.** El catálogo contextual
  (hoteles/excursiones) es fuerte para el caso de uso de safaris, pero no
  hay reutilización de texto entre propuestas (Fase 13, sin empezar).

## Ejes de decisión

Cada brecha pesa distinto según el objetivo de negocio real del producto:

| Brecha | Bloqueante si... | Prescindible si... |
| --- | --- | --- |
| Un solo diseño real | el objetivo pasa a vender esto a otras agencias/verticales | el uso queda interno a Melanated Safaris |
| No multi-propuesta | hay más de un vendedor o más de un cliente activo a la vez | el uso sigue siendo una propuesta a la vez, secuencial |
| Pricing estático | los clientes negocian ítems opcionales seguido | los paquetes son de precio fijo, sin variantes por cliente |
| Sin firma/analytics | se quiere medir tasa de cierre o reemplazar firma en papel/email | la aprobación por link ya es suficiente para el flujo actual |
| Marca placeholder | se muestra el producto a un cliente o prospecto externo | el uso es solo interno/de prueba |

## Sugerencia de resecuenciación (no decidida)

Firma electrónica y analytics (Fases 15-16) suenan más vistosas que
multi-propuesta y plantillas (Fases 12-13), pero importan menos si el
producto solo puede sostener una propuesta a la vez. Si el objetivo de
negocio se amplía más allá del uso interno actual, vale considerar adelantar
Fase 12 (multi-propuesta) y un sistema de plantillas liviano por delante de
Fase 15+ — son más baratas de construir y resuelven una brecha más básica de
la categoría. Esto es una sugerencia a evaluar cuando corresponda, no un
cambio de plan aprobado; `STUDIO_EXPANSION_PLAN.md` mantiene el orden vigente
mientras el usuario no decida lo contrario.
