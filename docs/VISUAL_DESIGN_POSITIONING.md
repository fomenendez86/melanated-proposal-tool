# Proposal Studio — Posicionamiento de diseño visual

**Estado:** Documento vivo; primera versión.
**Actualizado:** 2026-08-22

Complementa [`docs/COMPETITIVE_POSITIONING.md`](COMPETITIVE_POSITIONING.md),
que ya nombraba "marca placeholder" y "un solo diseño real" como brechas a
nivel de producto/negocio. Este documento profundiza esas dos brechas
específicamente desde diseño visual y arquitectura de renderizado — son
complementarios, no duplicados. Mismas reglas: no se nombran productos
externos en este archivo, y este documento no reordena
`STUDIO_EXPANSION_PLAN.md` por sí solo.

## Cuándo consultar este documento

Los mismos gatillos que `COMPETITIVE_POSITIONING.md`: al cerrar la fase
operativa actual antes de proponer automáticamente la siguiente en orden, o
cuando el usuario pregunte "qué sigue" sin especificar fase — en particular
si esa pregunta toca diseño de documento, marca, o un segundo diseño real.

## El documento (Safari Editorial)

### A favor

- Geometría protegida real (no imágenes recortadas simulando forma): el
  efecto de papel rasgado en portada vía `clip-path` polygon, los triángulos
  de los dividers — craft real, no aproximación.
- Diseño image-led coherente con la categoría de propuestas de safari de
  lujo, donde la fotografía sostiene la venta.
- Estandarización deliberada (footer siempre abajo-derecha) donde el
  original a mano era inconsistente — más disciplina visual que el
  documento que reemplaza.

### Brechas

- **Tipografía 100% placeholder.** Sans genérica + serif/italic
  aproximando Prata, BankGothicBT, Muli, Gotham-Bold, PalmClubScript,
  Oswald, EBGaramond (ya documentado en `CLAUDE.md`, "Pendientes
  conocidos"). Para una marca boutique, un documento que se lee
  tipográficamente como fuente por defecto de navegador contradice el
  posicionamiento premium antes de que el cliente lea una palabra.
- **Sin logo real** — emoji/texto. El tell más visible en cualquier
  comparación directa.
- **Iconografía en emoji** para contenido editorial (🛂, 🪪, 🐚, clima —
  decisión de dato, no de brand pack). Los dos slots de marca fijos
  (globo, advertencia) ya pasaron a íconos Lucide reales — ver
  `docs/BRAND_ASSET_PACK.md`.

## El editor (Proposal Studio UI)

### A favor

- Separación deliberada entre chrome del editor y marca del documento
  (`docs/EDITOR_DESIGN_SYSTEM.md`) — evita que la marca del documento se
  filtre al chrome o viceversa.
- Sistema real de primitivas (`EditorButton`, `EditorSegmentedControl`,
  `EditorDrawer`, `EditorStatusBadge`) en `components/editor/EditorUi.tsx`,
  no estilos ad hoc por pantalla.
- Regla documentada y aplicada de que el estado nunca se comunica solo por
  color.
- Layout responsive con drawers verificado end-to-end (390px–1440px) con
  manejo de foco correcto.

### Brechas

- Identidad visual propia del editor deliberadamente mínima
  (`editor-accent` documentado como "solo acento de identidad pequeño") —
  funcional pero sin personalidad visual propia.
- Riesgo de acumulación de patrones de interacción ad hoc por fase (overlay
  10.3, popover 10.4, y lo que sume Fase 11) sin una pasada dedicada de
  consistencia — ya señalado como riesgo transversal en
  `STUDIO_EXPANSION_PLAN.md`, mencionado acá porque es también un riesgo de
  diseño visual, no solo de arquitectura de código.

## Resuelto: segundo renderer real (Minimal Grid v2)

La pregunta de arquitectura que este documento planteaba originalmente —
¿un segundo diseño visual real requiere un renderer separado, o alcanza con
theming más profundo del renderer único? — está resuelta: se construyó un
renderer separado. `minimal-grid` se registró como **v2** (no se mutó v1,
por la regla de versionado de `docs/DOCUMENT_DESIGN_CONTRACT.md`) con
`rendererId: "minimal-grid-v1"`, un árbol de 17 componentes propio bajo
`components/blocks/minimal-grid/` con grid, tipografía y tratamiento
genuinamente distintos (sin clip-path ni triángulos, sin itálicas,
superficie off-white) — no una sustitución de tokens de color sobre los
mismos bloques. `ProposalRenderer.tsx` rutea por `design.rendererId` contra
un mapa de renderers, con fallback al renderer de Safari Editorial.

Limitación conocida y documentada, no descubierta tarde: `lib/paginate.ts`
sigue siendo genérico/compartido entre renderers (no rutea por diseño), así
que los 4 tipos de bloque con paginación dinámica en Minimal Grid v2
(Overview, DayItinerary, ExcursionList, TermsConditions) se construyeron
preservando la altura de línea y ancho de columna de Safari Editorial en
vez de tener presupuestos propios — verificado empíricamente (Playwright,
medición de `scrollHeight` contra las 57 páginas de la propuesta de
referencia, sin overflow). Un tercer diseño con densidad de texto muy
distinta necesitaría paginación consciente del diseño antes de sumarse.

## Ejes de decisión

| Brecha | Bloqueante si... | Prescindible si... |
| --- | --- | --- |
| Tipografía/logo/iconos placeholder | el documento se muestra a un cliente real | el uso sigue siendo interno/de prueba |
| ~~Renderer único detrás de dos diseños~~ (resuelto: Minimal Grid v2 tiene renderer propio) | — | — |
| ~~Sin modo oscuro / identidad propia del editor~~ (resuelto: `.proposal-studio[data-theme="dark"]` + toggle) | — | — |
