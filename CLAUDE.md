@AGENTS.md
# Melanated Safaris — Proposal Generator

## Objetivo
Construir un Proposal Studio visual que permita crear y editar proposals con
varios diseños de documento desde una sola interfaz consistente. Cada diseño
aporta sus layouts, variantes y marca; el editor aporta la navegación, canvas,
inspector, estados y flujos comunes. El sistema reemplaza el armado manual de
documentos sin convertir el producto en un canvas libre ni acoplarlo a una
sola plantilla.

## Plan del Proposal Studio
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
La dirección aprobada es un editor visual multi-diseño con layouts protegidos, editor cronológico de itinerario y catálogo contextual.
No se construirá un panel administrativo general, un canvas de posicionamiento
libre ni un editor distinto por cada diseño.

**Prioridad actual:** la Fase 10 del plan de expansión
(edición directa en el canvas — `docs/STUDIO_EXPANSION_PLAN.md`) está
**completa (10.1–10.4)**. `lib/editor/editableRegions.ts` define regiones
editables tipadas (`data-edit-field`/`data-edit-kind`) y los 16 bloques del
diseño de referencia están anotados; click en una región selecciona la
página y cambia el inspector a Content mode. Para campos simples de
guardado automático (Cover salvo el título rotado, Details, dividers,
Thank You — 17 campos) el click abre un editor **inline directamente sobre
la página** (`InlineRegionEditor`, portado con `createPortal` dentro del
propio `[data-page-content]`, posicionado y estilizado copiando
`getBoundingClientRect()`/`getComputedStyle()` del elemento fuente) que
comparte un solo `usePageFieldDraft` con el inspector — un solo estado, dos
vistas, un solo autosave. Los 9 campos `image` de esas mismas páginas de
guardado automático abren en cambio un **popover anclado a la página**
(`ImageRegionPopover`, mismo patrón de portal/zoom que el overlay de texto)
con miniatura y URL, sobre el mismo `usePageFieldDraft` compartido; el
inspector (`EditorField`) también gana una miniatura para todo campo
`isImage`, incluyendo en páginas de guardado explícito. Las colecciones de
guardado explícito (Pricing, Hotel, itinerario, excursiones, clima,
términos, listas) siguen usando el salto al inspector de la 10.2 a
propósito, porque esas páginas son "revisar y luego guardar", no autosave.
Hover/resaltado activo, puente inverso inspector→canvas, Tab/Enter/Escape
con alcance a la página seleccionada y apertura del drawer en móvil (solo
para campos que saltan al inspector) están implementados en
`ProposalEditorShell.tsx`. Al construir el popover de imágenes se detectó y
corrigió un riesgo latente ya presente desde la 10.3: en modo Continuo, el
`IntersectionObserver` que seguía la página "más centrada" podía reasignar
la selección —y desmontar el overlay/popover abierto— si activar una región
grande requería scroll suficiente para que la página siguiente pareciera
más centrada; ahora ese observer no reasigna selección mientras un editor
inline o un popover de imagen sigue abierto. Cubierto por 11 tests e2e
nuevos entre 10.2, 10.3 y 10.4 (22/22 en desktop y mobile, verificado en
corridas separadas por proyecto). En paralelo
sigue pendiente importar el paquete de marca aprobado para cerrar el último
criterio de Fase 9. Pruebas, accesibilidad, paginación medida,
persistencia, backup, recuperación y observabilidad están completos. La Fase 8
está completa con snapshots inmutables, vista responsive, password/expiration,
eventos y aprobación por revisión. La Fase 7 está completa con generación PDF
por propuesta, descargas únicas, estados/retry, metadata y
smoke test real de 34 páginas. La Fase 6 está completa con inserción,
reordenamiento, duplicación, hide/show, borrado
recuperable, variantes y readiness review. La Fase 5 está completa con catálogo
contextual de hoteles/excursiones, filtros geográficos,
inserción segura, creación ligera, control de duplicados y edición explícita de
defaults versus overrides de propuesta. La Fase 4 está completa con un editor
travel-native de días, actividades, narrativa e imágenes, modos
expandido/condensado, reordenamiento, duplicación y warnings de paginación. La
implementación de Fase 3.4 está completa con modos Content/Design, variantes
contextuales, metadata plegable y Review, validada por Playwright en desktop y
móvil. La Fase 3.3
está completa: el diseño activo es proposal-scoped, el selector
valida compatibilidad en cliente y servidor, la geometría viene del contrato y
Safari Editorial/Minimal Grid prueban el registro versionado. La Fase 3.2 está
completa: el shell usa tokens semánticos y primitivas comunes
para botones, encabezados, avisos, campos, secciones, controles segmentados,
page cards, badges, drawers y empty states. La Fase 3.1 de especificación UX
está completa. La Fase 2 está completa: todas las
páginas con contenido tienen formulario persistente,
incluyendo From Owners, Important Items, overrides visuales de hotel y un único
editor de itinerario compartido por Overview y Day Itinerary.

