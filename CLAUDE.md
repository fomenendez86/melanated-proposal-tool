@AGENTS.md
# Melanated Safaris — Proposal Generator

## Objetivo
Construir un Proposal Studio visual que permita crear y editar proposals con
varios diseños de documento desde una sola interfaz consistente. Cada diseño
aporta sus layouts, variantes y marca; el editor aporta la navegación, canvas,
inspector, estados y flujos comunes. El sistema reemplaza el armado manual de
documentos sin convertir el producto en un canvas libre ni acoplarlo a una
sola plantilla.

La dirección aprobada es un editor visual multi-diseño con layouts
protegidos, editor cronológico de itinerario y catálogo contextual. No se
construirá un panel administrativo general, un canvas de posicionamiento
libre ni un editor distinto por cada diseño.

## Estado del proyecto
**Empezar por acá antes de trabajar:**
[`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) es el changelog — qué fase
está completa, qué bloques existen, qué decisiones de diseño ya se tomaron
(no reabrir sin motivo) y qué pendientes quedan conocidos. Actualizarlo en el
mismo turno en que se construye/corrige algo, se cambia una decisión de
diseño, o se descubre un pendiente nuevo — no dejarlo para el final de la
sesión. Este archivo (`CLAUDE.md`) no lleva estado ni historial; solo reglas
y arquitectura que no cambian de una sesión a otra.

## Documentación por área
El plan de implementación del editor visual está en
[`docs/EDITOR_IMPLEMENTATION_PLAN.md`](docs/EDITOR_IMPLEMENTATION_PLAN.md).
La especificación UX y auditoría del shell está en
[`docs/EDITOR_UX_SPEC.md`](docs/EDITOR_UX_SPEC.md).
Los tokens, componentes y reglas del shell están en
[`docs/EDITOR_DESIGN_SYSTEM.md`](docs/EDITOR_DESIGN_SYSTEM.md).
La crítica de implementación y el checkpoint visual pendiente están en
[`docs/EDITOR_DESIGN_CRITIQUE.md`](docs/EDITOR_DESIGN_CRITIQUE.md).
El contrato versionado de diseños, persistencia y cambio seguro está en
[`docs/DOCUMENT_DESIGN_CONTRACT.md`](docs/DOCUMENT_DESIGN_CONTRACT.md).
El editor estructurado de itinerario y su codec compartido están en
[`docs/ITINERARY_EDITOR.md`](docs/ITINERARY_EDITOR.md).
El catálogo contextual, sus mutaciones seguras y la estrategia de media están
en [`docs/CONTEXTUAL_CATALOG.md`](docs/CONTEXTUAL_CATALOG.md).
La composición, borrado recuperable y readiness están en
[`docs/DOCUMENT_COMPOSITION.md`](docs/DOCUMENT_COMPOSITION.md).
La generación PDF, metadata y smoke test están en
[`docs/PDF_GENERATION.md`](docs/PDF_GENERATION.md).
La experiencia pública, revisiones, password/expiration y aprobación están en
[`docs/CLIENT_PROPOSAL_EXPERIENCE.md`](docs/CLIENT_PROPOSAL_EXPERIENCE.md).
La verificación de Fase 9, accesibilidad, paginación medida y el único bloqueo
de assets están en
[`docs/PHASE9_QUALITY_DEPLOYMENT.md`](docs/PHASE9_QUALITY_DEPLOYMENT.md).
El pipeline de import del paquete de marca (qué queda config-driven vs. qué
es edición de datos, y los pasos exactos para activar logo/íconos/fuentes
reales) está en
[`docs/BRAND_ASSET_PACK.md`](docs/BRAND_ASSET_PACK.md).
Deployment, health checks, backups y recuperación están en
[`docs/OPERATIONS.md`](docs/OPERATIONS.md).
El análisis competitivo, sus ejes de decisión y la sugerencia de
resecuenciación (no aprobada) están en
[`docs/COMPETITIVE_POSITIONING.md`](docs/COMPETITIVE_POSITIONING.md); el
análisis de diseño visual del documento y del editor, incluyendo el hallazgo
de que los dos diseños registrados comparten un mismo renderer, está en
[`docs/VISUAL_DESIGN_POSITIONING.md`](docs/VISUAL_DESIGN_POSITIONING.md).
El plan de expansión aprobado del estudio (Fases 10–17: edición inline en
canvas, drag & drop, pipeline multi-propuesta, plantillas/biblioteca,
variables/pricing interactivo, envío/firma, analytics y comentarios) está en
[`docs/STUDIO_EXPANSION_PLAN.md`](docs/STUDIO_EXPANSION_PLAN.md).

## Cómo mantener esta documentación (leer antes de trabajar)
- **Estado, fases, bloques construidos y decisiones ya tomadas van en
  `docs/PROJECT_STATUS.md`**, no en este archivo. `CLAUDE.md` es para reglas
  de trabajo y arquitectura que aplican siempre; `PROJECT_STATUS.md` es para
  lo que ya se hizo y lo que falta.
- **Verificar contra `reference/pdf-pages/page-NN.png` cuando haya duda de
  fidelidad visual** — antes de dar por bueno un bloque nuevo o una
  corrección de layout, comparar el render contra la página de referencia
  correspondiente (extraer coordenadas/texto exactos del PDF original con
  `pymupdf` si hace falta precisión, no solo mirar la miniatura). No hace
  falta re-verificar en cada sesión algo ya validado y sin cambios.
- Si se decide desviar del original (simplificación, estandarización,
  limitación aceptada), documentarlo en `docs/PROJECT_STATUS.md`
  ("Pendientes conocidos" o "Decisiones de diseño"), no dejarlo solo en el
  historial de chat.
- **No nombrar aplicaciones ni productos comerciales externos** en ningún
  archivo del proyecto (docs, código, comentarios) para evitar problemas de
  marcas/copyright. Describir la categoría ("editor comercial de propuestas",
  "herramienta de diseño externa") en lugar del nombre. Las librerías y
  tecnologías del stack (Next.js, Playwright, SQLite, etc.) sí se nombran.

## Referencia visual
Las páginas del PDF original están en `reference/pdf-pages/page-NN.png`.
Representan el primer diseño de referencia, no la estructura universal de todos
los proposals futuros. El editor debe poder alojar otros diseños sin copiar o
ramificar su interfaz.
El documento original NO es consistente entre secciones (fue armado a mano
en una herramienta de diseño externa) — cuando haya conflicto entre
"replicar el original exacto" y
"mantener consistencia del sistema", priorizar consistencia del sistema y
documentarlo en `docs/PROJECT_STATUS.md`.

## Arquitectura
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + Playwright + `qrcode`.
- **Separación multi-diseño obligatoria:** mantener independientes (1) el shell
  del editor, (2) la definición versionada del diseño, (3) el contenido de la
  propuesta y (4) las páginas renderizadas. El shell no debe hardcodear el
  orden, cantidad de páginas, campos ni estilos propios de Tanzania.
- **Un editor, varios diseños:** navegación, canvas, inspector, dialogs,
  accesibilidad y estados de guardado pertenecen al Proposal Studio. Tamaño de
  página, marca, bloques soportados, variantes, defaults y renderers pertenecen
  a la definición de cada diseño.
- **Contrato de diseño:** `lib/designs/types.ts` define el descriptor
  serializable y `lib/designs/registry.ts` registra identidades versionadas.
  `getProposalDesignContext.ts` resuelve selección/default y compatibilidad. La
  selección se guarda temporalmente como metadata virtual `documentDesign` en
  `proposal_sections`, se excluye del render y se cambiará a columnas explícitas
  cuando existan revisiones. `docs/DOCUMENT_DESIGN_CONTRACT.md` contiene las
  reglas completas.
- Cada bloque: componente en `components/blocks/{Nombre}Block.tsx`, tipo en
  `lib/types.ts`, ruta de preview en `app/preview/{nombre}/page.tsx`, script
  de render standalone en `lib/render/render{Nombre}.ts` + entrada
  `render:{nombre}` en `package.json`.
- Página fija: 816×1056px (Letter a 96dpi). Margen lateral estándar
  82px (`px-[82px]`). Componentes compartidos en `components/blocks/shared/`:
  `SectionHeader` (título + línea), `PageHeader` (logo centrado o solo
  "Proposal"), `PageFooter` (número de página abajo-derecha — estándar
  único del sistema), `BrandWordmark`/`BrandIcon` (logo e íconos fijos de
  sección, config-driven vía `lib/brand/config.ts` — ver
  `docs/BRAND_ASSET_PACK.md`).
- **Documento completo**: `lib/db/getProposalData.ts` transforma los registros
  de SQLite en `ProposalData` (unión discriminada `ProposalSection` en
  `lib/types.ts`). `components/ProposalRenderer.tsx` lo recorre y renderiza
  cada bloque con `break-after: page` entre secciones. El preview histórico
  sigue en `/preview/full-proposal`; el preview dinámico está en
  `/proposals/[id]/preview`. `lib/sampleProposalData.ts` queda como dataset de
  referencia/legado para previews aislados.
- **Proposal Studio**: `/proposals/[id]/editor` carga datos en el servidor y
  entrega páginas ya renderizadas al shell interactivo
  `components/editor/ProposalEditorShell.tsx` — toolbar, buscador y
  navegación de páginas, canvas con zoom (modos Continuo y Página individual),
  panel contextual (Content/Design), catálogo, composición, revisión,
  compartir y PDF. La portada `/` redirige temporalmente a la propuesta seed
  `1`.
- **Tipografía**: los bloques usan las clases Tailwind `font-serif` (títulos)
  y `font-sans` (cuerpo, default). Ninguna referencia a un nombre de fuente
  directo — `app/globals.css` resuelve `--font-serif` → `--font-heading` →
  `--font-brand-heading` con fallback a la fuente sans cargada en
  `lib/fonts.ts`. Para activar una fuente de marca real, ver
  `docs/BRAND_ASSET_PACK.md`; no agregar más de dos roles tipográficos sin
  una decisión de diseño explícita.
- **Paginación automática** (`lib/paginate.ts`): Overview, ExcursionList y
  TermsConditions usan empaquetado por altura estimada (heurística basada en
  cantidad de caracteres por línea, no medición real del DOM — es
  aproximada a propósito). DayItinerary usa una regla mecánica (día 1 solo
  con sidebar, resto en pares, sobrante solo) porque así se comporta el
  documento real, no por altura de contenido.
  `renumberSections(sections, startAt)` renumera TODA la lista al final en
  un solo paso — los bloques individuales y las funciones `paginate*` no
  necesitan adivinar el número de página final; evita bugs de numeración
  hardcodeada/duplicada (ya pasó 3 veces: Overview, ExcursionList, Hotel).
