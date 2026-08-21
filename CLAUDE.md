@AGENTS.md
# Melanated Safaris — Proposal Generator

## Objetivo
Construir un Proposal Studio visual que permita crear y editar proposals con
varios diseños de documento desde una sola interfaz consistente. Cada diseño
aporta sus layouts, variantes y marca; el editor aporta la navegación, canvas,
inspector, estados y flujos comunes. El sistema reemplaza el trabajo manual en
Canva sin convertir el producto en un canvas libre ni acoplarlo a una sola
plantilla.

## Plan del Proposal Studio
El plan de implementación del editor visual está en
[`docs/EDITOR_IMPLEMENTATION_PLAN.md`](docs/EDITOR_IMPLEMENTATION_PLAN.md).
La dirección aprobada es un editor visual multi-diseño inspirado en Proposify,
con layouts protegidos, editor cronológico de itinerario y catálogo contextual.
No se construirá un panel administrativo general, un canvas de posicionamiento
libre ni un editor distinto por cada diseño.

**Prioridad actual:** Fase 3 — diseño del editor y base multi-diseño. La Fase 2
está completa: todas las páginas con contenido tienen formulario persistente,
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

## Referencia visual
Las páginas del PDF original están en `reference/pdf-pages/page-NN.png`.
Representan el primer diseño de referencia, no la estructura universal de todos
los proposals futuros. El editor debe poder alojar otros diseños sin copiar o
ramificar su interfaz.
El documento original NO es consistente entre secciones (fue armado a mano
en Canva) — cuando haya conflicto entre "replicar el original exacto" y
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
- **Proposal Studio (Fase 1)**: `/proposals/[id]/editor` carga datos en el
  servidor y entrega páginas ya renderizadas al shell interactivo
  `components/editor/ProposalEditorShell.tsx`. Incluye toolbar, buscador y
  navegación de páginas, canvas con zoom, panel contextual read-only y enlace
  al preview limpio. La portada `/` redirige temporalmente a la propuesta seed
  `1`. Los botones de editar, catálogo, añadir sección y generar PDF quedan
  visibles pero deshabilitados hasta sus fases correspondientes.
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
- Fuentes custom del original (Prata, BankGothicBT, Muli, Gotham-Bold,
  PalmClubScript, Oswald, EBGaramond, etc.) — todo usa la fuente sans por
  defecto + serif/italic genérico como aproximación.
- Logo real como imagen — sigue siendo texto/emoji placeholder.
- Iconos e ilustraciones hechas a mano (pasaporte, visa, conchas, clima,
  bandera de Tanzania, triángulo de advertencia) — todo con emoji.

**Estructural:**
- La paginación de Overview/ExcursionList/TermsConditions es heurística
  (estimación de altura por caracteres), no medición real del DOM. Se
  validó visualmente contra los casos de prueba actuales (10 días, 16
  excursiones, 9 secciones de términos) sin overflow, pero con contenido
  muy distinto en longitud podría necesitar ajustar las constantes de
  presupuesto en `lib/paginate.ts` (`OVERVIEW_PAGE_BUDGET`,
  `EXCURSION_PAGE_BUDGET`, `TERMS_*_BUDGET`).
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