## Cómo mantener este archivo (leer antes de trabajar)
- **Actualizar esta sección de estado en cada paso relevante** — cuando se
  construye/corrige un bloque, se cambia una decisión de diseño, o se
  descubre un pendiente nuevo, reflejarlo acá en el mismo turno, no al
  final de la sesión. Este archivo registra el estado técnico y las restricciones;
  `docs/EDITOR_IMPLEMENTATION_PLAN.md` es la fuente de verdad del objetivo y
  orden del roadmap.
- **Verificar contra `reference/pdf-pages/page-NN.png` cuando haya duda de
  fidelidad visual** — antes de dar por bueno un bloque nuevo o una
  corrección de layout, comparar el render contra la página de referencia
  correspondiente (extraer coordenadas/texto exactos del PDF original con
  `pymupdf` si hace falta precisión, no solo mirar la miniatura). No hace
  falta re-verificar en cada sesión algo ya validado y sin cambios.
- Si se decide desviar del original (simplificación, estandarización,
  limitación aceptada), documentarlo en "Pendientes conocidos" o
  "Decisiones de diseño", no dejarlo solo en el historial de chat.
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
documentarlo acá.

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
- **Contrato de diseño (Fase 3.3):** `lib/designs/types.ts` define el descriptor
  serializable y `lib/designs/registry.ts` registra identidades versionadas.
  `getProposalDesignContext.ts` resuelve selección/default y compatibilidad. La
  selección se guarda temporalmente como metadata virtual `documentDesign` en
  `proposal_sections`, se excluye del render y se cambiará a columnas explícitas
  cuando existan revisiones. `DOCUMENT_DESIGN_CONTRACT.md` contiene las reglas.
- Cada bloque: componente en `components/blocks/{Nombre}Block.tsx`, tipo en
  `lib/types.ts`, ruta de preview en `app/preview/{nombre}/page.tsx`, script
  de render standalone en `lib/render/render{Nombre}.ts` + entrada
  `render:{nombre}` en `package.json`.
- Página fija: 816×1056px (Letter a 96dpi). Margen lateral estándar
  82px (`px-[82px]`). Componentes compartidos en `components/blocks/shared/`:
  `SectionHeader` (título + línea), `PageHeader` (logo centrado o solo
  "Proposal"), `PageFooter` (número de página abajo-derecha — estándar
  único del sistema, ver más abajo).
- **Documento completo**: `lib/db/getProposalData.ts` transforma los registros
  de SQLite en `ProposalData` (unión discriminada `ProposalSection` en
  `lib/types.ts`). `components/ProposalRenderer.tsx` lo recorre y renderiza
  cada bloque con `break-after: page` entre secciones. El preview histórico
  sigue en `/preview/full-proposal`; el preview dinámico está en
  `/proposals/[id]/preview`. `lib/sampleProposalData.ts` queda como dataset de
  referencia/legado para previews aislados.
- **Proposal Studio (Fases 1–9)**: `/proposals/[id]/editor` carga datos en el
  servidor y entrega páginas ya renderizadas al shell interactivo
  `components/editor/ProposalEditorShell.tsx`. Incluye toolbar, buscador y
  navegación de páginas, canvas con zoom, panel contextual read-only y enlace
  al preview limpio. La portada `/` redirige temporalmente a la propuesta seed
  `1`. Edición, catálogo, composición, revisión, compartir y PDF están activos.
- **Quality pass (Fase 1.1)**: el canvas calcula “fit to page” con
  `ResizeObserver`; páginas y propiedades se convierten en drawers en pantallas
  pequeñas; controles táctiles usan objetivos cercanos a 44px; hay foco visible,
  navegación con PageUp/PageDown y cierre con Escape. La lista usa miniaturas
  reales, descripciones para distinguir páginas repetidas y estados neutrales
  basados en render (“Loaded/Rendered”), sin exponer fases internas al usuario.
  La portada demo usa `public/proposal-assets/cover-zebras-v1.png`, derivada de
  la referencia visual de la pág. 1, en lugar del placeholder de Picsum.
