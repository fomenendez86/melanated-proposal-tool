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
- **Iconografía en emoji** (🌍, 🛂, etc.) — se lee como prototipo, no como
  material de venta.

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
- Sin modo oscuro para el chrome del editor.
- Riesgo de acumulación de patrones de interacción ad hoc por fase (overlay
  10.3, popover 10.4, y lo que sume Fase 11) sin una pasada dedicada de
  consistencia — ya señalado como riesgo transversal en
  `STUDIO_EXPANSION_PLAN.md`, mencionado acá porque es también un riesgo de
  diseño visual, no solo de arquitectura de código.

## Hallazgo de arquitectura: el "segundo diseño" no es un segundo diseño visual

Verificado en código, no solo por impresión visual: `melanated-editorial`
(Safari Editorial) y `minimal-grid` (Minimal Grid) declaran el mismo
`rendererId: "melanated-blocks-v1"` (`lib/designs/registry.ts:57` y `:90`).
Ese campo `rendererId` está definido en el tipo
(`lib/designs/types.ts:40`) pero no tiene ningún punto de lectura en el
resto del código — confirmado por búsqueda de todas las referencias a
`rendererId` en el repo, que solo aparecen en la declaración de tipo y en
las dos entradas del registro.

En la práctica esto significa: los dos diseños registrados pasan por los
mismos componentes de bloque, mismo grid, misma geometría — solo cambian
`brand.primary/secondary/accent/headingFontFamily/bodyFontFamily` como
sustitución de tokens. La arquitectura de contrato de diseño (compatibilidad
de secciones, selector, validación server/cliente) sí está construida para
múltiples diseños; **la capa de renderizado, no.**

Esto deja una pregunta abierta de arquitectura, no una decisión tomada:
¿un segundo diseño visual real requiere un renderer separado por diseño
(un `rendererId` que efectivamente rutee a otro árbol de componentes), o un
sistema de theming más profundo dentro del renderer único actual (grids y
tratamientos configurables, no solo color/tipografía)? Vale resolverla
recién cuando exista intención real de construir un segundo diseño de
producción — hoy es una pregunta latente, no un bloqueo de nada en curso.

## Ejes de decisión

| Brecha | Bloqueante si... | Prescindible si... |
| --- | --- | --- |
| Tipografía/logo/iconos placeholder | el documento se muestra a un cliente real | el uso sigue siendo interno/de prueba |
| Renderer único detrás de dos diseños | se planea construir un segundo diseño de producción | el catálogo de diseños se mantiene en uno solo por ahora |
| Sin modo oscuro / identidad propia del editor | el editor se usa muchas horas seguidas o se muestra como producto en sí | el editor sigue siendo herramienta interna de uso ocasional |