- **Navegación continua (Fase 1.2)**: el editor muestra el documento
  completo en una columna vertical con scroll nativo. La página visible se
  sincroniza con miniaturas, contador y propiedades mediante
  `IntersectionObserver`; miniaturas, anterior/siguiente y PageUp/PageDown
  desplazan a la página elegida. Se conservan los modos Continuo y Página
  individual, con ajuste de ancho o página según corresponda.
- **Edición estructurada (Fase 2.1)**: Portada y Detalles tienen formularios
  contextuales reales en el panel de propiedades. `getProposalEditorData.ts`
  construye los campos editables; `app/proposals/[id]/editor/actions.ts` valida
  una allowlist por tipo y persiste propuesta/cliente dentro de una transacción.
  El cliente ofrece autosave con debounce, guardado al salir del formulario,
  botón manual, estados Loaded/Unsaved/Saving/Saved/Error y refresca editor y
  preview desde los datos canónicos. No se escriben registros compartidos del
  catálogo desde estos formularios.
- **Overrides seguros (Fase 2.2)**: cada página derivada de
  `proposal_sections` conserva `editorSource` (section/ref id) incluso después
  de paginar. Ya se editan reservas de hotel, importes/moneda/intro de pricing,
  dividers triangulares y de imagen, introducción de tours y cierre. Las actions
  verifican que booking/sección pertenecen a la propuesta; los campos visuales
  se guardan en el payload privado de la sección y nunca pisan el hotel/ciudad
  del catálogo. El render de pricing respeta el código de moneda guardado.
- **Colecciones proposal-scoped (Fase 2.3A)**: Inclusiones/Exclusiones se editan
  por columna con formato `[Heading]` + líneas, y el calendario de pagos usa
  `Label | Value`. Ambos requieren guardado explícito, se validan antes de
  escribir y reemplazan padres/hijos dentro de una transacción. Si el formulario
  está dirty, cambiar de página o cerrar el drawer pide confirmación; el scroll
  continuo no cambia la selección hasta guardar o descartar.
- **Snapshots privados (Fase 2.3B)**: Excursiones, clima y términos tienen
  editores de colección con guardado explícito y parsers server-side. El primer
  guardado copia el contenido renderizado al payload de la sección de la
  propuesta; desde ese momento no depende de cambios futuros en catálogos o
  plantillas globales. La recarga reconstruye un solo formulario aunque la
  colección ocupe varias páginas, y la selección tolera cambios de paginación.
- **Cobertura estática completa (Fase 2.3C)**: From Owners guarda mensaje,
  firmas y foto en una sección virtual privada; Important Items guarda un
  snapshot de requisitos; Hotel combina reserva con nombre, descripción e
  imágenes proposal-scoped. Ningún formulario modifica company, destination,
  requirement ni hotel catalog.
- **Formulario canónico de itinerario (Fase 2.4)**: Overview y Day Itinerary
  muestran el mismo editor explícito de días, fechas, subtítulos, highlights,
  actividades, párrafos e imágenes. El guardado reemplaza el grafo relacional
  completo dentro de una transacción y repagina ambos tipos de bloque.
- **Paginación automática** (`lib/paginate.ts`): Overview, ExcursionList y
  TermsConditions usan empaquetado por altura estimada (heurística basada en
  cantidad de caracteres por línea, no medición real del DOM — es
  aproximada a propósito, ver "Pendientes"). DayItinerary usa una regla
  mecánica (día 1 solo con sidebar, resto en pares, sobrante solo) porque
  así se comporta el documento real, no por altura de contenido.
  `renumberSections(sections, startAt)` renumera TODA la lista al final en
  un solo paso — los bloques individuales y las funciones `paginate*` no
  necesitan adivinar el número de página final, evita bugs de numeración
  hardcodeada/duplicada (ya pasó 3 veces: Overview, ExcursionList, Hotel).

## Bloques construidos (19 total, todos validados contra su página de referencia)
Texto simple: `OverviewBlock`(pág.4-5), `FromOwnersBlock`(pág.2),
`DetailsBlock`(pág.3), `TwoColumnListBlock`(pág.30-31, compartido
Inclusions/Exclusions), `PricingBlock`(pág.32), `TermsConditionsBlock`(pág.35-38).

Con fotos/decoración: `ExcursionListBlock`(pág.22-25), `HotelBlock`(pág.8,10,12),
`SectionDividerBlock`(pág.20, variante Excursions: barra verde+línea
amarilla+rectángulo rojo), `TriangleDividerBlock`(pág.6-7,9,11,13, variante
navy-triangle reusada para dividers de hotel Y de itinerario — geometría vía
`clip-path`/`rotate-45`, no path vectorial exacto), `CityToursDividerBlock`
(pág.21,26, "Tours & Excursions" por ciudad), `DayItineraryBlock`(pág.14-19),
`ImportantItemsBlock`(pág.33, incluye QR real generado server-side con
`qrcode`), `WeatherBlock`(pág.34), `ThankYouBlock`(pág.39), `CoverBlock`
(pág.1, efecto papel rasgado vía `clip-path` polygon).

## Decisiones de diseño ya tomadas
- **Footer de página:** estandarizado abajo a la derecha en TODOS los
  bloques, vía `PageFooter`. El original tiene posiciones inconsistentes
  (Overview=centrado arriba, Divider=arriba-izquierda, Hotel/Excursion=
  abajo-derecha) — no replicar eso, usar siempre `PageFooter`.
- **Hoteles:** `HotelBlock` para la página de detalle (2 fotos + info) Y
  `TriangleDividerBlock` para la página-título de cada hotel (foto grande +
  nombre). Son dos componentes separados, no uno solo — decisión revertida
  respecto a lo que se pensaba al principio (ver historial); el original sí
  usa dos plantillas visualmente distintas para esto y tiene sentido
  mantenerlas separadas en el sistema también.
- **Dos variantes de "section divider"** coexisten a propósito:
  `SectionDividerBlock` (Excursions: geometría verde/amarilla/roja) y
  `TriangleDividerBlock` (Accommodations/Itinerary: triángulo navy). No se
  unificaron en un solo componente parametrizable — la geometría es
  suficientemente distinta como para que forzar un solo componente
  complicara más de lo que ahorra.
- **Iconos/ilustraciones/logo:** todo con emoji o texto plano por ahora
  (sin assets custom todavía). Nota: los emoji de bandera compuestos
  (🇹🇿) no renderizan en Chromium headless — usar emoji de un solo
  codepoint (🌍, etc.) en su lugar.

## Pendientes conocidos
**Fidelidad visual (deferred desde el inicio del proyecto):**
- La portada deja una `E` sola al envolver el subtítulo estrecho en el PDF
  dinámico; corregir ancho/copy-fitting durante la Fase 9.
- Fuentes custom del original (Prata, BankGothicBT, Muli, Gotham-Bold,
  PalmClubScript, Oswald, EBGaramond, etc.) — todo usa la fuente sans por
  defecto + serif/italic genérico como aproximación.
- Logo real como imagen — sigue siendo texto/emoji placeholder.
- Iconos e ilustraciones hechas a mano (pasaporte, visa, conchas, clima,
  bandera de Tanzania, triángulo de advertencia) — todo con emoji.

**Estructural:**
- Overview/ExcursionList/TermsConditions se dividen primero con presupuestos
  heurísticos y después se verifican con medición DOM real en Review, PDF y
  Playwright. El caso seed de 10 días, 16 excursiones y 9 secciones de términos
  genera 34 páginas sin texto fuera del área imprimible.
- `DayItineraryBlock` usa un orden fijo (título→imágenes→texto) para ambas
  columnas cuando hay 2 días por página; el original alterna el orden según
  el espacio disponible por columna — no replicado.
- `ExcursionItem.price` es un string simple; el formato con calificador
  arriba del precio (ej. "per helicopter; max. 6 pax" antes de "$13,000",
  pág. 25) se resolvió concatenando todo en un solo string, no como campo
  separado.
- `sampleProposalData.ts` es representativo (32 páginas: 2 hoteles, no 3;
  Arusha únicamente, falta Karatu) — el mecanismo de ensamblado ya soporta
  agregar más secciones, solo falta cargarlas.

**Proposal Studio pendiente:**
- La cobertura de formularios del documento está completa. El siguiente trabajo
  es la Fase 3: especificación UX, sistema visual reutilizable, estados completos
  del shell y contrato multi-diseño. El timeline visual avanzado del itinerario,
  catálogo contextual, composición/reordenamiento y generación PDF permanecen
  en fases posteriores. El orden y criterios están en
  `docs/EDITOR_IMPLEMENTATION_PLAN.md`.
