# Project status

This file is the changelog/status log: what has been built, what was
decided and why, and what remains open. `CLAUDE.md` stays reserved for
durable rules and architecture an agent needs on every session — update
this file, not `CLAUDE.md`, when a phase finishes, a design decision gets
made, or a new pendiente is found.

## Estado general

**Chrome de la app pasado a full-bleed, se saca el look de "ventana
flotante" (2026-08-26), a pedido explícito del usuario.** El reskin
Broadsheet había envuelto el chrome (`AppShell.tsx`, `app/login/page.tsx`)
en una tarjeta centrada con margen, `max-w`, esquinas redondeadas, borde y
sombra (clase `.app-window` en `app/globals.css`) — quedaba como una
ventana de escritorio flotando sobre un fondo con textura
(`body::before`). El usuario la vio corriendo y pidió eliminarla: la app
debe ocupar el viewport completo, no aparentar una ventana. Se sacó
`.app-window` y el `body::before` decorativo (ya no tenía nada detrás que
decorar) de `app/globals.css`, y se quitaron `mx-auto`/`max-w-*`/
`border`/`rounded-editor-lg`/sombra/padding externo de `AppShell.tsx` y
`app/login/page.tsx`, conservando el layout interno (rail + columna de
contenido con scroll propio en `AppShell`, split-screen en login) y el
comportamiento de impresión. Verificado con capturas de Playwright en
`/login` y el dashboard tras iniciar sesión — ambos llenan el viewport
sin margen ni tarjeta. `tsc --noEmit` limpio.

**Pasada de revisión visual sobre el reskin Broadsheet (2026-08-25),
a pedido explícito del usuario tras verlo corriendo.** Recorrido con
Playwright por login, dashboard, toolbar del editor, panel Properties
(tabs Content/Design), Review, Activity, Document Structure, Catalog
(los 4 modos), templates, itinerarios, notificaciones y el editor en
mobile — capturas reales, no solo lectura de código. Un hallazgo real,
corregido:

- **`--editor-inset` tenía un tinte cyan (`--color-accent-100`) que no
  encajaba con todos sus usos.** Elegido originalmente pensando solo en
  el caso "hover de drag handle", pero el token ya se documentaba (y se
  usa de hecho) como superficie neutra multi-propósito: círculos
  numerados en Document Structure, ícono del tab Design en Properties,
  chip de `EditorEmptyState`, fondo neutral de `EditorStatusBadge`. Con
  el tinte cyan, esos elementos pasivos (un simple número de secuencia)
  leían como "resaltados/activos" sin motivo — confirmado visualmente
  con una captura ampliada (@3x) antes y después. Revertido a
  neutral-200 de Broadsheet (`#eae7e7`), restaurando el carácter sutil
  que el token ya tenía antes del reskin. `docs/EDITOR_DESIGN_SYSTEM.md`
  actualizado con la corrección y el porqué.
- **Efecto colateral encontrado y corregido en el mismo paso:**
  `app/proposals/notifications/page.tsx` reusaba `bg-editor-inset` para
  resaltar la fila de una notificación no leída — con el token ahora
  neutral, ese resaltado dejó de leerse (fondo casi idéntico al de la
  página). Corregido con un tinte dedicado `bg-editor-brand/10` en vez
  de reusar el token compartido — el caso "no leído" es genuinamente una
  señal de atención, no una superficie neutra, así que necesitaba su
  propio color en vez de heredar el de `editor-inset`.
- Sin otros hallazgos — el resto del reskin (tipografía, paleta,
  radio, íconos duotone en tamaños grandes/medianos) sostuvo bien la
  revisión visual en las 12 superficies recorridas. Nota aparte, no un
  bug: los íconos duotone en filas de acciones muy chicas (14–19px,
  `Document Structure`, tarjetas de itinerario) se ven visualmente casi
  idénticos a un ícono "regular" — confirmado leyendo el SVG renderizado
  en vivo que el peso duotone sí se aplica correctamente (el segundo
  tono existe, solo que a esa escala y en `currentColor` monocromático
  la diferencia de opacidad es casi imperceptible) — es una
  característica inherente del estilo a tamaños chicos, no una falla de
  implementación; se deja como está porque coincide con cómo Broadsheet
  documenta su propio set de íconos "a tamaños de interfaz."
- Verificación: `tsc --noEmit` y `eslint` limpios tras el ajuste.

**Reskin "Broadsheet" del chrome del editor (2026-08-25).** A partir del
comparativo visual aprobado en la pasada anterior, el usuario eligió
"Broadsheet" — el sistema de diseño del mockup importado vía Claude
Design (proyecto `ac657a46-6fb1-4d99-beae-f604b67b49e0`,
`_ds/broadsheet-.../styles.css` + `readme.md`) — como dirección real para
todo el chrome de Proposal Studio (toolbar, paneles, dashboard, login), no
solo la porción mostrada en el comparativo. Los nombres de los 29 tokens
`--editor-*` no cambiaron — solo sus valores, mapeados 1:1 desde los tokens
de Broadsheet — así que **cero archivos de color hardcodeado necesitaron
edición** (confirmado por auditoría previa: 0 hex/rgb en
`components/editor|dashboard|app`). Detalle completo del mapeo y las
decisiones de scope en `docs/EDITOR_DESIGN_SYSTEM.md` (reescrito). Resumen:

- **Tipografía**: Source Serif 4 vía `next/font/google` (nuevo
  `lib/fonts.ts`), aplicada como `font-editor` (token nuevo, namespace
  separado de `--font-heading`/`--font-brand-heading` que sigue siendo del
  documento renderizado) en los 3 roots del chrome (`AppShell.tsx`,
  `ProposalEditorShell.tsx`, `app/login/page.tsx`). Cubre todo el texto del
  chrome, no solo títulos — regla explícita del readme de Broadsheet ("the
  serif is the chrome").
- **Íconos**: migración completa de `lucide-react` a `@phosphor-icons/react`
  en peso **duotone** (regla explícita de Broadsheet), 65 íconos únicos en
  23 archivos. `IconContext.Provider` envuelve `AppShell.tsx` y
  `ProposalEditorShell.tsx` (los únicos 2 roots que pueden alojar un
  Context Provider) para que el peso se herede automático sin tocar cada
  call site. Dos archivos (`EditorUi.tsx`, `ApplicationRail.tsx`) pasaron a
  `"use client"` específicamente para poder usar el import normal
  (dependiente de contexto) en vez de la variante `/ssr`; `app/login/page.tsx`
  es un Server Component `async` que no puede convertirse, así que usa
  `@phosphor-icons/react/ssr` (variante sin hooks) con `weight="duotone"`
  explícito en sus 4 íconos. `sectionTypeIcons.tsx` no necesitó ningún
  cambio de directiva — solo exporta referencias, nunca renderiza.
- **Radio**: escala nueva y separada `--radius-editor-sm/md/lg` (1/2/4px) en
  `@theme inline`, **sin tocar** `--radius`/`--radius-sm..4xl` global (ese
  alimenta todo `rounded-*` de la app entera, incluyendo los bloques del
  documento — verificado leyendo `app/globals.css` antes de tocar nada).
  Codemod mecánico de ~150 usos de `rounded-{lg,xl,2xl,md}` en los ~25
  archivos del chrome; `rounded-full` quedó intacto en todos lados.
- **Modo oscuro — removido, no ocultado.** Broadsheet es explícitamente
  light-only ("this system shows no dark surfaces", su propio readme).
  Se sacó el toggle completo de `ProposalEditorShell.tsx` (estado,
  persistencia a `localStorage`, atributo `data-theme`) y se borró el
  bloque `.proposal-studio[data-theme="dark"]` de `app/globals.css`. Es una
  regresión real y deliberada de una feature que funcionaba — documentado
  acá y en `docs/EDITOR_DESIGN_SYSTEM.md` a propósito, no en un bullet
  perdido.
- **Fuera de alcance, a propósito**: los colores de estado
  (success/warning/danger, 8 tokens) quedaron en sus valores previos —
  Broadsheet no define paleta semántica y fabricar una que solo se
  pareciera a su método OKLCH hubiera sido inventar, no extraer. La escala
  de espaciado (`--space-*` de Broadsheet, densidad 1.25×, notablemente más
  aireada que el `p-4`/`gap-2` actual) quedó documentada pero sin
  implementar — retocarla toca layout real, no solo decoración, y necesita
  su propia pasada de verificación visual por panel.
- **Bug real encontrado y corregido, no relacionado al diseño en sí:**
  `npm run test:e2e` aísla las fuentes de Google vía
  `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` → `tests/fixtures/google-fonts.cjs`
  (un mapa URL→CSS, sin red real). Agregar Source Serif 4 sin agregar su
  entrada rompía **toda la suite** — ni siquiera `global-setup.ts` podía
  loguearse, porque la página de login no compilaba bajo Turbopack
  (`Missing mocked response`/`Module not found` en el font loader). La URL
  exacta no es adivinable a mano con confianza (Next arma el query string
  desde los ejes variables del font-data.json — para Source Serif 4 resultó
  `.../css2?family=Source+Serif+4:wght@200..900&display=swap`); se calculó
  llamando directo a las funciones internas de Next
  (`validateGoogleFontFunctionCall`/`getFontAxes`/`getGoogleFontsUrl`) en
  vez de adivinar, y se agregó la entrada faltante al fixture.
- **Verificación**: `tsc --noEmit` y `eslint` limpios en todo el repo.
  Verificado en navegador real (Playwright manual, no solo e2e) contra
  `npm run dev`: login, dashboard, toolbar del editor, panel Properties,
  pestaña Blocks del Catalog — cero errores de consola, toggle de modo
  oscuro confirmado ausente, `font-family` computado confirma Source Serif 4
  cargada. Suite e2e completa corrida tras el fix del fixture de fuentes
  (ver arriba): 40 passed, 5 failed — pero el set de 5 **no coincide** con
  los 6 preexistentes ya documentados (solo 2 se solapan). Investigado antes
  de asumir regresión: los 5 tests fallidos, corridos de nuevo en
  aislamiento (grep de Playwright, base de datos e2e fresca), **pasan
  los 5 sin excepción** — confirma que son flakiness preexistente
  dependiente del orden/estado compartido entre tests dentro de una corrida
  completa (mismo patrón ya visto y documentado antes en este archivo:
  "4 tests de editor.spec.ts fallaban de forma intermitente en mobile"), no
  algo introducido por este reskin. Ninguno de los 5 toca color/tipografía/
  íconos/radio — son sobre upload de imágenes, edición inline y el drawer
  de catálogo en mobile, áreas que este cambio no tocó funcionalmente.

**Paleta de inserción unificada + pulido visual del drop-zone (2026-08-25).**
El usuario mostró una captura de un editor de documentos comercial distinto
(no nombrado, por la regla de `CLAUDE.md`) y pidió adoptar su concepto de
panel de inserción: una grilla de tarjetas ícono+label arrastrables, un
indicador de drop punteado con badge "+", y un panel con pestañas. Alcance
confirmado con el usuario vía pregunta explícita: **ambas mitades** — (A)
unificar las superficies de inserción existentes en una sola paleta de
tarjetas, y (B) rediseñar el feedback visual de drag/drop. El canvas de
posicionamiento libre quedó descartado desde el inicio — `CLAUDE.md` prohíbe
esa dirección; todo sigue insertándose solo en los límites de sección
(`InsertionGap`), nunca en un punto arbitrario.

- **Unificación (A)**: los 4 tipos de bloque plantilla de `ADDABLE_SECTIONS`
  (`lib/editor/addableSections.ts` — divisor con imagen, divisor editorial,
  thank-you, firma), antes alcanzables solo desde el menú de texto propio de
  `InsertionGap`, ahora también viven como una pestaña "Blocks" nueva dentro
  del drawer `CatalogPanel` ya existente (junto a Hotels/Excursions/Library),
  renderizados como tarjetas ícono+label (`components/editor/BlocksPalette.tsx`,
  nuevo) arrastrables por el mismo mecanismo que hoteles/excursiones/library.
  `CatalogDragItem` (`useCatalogDragInsert.ts`) pasó de interfaz plana a
  unión discriminada agregando `{ kind: "template"; sectionType; label }`;
  el drop ejecuta `addProposalSection` igual que el click en `InsertionGap`.
  Hoteles/Excursiones se dejaron **sin tocar** como lista buscable — son
  registros de datos específicos, no tipos de bloque genéricos, misma
  distinción que ya hacía el sistema. El menú propio de `InsertionGap` se
  mantuvo intacto a propósito (Fase 11 exige que el drag nunca sea el único
  camino, y a menos de `2xl:` el Catalog sigue siendo modal) — solo ganó
  íconos, mismo mapa `components/editor/sectionTypeIcons.tsx` (nuevo) que
  usan la paleta y el ghost de drag, para que las tres superficies de
  inserción lean como un solo lenguaje visual.
- **Pulido visual (B)**: `InsertionGap` cambió su indicador resaltado de una
  línea sólida a una línea punteada (`border-dashed`) con una píldora
  "Drop here"; el ghost flotante de drag (`ProposalEditorShell.tsx`, portal a
  `document.body`) pasó de un pill con ícono a una tarjeta con chip de ícono
  y un badge "+" en la esquina, cubriendo ahora los 4 kinds de
  `CatalogDragItem`. Ambos ríos con tokens `editor-*` únicamente — sin fuga
  hacia `--design-*`. Verificado visualmente en un servidor real (Playwright
  manual, no solo e2e) en modo claro y oscuro.
- **Regresión evitada, no introducida**: TypeScript no angosta una unión
  discriminada correctamente cuando el miembro no-target tiene el
  discriminante como unión de 3 literales y se lo excluye por 3
  comparaciones negativas encadenadas (`item.kind === "hotel" ? ... : item.kind
  === "excursion" ? ... : item.kind === "savedSection" ? ... : item.sectionType`
  falla a compilar) — confirmado con un caso aislado mínimo. Se resolvió
  chequeando el nuevo miembro (`"template"`) primero en la cadena de
  ternarios, en `useCatalogDragInsert.ts` y en el ghost de
  `ProposalEditorShell.tsx`.
- **Docs actualizados en el mismo cambio**: `docs/CONTEXTUAL_CATALOG.md`
  (nueva sección "Blocks mode"), `docs/EDITOR_DESIGN_SYSTEM.md` (entradas
  "Palette card" y "Drag ghost and drop indicator" en Components),
  `docs/STUDIO_EXPANSION_PLAN.md` (Fase 11.2 ampliada para mencionar
  `insertLibrarySection`/`addProposalSection`, ya estaba desactualizada
  antes de este cambio).
- **Verificación**: `tsc --noEmit` y `eslint` limpios. Un test e2e nuevo
  (`tests/e2e/editor.spec.ts` — "dragging a block card from the Catalog
  panel's Blocks tab...") cubre arrastrar una tarjeta Blocks hasta un gap
  exacto y que persista tras reload, calcado del test existente de arrastrar
  un hotel. Suite completa corrida dos veces: la primera corrida (con un
  `npm run dev` manual compitiendo por CPU en paralelo, para la
  verificación visual) mostró 6 fallos; la segunda corrida aislada mostró
  los **mismos 6 fallos exactos**, y una tercera corrida de esos 6 tests
  contra el commit base sin este cambio (vía `git stash`) los reprodujo
  **idénticos** — confirmando que son preexistentes y no relacionados
  (`dashboard.spec.ts` duplicar/archivar, `auth.spec.ts` logout en mobile,
  y el contrato `data-edit-kind` de `editor.spec.ts` esperando
  `"text"|"multiline"|"image"` pero recibiendo `"collection"` en desktop y
  mobile). **No corregidos a propósito** — fuera del alcance de este
  cambio; quedan como pendiente conocido, ver más abajo.

**Biblioteca de Itinerarios — Fase 2, cierre de los pendientes dejados
explícitamente afuera de la Fase 1 (2026-08-25).** A pedido del usuario
("termina el resto"), se completaron los 4 puntos que habían quedado
fuera de la Fase 1 a propósito:

- **Reordenar hoteles/excursiones/vuelos/transporte dentro de un
  itinerario**: botones mover arriba/abajo en los 4 paneles del editor de
  itinerario, mismo patrón swap-y-renormalizar que ya usa
  `moveProposalSection` (`app/proposals/itineraries/[id]/actions.ts`,
  helper genérico `moveScopedRow` + `visibleForTier`). El reordenamiento
  es por tier visible (compartido + el tier activo), no global — mover
  bajo un tier no descoloca el orden que ven otros tiers. **Bug real
  encontrado al implementar esto**: `copyItineraryGraphInto.ts` copiaba
  hoteles/excursiones sin `orderBy(sortOrder)` — el reordenamiento se
  hubiera guardado en la base pero nunca se hubiera reflejado en la
  propuesta generada. Corregido agregando el `orderBy` que faltaba
  (vuelos/transporte ya lo hacían bien vía `.sort()` antes de insertar).
- **Panel de excursiones en el editor de itinerario**: nuevo
  `ExcursionsPanel` en `ItineraryEditorShell.tsx`, calco exacto de
  `HotelsPanel` (mismo picker de catálogo, mismo scope compartido/tier,
  mismo reordenamiento). El esquema y las server actions ya existían
  desde la Fase 1, solo faltaba la UI.
- **Páginas de documento dedicadas para vuelos/transporte**: se agregaron
  tablas nuevas `proposal_flights`/`proposal_transport` (migración
  `0008_slow_shocker.sql`, mismo shape que `itinerary_flights`/
  `itinerary_transport` pero sin `tierId`, escopeadas a `proposalId`),
  dos tipos de sección nuevos `flightDetails`/`transportDetails`
  (`lib/types.ts`, `lib/designs/registry.ts::ALL_SECTION_TYPES` — al
  estar en `ALL_SECTION_TYPES` los heredan automáticamente los 3 diseños
  registrados, sin romper la regla de versionado porque
  `supportedSectionTypes` es solo una señal de compatibilidad para los
  pickers, no lo que gatea qué puede renderizar cada switch de renderer)
  y bloques de documento reales en **ambos** diseños
  (`components/blocks/{FlightDetailsBlock,TransportDetailsBlock}.tsx` y
  sus pares en `components/blocks/minimal-grid/`, registrados en
  `melanatedBlocksV1.tsx`/`minimalGridV1.tsx`). Cada tipo es una sola
  página que lista todos los tramos del proposal (mismo patrón que
  `importantItems`/`weather`: agregación, no una página por fila).
  `copyItineraryGraphInto.ts` ahora copia los tramos a las tablas reales
  (no más prosa serializada en Incluye/No incluye) y **crea la fila
  `proposalSections` él mismo** cuando hay al menos un tramo — la única
  excepción a "la propuesta nueva arranca con composición vacía", porque
  a propósito no se construyó un picker manual para insertar estas
  páginas (no hay catálogo de vuelos/transporte con qué poblar uno).
  **Decisión de alcance explícita**: estas páginas son de **solo
  vista/revisión**, sin `editableRegion` — el panel Properties del editor
  ya maneja esto con gracia sola (mensaje "Preview only — This page is
  available for review but has no editable fields", verificado en vivo,
  no hubo que construir nada para ese estado). Editar contenido de
  vuelos/transporte de una propuesta ya generada se hace todavía desde el
  itinerario de origen, no desde la propuesta.
- **Workstream 2, parte 1 (CSS-vars) completa.** Los 18 bloques de
  Safari Editorial que hardcodeaban `text-black`/
  `border-black`/`bg-black` (`CoverBlock.tsx` ya tenía 1 uso de
  antes) ahora usan `[var(--design-primary,#1c202b)]` con el hex actual
  como fallback — mecánico, mismo patrón ya validado por `CoverBlock` y
  por los bloques de Minimal Grid. **Alcance recortado a propósito
  durante la implementación**: el plan original decía "llevar las
  variables a los 16 bloques", pero solo existen vars para
  `primary/secondary/accent` (colores de marca), no para
  `surface`/`text` neutro — así que **solo se tocó texto/borde/fondo que
  ya actuaba como "color de tinta principal"** (`text-black`,
  `border-black`, barras `bg-black` de acento). Los `text-neutral-600/700`
  (texto gris atenuado) se dejaron intactos a propósito: el secondary de
  Safari Editorial es `#566b4d` (verde oliva, un color de marca, no un
  gris neutro) — mapearlo ahí hubiera sido un cambio visual real y
  notorio, no el "cero cambio visual" que pedía el plan. Verificado sin
  regresión visual contra la propuesta seed real.

**Workstream 2, parte 2 (layouts compartidos por tipo de bloque) —
completa, con el alcance recortado a Hotel + Overview.** A pedido
explícito del usuario tras la pausa de confirmación. Al leer los 3
candidatos del plan en detalle (no solo el resumen del research previo)
se encontró que **Cover no es un buen candidato**: Safari Editorial usa
posicionamiento absoluto con texto rotado verticalmente
(`[writing-mode:vertical-rl]`) y un `clip-path` de borde irregular;
Minimal Grid usa un flex horizontal simple sin rotación — casi nada del
layout interno es realmente compartido más allá del tamaño del wrapper,
así que extraerlo hubiera dado un shell casi vacío con puro overhead de
indirección, sin ahorrar boilerplate real. Se dejó **Cover sin tocar** y
se hizo el piloto solo con los otros 2:
- `components/blocks/shared/layouts/HotelBlockLayout.tsx` — dueño del
  grid de 2 columnas, las 6 llamadas a `editableRegion()` en orden fijo,
  y el `PageFooter`. Cada diseño pasa su propio `header` (arreglo
  PageHeader/SectionHeader, que difiere en orden y margen entre los dos),
  un `imageWrap` opcional (Minimal Grid envuelve cada imagen en un marco
  con borde; Safari Editorial no envuelve nada), y tokens de clase por
  campo. **Bug evitado durante la extracción, no introducido**: el
  original tenía `roomCategory` con `mt-2`/`mt-3` pero `mealPlan` sin
  margen (para no duplicar espacio) — un primer borrador del layout
  compartido colapsaba ambos en un solo `fieldClassName`, lo que hubiera
  agregado margen de más a Meal Plan; corregido con
  `roomCategoryClassName`/`mealPlanClassName` separados antes de
  verificar visualmente.
- `components/blocks/shared/layouts/OverviewBlockLayout.tsx` — dueño del
  wrapper, el único `editableRegion("itinerarySnapshotText")`, y la
  iteración de días. El markup por día/actividad queda como render-prop
  (`renderDay`) porque genuinamente difiere entre diseños (Safari
  Editorial: "Day N:" + prefijo "- ", sin separador; Minimal Grid:
  "Day N" + línea divisoria entre días, hora en negrita) — forzarlo a una
  sola forma hubiera sido el mismo error que se evitó con Cover.
- `HotelBlock.tsx`/`OverviewBlock.tsx` en ambos diseños (`components/blocks/`
  y `components/blocks/minimal-grid/`) ahora son ~25-30 líneas de
  configuración (tokens de tema) en vez de 45-60 líneas de JSX
  duplicado. **Verificado sin regresión visual** contra la propuesta seed
  real, en los dos diseños (capturas de Overview y Hotel en Safari
  Editorial y Minimal Grid, cambiando el diseño activo en la base
  temporalmente y revirtiendo después) y contra la generación de PDF real
  (`GET /api/proposals/1/pdf`, 200 OK, 6.1MB, 45 páginas, header
  `%PDF` válido).

**Biblioteca de Itinerarios (2026-08-25) — nueva funcionalidad, Fase 1
completa.** El usuario pidió poder crear itinerarios reutilizables,
independientes del diseño de documento y del cliente, con variaciones por
Tier (ej. Classic/Premium), y recién después "generar" un documento real
para personalizar/descargar/enviar — al estilo elegir una plantilla y
llenarla, no al revés. Investigado con 3 agentes de exploración + 1 de
diseño antes de implementar (ver el plan completo en
`C:\Users\fomen\.claude\plans\el-objetivo-es-que-modular-lollipop.md`).
Decisiones confirmadas con el usuario: los Tiers comparten el mismo plan
día a día (los días son la única fuente de verdad, nunca varían por tier)
— solo hotel(es)/vuelo(s)/transporte y precio varían por tier; vuelos y
transporte NO tienen catálogo global reutilizable (a diferencia de
hoteles/excursiones), son estructurados por itinerario; en el documento
generado, vuelos/transporte se vuelcan como texto en Incluye/No incluye
por ahora (sin bloques de página dedicados) — decisión explícita para no
construir ~17 componentes de bloque × 2 diseños en esta pasada.

- **Esquema nuevo** (`lib/db/schema.ts`, migración
  `0007_eager_wildside.sql`): `itineraries`, `itineraryTiers`,
  `itineraryDays`/`itineraryDayActivities`/`itineraryDayParagraphs`/
  `itineraryDayImages`, `itineraryHotels`, `itineraryExcursions`,
  `itineraryFlights`, `itineraryTransport` — un set de tablas
  **genuinamente nuevo**, no otro flag tipo `isTemplate` sobre
  `proposals` (razón: `proposals` ya carga CRM/sharing/template y sumarle
  un 4to concepto ortogonal hubiera seguido el mismo patrón de
  sobrecarga ya identificado; además hoteles/vuelos/transporte de un
  itinerario necesitan cardinalidad por tier que `proposalHotels` no
  puede expresar sin filtrar semántica de tier hacia adentro de
  propuestas reales para siempre). Todas las tablas de contenido por
  tier (`itineraryHotels`/`Excursions`/`Flights`/`Transport`) llevan
  `tierId` **nullable**: `null` = aplica a todos los tiers (compartido),
  un valor = solo ese tier. Los días NO llevan `tierId` — son siempre
  compartidos, por decisión confirmada.
- **Reuso del patrón de copia de grafo ya existente**: `lib/db/copyItineraryGraphInto.ts`
  (nuevo) es el molde exacto de `lib/db/copyProposalGraph.ts::copyProposalGraphInto`,
  pero lee de tablas `itinerary*` y filtra por tier
  (`row.tierId === null || row.tierId === tierId`) antes de copiar a
  `proposal*`. Vuelos/transporte, sin bloque de documento propio
  todavía, se serializan como texto dentro de una fila
  `proposalListSections` generada ("Flights"/"Ground Transportation").
  `lib/db/createProposalFromItinerary.ts` es el molde exacto de
  `lib/db/createProposalFromTemplate.ts` — inserta la propuesta nueva,
  copia el grafo filtrado por tier, y no toca `proposalSections`: la
  propuesta nueva arranca con composición vacía, igual que el origen
  "blank", lista para que el usuario inserte páginas.
- **Enganche en creación de propuesta**: `CreateProposalInput.origin`
  (`app/proposals/actions.ts`) gana un 4to caso `{ type: "itinerary",
  itineraryId, tierId }`, con una rama en `createProposal()`
  estructuralmente idéntica a la rama `"template"` ya existente — el
  diseño elegido en el diálogo siempre pisa el que trae el origen,
  confirmando que elegir diseño ya estaba desacoplado del contenido
  antes de esta pasada. `CreateProposalDialog.tsx` pasa de 3 a 4
  opciones en "Start from", con selector de itinerario + tier.
- **UI nueva**: `/proposals/itineraries` (lista, clon de
  `/proposals/templates` — `ItineraryGallery.tsx`, con Manage/Duplicate/
  Archivar/Restaurar y, a diferencia de templates, **borrado duro real**
  habilitado porque nada queda con FK viva hacia un itinerario después
  de generar — la copia es totalmente independiente).
  `/proposals/itineraries/[id]/edit` (`ItineraryEditorShell.tsx`): tabs
  de Tier (Shared + uno por tier, agregar/borrar), el editor de días
  reusado tal cual, y 3 paneles nuevos (Hoteles/Vuelos/Transporte) con
  un selector "All tiers"/"This tier only" que decide el `tierId` al
  agregar. Botón "Generate proposal" abre un diálogo (cliente, diseño,
  tier) que llama `createProposal()` con el origen nuevo y redirige al
  editor real — desde ahí, Personalizar/Descargar/Enviar funcionan sin
  ningún cambio de código.
- **Refactor mecánico en `ItineraryEditor.tsx`**: antes importaba
  `updateProposalFields` directo y recibía `proposalId`/`config`
  (acoplado 100% al contexto de una propuesta real). Ahora recibe
  `initialText`/`onSave` genéricos — el caller decide si `onSave` pega
  contra `updateProposalFields` (propuesta) o `updateItineraryDays`
  (itinerario nuevo). El resto del componente (codec, controles,
  aviso de overflow) no cambió. Verificado que el flujo existente
  (itinerario dentro de una propuesta real) sigue funcionando sin
  regresiones — mismo componente, misma validación.
- **Verificado de punta a punta con Playwright contra un servidor real**:
  itinerario con 2 tiers (Classic/Premium), un día con actividad+narrativa,
  un hotel Suite/Full Board etiquetado solo Premium y otro Standard/Half
  Board etiquetado Classic → "Generate proposal" eligiendo Premium →
  confirmado en la propuesta nueva: el día completo (con su actividad y
  párrafo) presente, **y el hotel de Premium presente mientras el de
  Classic queda excluido** — el filtro por tier funciona correcto de
  punta a punta a través de la UI real, no solo a nivel de función.
- **Fuera de esta pasada, a propósito**: bloques de documento dedicados
  para vuelos/transporte (fase 2, condicional a uso real); UI de
  reordenamiento (drag/mover) para hoteles/vuelos/transporte dentro de un
  itinerario (hoy se agregan al final, sin botones mover arriba/abajo);
  panel de excursiones en el editor de itinerario (el esquema y las
  server actions ya existen, siguiendo el mismo patrón que hoteles, pero
  no se pidió explícitamente y no se construyó la UI); Workstream 2
  (diseños de documento más baratos de agregar) — investigado y
  diseñado en el plan, pero no implementado en esta pasada, es
  totalmente independiente y solo importa cuando se pida un 3er diseño
  real.

**Bug real de datos corregido (no de código), fuera del alcance de
cualquier fase (2026-08-25):** en la propuesta seed `1` ("The Mainland
Tour", DEMO-0001), la página 4 mostraba "Thank You" en vez de "Overview"
— reportado por el usuario como "la página 4 no es el diseño que debe ir
ahí". Investigado contra `reference/pdf-pages/page-04.png` (confirma que
la página 4 real es el resumen día a día "Overview") y contra
`lib/db/seed.ts:993` (el `sortOrder` original de `overview` es `10`, el
más bajo de `proposal_sections`, o sea la primera sección después de
Cover/From the Owners/Details). En la base de datos de dev, la fila
`overview` tenía `sortOrder: 80` (después de los 3 hoteles) y existía una
fila `thankYou` duplicada y huérfana con `sortOrder: 1` (payload
`imageUrl: ""`, la causa del badge "Warning" ya visible en el panel de
páginas) — probablemente de una prueba manual anterior con la
funcionalidad "insertar al principio" (Fase 11.3, `afterSectionId: null`).
Corregido directamente en `data/proposals.db` (no en código, no hay
migración): la fila duplicada se marcó `hidden`/`deleted` con el mismo
mecanismo que usa `setProposalSectionDeleted` (recuperable, no un borrado
duro), y `overview` volvió a `sortOrder: 10`. Verificado con
`getProposalData(1)`: 46→45 páginas (exactamente -1, la fila duplicada),
página 4 = `overview`, sin huecos en la numeración. **Mismo bug
encontrado en la propuesta `32`** (también "The Mainland Tour", mismo
patrón exacto: `thankYou` huérfano en `sortOrder 1`, `overview` en
`sortOrder 80`) — consistente con haber sido creada por "Duplicar" a
partir de la propuesta `1` ya corrupta (`duplicateProposal.ts` copia
`proposal_sections` tal cual). **No corregida a propósito** — se le avisó
al usuario y queda pendiente de que confirme si también hay que
arreglarla. Las propuestas `26`/`66` no muestran el mismo patrón.

**Limpieza de pendientes de fidelidad visual/contenido (2026-08-25).** Tres
ítems sueltos de la sección "Pendientes conocidos":

- **Íconos de clima/requisitos de viaje (`lib/db/seed.ts`)**: los 4 estados
  del tiempo (Summer/Fall/Winter/Spring) solo tenían ícono en "Fall"
  (🌧️) — Summer/Winter/Spring quedaban sin emoji en `weatherSeasons`,
  para ambos perfiles (mainland y Zanzibar). Se agregaron ☀️/🌤️/🌦️
  para consistencia. El ícono de "Zanzibar Travel Insurance" en
  `travelRequirementItems` pasó de 🐚 (concha, temática de playa sin
  relación con seguros) a 🛡️. **Decisión explícita, a pedido del
  usuario:** no se migró esto a un set cerrado de íconos `lucide-react`
  (como sí se hizo para `BrandIcon` globe/warning) — investigado y
  confirmado que `travelRequirementItems.icon`/`weatherSeasons.icon` son
  campos de **texto libre editables por el usuario** (línea `Icon:` en el
  editor de colección, `app/proposals/[id]/editor/actions.ts:396`), no un
  vocabulario fijo de marca. Cerrar eso a lucide requeriría un picker y
  perder la edición libre — cambio de UI/schema real, fuera de alcance de
  esta pasada. Solo se tocó el contenido del seed.
- **`lib/sampleProposalData.ts` completado**: era el dataset legado de
  referencia para previews aislados (`/preview/full-proposal`), y quedaba
  incompleto contra `reference/pdf-pages/`: le faltaba el 3er hotel
  (págs. 11-12, "Serengeti Signature Safari Lodge") y la sección completa
  de excursiones de Karatu (pág. 26-29, divisor "Karatu Tours &
  Excursions" + 10 ítems). Se agregaron ambos, transcritos del PDF
  original — 3 de los 10 ítems de Karatu son excursiones únicas (Hadza +
  Datoga, Olduvai Gorge + Shifting Sands, Sunrise Hot Air Balloon), el
  resto se solapa con el catálogo de Arusha pero con precio propio en
  algunos casos (ej. Mosquito River Cultural Tour: $80 desde Arusha, $200
  desde Karatu — confirmado que el PDF realmente lista precios distintos
  por ciudad de partida, no es un error de transcripción). No hizo falta
  ajustar números de página a mano: `renumberSections()` ya renumera toda
  la lista al final por orden de array, así que insertar las secciones
  nuevas en el lugar correcto del array alcanza. **Nota:** esto es solo el
  dataset legado aislado — no es el seed real (`lib/db/seed.ts`), que
  nunca tuvo 3 hoteles ni excursiones de Karatu y queda fuera de esta
  pasada (cambiarlo afectaría la propuesta seed real `1` usada en toda la
  suite e2e).
- **Orden alternado en `DayItineraryBlock` — investigado y descartado a
  pedido del usuario, no es un simple reorden.** Comparando
  `page-14/15/16.png` se confirmó que el original usa un **flujo continuo
  tipo revista**: el contenido de un día puede partirse entre columnas y
  páginas (ej. pág. 16: las 2 imágenes de Día 4 terminan arriba de la
  columna derecha, *después* de que ya empezó el título de Día 5 en esa
  misma columna). El sistema actual asigna un día completo y autocontenido
  a una columna (regla mecánica documentada en `CLAUDE.md`: día 1 solo con
  sidebar, resto en pares, sobrante solo) — replicar el flujo original
  requeriría un rediseño real del motor de paginación de itinerario
  (`lib/paginate.ts`, presupuestos compartidos con Overview/ExcursionList/
  TermsConditions, tests, PDF), no un cambio acotado. **Se decide no
  implementarlo**: queda como limitación de arquitectura permanente y
  aceptada, no como pendiente activo — coherente con la regla de
  `CLAUDE.md` de priorizar consistencia del sistema sobre replicar el
  original cuando entran en conflicto.

**Las tres brechas documentadas como "fuera de esta pasada" tras el
rediseño visual están cerradas**: modo oscuro del editor, placeholder de
íconos de mejor calidad, y renderer real y distinto para Minimal Grid (ver
`docs/VISUAL_DESIGN_POSITIONING.md`, ahora actualizado para reflejarlo).

- **Modo oscuro (Parte A)**: cada uno de los ~28 tokens `--editor-*` tiene
  ahora un equivalente oscuro bajo `.proposal-studio[data-theme="dark"]`
  (`app/globals.css`) — mismo nombre de variable, no un set paralelo, así
  que ningún componente necesita ramificar por tema. `ProposalEditorShell.tsx`
  agrega un botón de alternancia (ícono `Moon`/`Sun`) en la toolbar; el
  estado `theme` se inicializa de forma síncrona desde `localStorage` vía
  el inicializador perezoso de `useState` (no un `useEffect` post-mount,
  que en desarrollo con React Strict Mode causaba una carrera real —
  confirmada con Playwright: el efecto de escritura se disparaba con el
  valor todavía no actualizado antes de que el efecto de lectura aplicara
  el cambio, revirtiendo silenciosamente el tema guardado a "light" en
  cada recarga — corregido leyendo `localStorage` en el inicializador y
  con `suppressHydrationWarning` en el `data-theme` del `<main>`). Exclusivo
  del chrome del editor — confirmado que `ProposalRenderer.tsx` y los
  bloques del documento no leen ningún token `--editor-*`, cero fuga hacia
  el documento renderizado. Documentado en `docs/EDITOR_DESIGN_SYSTEM.md`.
- **Placeholder de íconos (Parte B)**: `lib/brand/config.ts` agrega
  `kind: "component"` a la unión `BrandIcon`; `BRAND_ICONS.globe`/`.warning`
  pasan de emoji (🌍/⚠️) a íconos `lucide-react` (`Globe`/`TriangleAlert`),
  renderizados por `components/blocks/shared/BrandIcon.tsx`. Sigue siendo
  swappable por el pipeline existente de `docs/BRAND_ASSET_PACK.md` — no
  se tocó tipografía (sigue sin fuente serif real, cae a Geist Sans, sin
  margen para diferenciarla artificialmente) ni los íconos de contenido
  por fila (pasaporte/visa/clima en `lib/db/seed.ts`), que son decisión
  editorial, no brand pack, y quedan fuera de esta pasada a propósito.
- **Renderer real y distinto para Minimal Grid (Parte C)**: cerraba la
  pregunta de arquitectura abierta en `docs/DOCUMENT_DESIGN_CONTRACT.md`
  ("A complete Minimal Grid renderer belongs after that contract
  integration") y `docs/VISUAL_DESIGN_POSITIONING.md`. `minimal-grid` se
  registró como **v2** (`lib/designs/registry.ts`) — v1 queda intacto,
  porque la regla de versionado del contrato prohíbe mutar una versión ya
  registrada; v2 tiene `rendererId: "minimal-grid-v1"` en vez de reusar
  `melanated-blocks-v1`. `ProposalRenderer.tsx` ahora rutea por
  `design.rendererId` contra un mapa de renderers
  (`components/renderers/melanatedBlocksV1.tsx` — extracción sin cambios
  del switch existente — y `components/renderers/minimalGridV1.tsx`), con
  fallback al renderer de Safari Editorial para ids desconocidos (cubre
  `/preview/full-proposal`, que no resuelve `design`, y snapshots
  antiguos). Se construyeron los 17 bloques de Minimal Grid
  (`components/blocks/minimal-grid/`, más su propio
  `shared/SectionHeader,PageFooter,PageHeader`) con un lenguaje visual
  genuinamente distinto — grid estructurado, reglas finas, mayúsculas
  pequeñas, sin itálicas ni clip-path — no una sustitución de color sobre
  los mismos bloques; cada uno reutiliza el mismo tipo de dato que su
  equivalente de Safari Editorial y repite sus llamadas a
  `editableRegion()` (confirmado con un clic real en el canvas: el campo
  correcto se resalta en el inspector). Como `listDocumentDesigns()` no
  filtraba por versión, se agregó `listSelectableDocumentDesigns()`
  (dedupe a la versión más alta por `id`) y los dos pickers
  (`app/proposals/page.tsx`, el selector dentro del editor vía
  `getDesignChoices`) lo usan — confirmado que "Minimal Grid" aparece una
  sola vez, no v1 y v2 juntos. **Limitación conocida, no descubierta
  tarde**: `lib/paginate.ts` sigue siendo genérico entre renderers; los 4
  tipos de bloque con paginación dinámica (Overview, DayItinerary,
  ExcursionList, TermsConditions) se construyeron preservando la altura de
  línea y ancho de columna de Safari Editorial para que los presupuestos
  compartidos sigan siendo válidos — verificado con Playwright midiendo
  `scrollHeight` contra las 57 páginas de la propuesta de referencia bajo
  Minimal Grid v2, sin overflow. Paginación consciente del diseño queda
  como trabajo futuro si un tercer diseño necesitara densidad de texto muy
  distinta.

**Rediseño visual (editor, dashboard, documento), inspirado en el lenguaje
visual de herramientas comerciales de propuestas** — sin tocar la mecánica
de canvas libre (explícitamente fuera de alcance, ver `CLAUDE.md`) ni el
modo oscuro/tipografía-logo-íconos reales del documento (bloqueado en
`docs/BRAND_ASSET_PACK.md`). Ver `docs/COMPETITIVE_POSITIONING.md` y
`docs/VISUAL_DESIGN_POSITIONING.md` para el análisis previo que motivó esta
pasada.

- **Editor**: `docs/EDITOR_DESIGN_SYSTEM.md` actualizado — `editor-accent`
  pasa de "acento decorativo mínimo" a un uso funcional único (marcador de
  la página seleccionada en `PageNavigator`, vía `border-l-editor-accent`
  en `EditorPageCard`). Se estableció jerarquía real de botón primario en
  la toolbar: "Share" queda como la única acción `variant="primary"` de la
  región; "Send" y "Generate PDF" ya usaban `primary` de antes (hallazgo
  al hacer el cambio, no introducido por él) y se bajaron a `secondary`
  para que la regla "una acción primaria por región" sea real, no solo
  documentada. `EditorDrawer` usa `shadow-editor-page` en vez del
  `shadow-2xl` genérico de Tailwind.
- **Dashboard y plantillas**: `getProposalListSummaries()` expone
  `coverImageUrl` (columna ya existente, no expuesta antes).
  `ProposalDashboard.tsx` reemplaza la tabla por una grilla de tarjetas
  con imagen de portada (fallback a gradiente de marca cuando no hay
  imagen) — mismo patrón que ya usaba `TemplateGallery.tsx`, que ahora
  usa miniatura vertical `aspect-[3/4]` en vez de una caja achatada de
  128px, y `shadow-editor-card` en ambas.
- **Documento**: hallazgo de arquitectura — `design.brand.primary/
  secondary/accent` (`lib/designs/registry.ts`) estaba definido pero
  **nunca leído** por ningún bloque de render (confirmado por grep en
  todo el repo). `ProposalSectionView` (`components/ProposalRenderer.tsx`)
  ahora recibe `design` opcional y expone `--design-primary/-secondary/
  -accent` como CSS custom properties a sus hijos; `SectionHeader.tsx` y
  `PageFooter.tsx` los consumen en vez de `neutral-800`/`neutral-600`
  hardcodeados (con fallback inline al valor de `melanated-editorial` por
  si algún preview aislado no envuelve con el `design`). Esto es lo que
  finalmente hace que "Minimal Grid" se diferencie de "Safari Editorial"
  sin escribir un segundo renderer — aunque el efecto visual es sutil hoy,
  porque los valores de marca registrados para ambos diseños son
  deliberadamente cercanos (`#1c202b` vs `#20252b` de primario, etc.), no
  porque el mecanismo no funcione. Los 4 call sites de
  `ProposalSectionView`/`ProposalRenderer` que ya tenían el `design`
  resuelto en scope lo pasan (editor, share, share/print, preview
  dinámico); `/preview/full-proposal` (dataset legado aislado) se dejó en
  el fallback por defecto a propósito. `CoverBlock.tsx` recibió un ajuste
  tipográfico acotado (tracking del wordmark/subtítulo) dentro de la
  fuente Geist Sans actual — no se tocó tipografía real, logo ni íconos,
  bloqueados por `docs/BRAND_ASSET_PACK.md`.
- **Explícitamente fuera de esta pasada**: modo oscuro del chrome del
  editor (requiere infraestructura de theming nueva que no existe hoy) y
  un segundo renderer real por diseño (pregunta de arquitectura abierta en
  `docs/VISUAL_DESIGN_POSITIONING.md`, no resuelta acá).

**Bug real corregido, fuera del alcance de cualquier fase:** `lib/db/schema.ts`
tenía 5 tablas (`proposalNotificationSettings`, `proposalNotifications`,
`proposalCommentThreads`, `proposalComments`, `proposalInternalNotes`) y un
`proposalEvents.type` con más valores permitidos que nunca se habían
convertido en migración — no una migración fallida, una que **nunca se
generó**. `npm run db:migrate` reportaba éxito sin hacer nada (no había
migración pendiente que aplicar) y tanto `tsc` como `npm test` pasaban
limpio, porque ninguno de los dos toca el esquema real de SQLite; solo una
query en tiempo de ejecución contra esas tablas lo exponía
(`SqliteError: no such table: proposal_notification_settings`). Corregido
generando `lib/db/migrations/0006_rich_mauler.sql` con
`npm run db:generate` y aplicándola. Queda como recordatorio: correr
`npm run db:generate` (esperando "No schema changes, nothing to migrate")
después de cualquier edición a `schema.ts`, no solo `db:migrate` — un
snapshot de migración (`meta/*_snapshot.json`) tampoco sirve como chequeo de
completitud porque queda congelado al momento en que esa migración se
generó.

**Fases 14–17 del plan de expansión completas, cerrando `STUDIO_EXPANSION_PLAN.md`
entero.** Una auditoría encontró que gran parte de las Fases 14 (variables +
pricing interactivo) y 15 (envío, firma electrónica, cierre de pipeline) ya
estaba construida en el working tree sin documentar: catálogo cerrado de
variables `{{path}}` (`lib/variables/catalog.ts`) resuelto server-side y
bloqueando compartir si falta una requerida; tabla de precios con
cantidad/impuesto/descuento/opcionales calculada server-side
(`lib/pricing/calculate.ts`) e interactiva desde el share
(`/api/share/[token]/pricing`), congelada al aprobar; envío por email con
proveedor configurable (`lib/email/send.ts`, fallback a archivo `.eml` en
dev); firma tipeada o dibujada con hash SHA-256 + certificado en el PDF
(`lib/signatures/hash.ts`, `SignatureCertificatePage.tsx`); y cierre
Won/Lost con reapertura que duplica en vez de mutar una propuesta ya
firmada. Esta sesión cerró los tres huecos reales que quedaban en la Fase
16 (analytics/notificaciones) y la Fase 17 (comentarios):

- **Panel "Activity" en el editor** (`components/editor/ActivityPanel.tsx`,
  nuevo botón de toolbar junto a "Review"): `lib/db/getProposalActivity.ts`
  ya calculaba timeline, duración por sección, hilos de comentarios y notas
  internas, pero nada lo renderizaba — era código muerto desde la UI.
  Sigue el mismo patrón que el resto del editor: datos fetched eager en
  `app/proposals/[id]/editor/page.tsx` y pasados como prop (ningún panel de
  este editor hace fetch propio en el cliente), mutaciones vía el helper
  `run()` ya usado por `ContentLibraryPanel.tsx`. El panel Review ahora
  muestra un aviso informativo (no bloqueante) con el conteo de hilos
  abiertos antes de volver a compartir.
- **Comentarios del cliente en el share** (`app/api/share/[token]/comments/route.ts`,
  `components/sharing/ShareComments.tsx`): la mitad vendedor de Fase 17
  (`replyToComment`, `setCommentThreadStatus`, notas internas en
  `activityActions.ts`) ya funcionaba, pero el cliente no tenía ninguna
  forma de crear un hilo — la ruta API no existía. Se optó por un selector
  de sección (reusando `buildProposalPageMeta` para los títulos humanos) en
  vez de overlays anclados al canvas escalado del share, que hubiera sido
  una adición arquitectónica real sin beneficio funcional extra: la columna
  `sectionKey` es lo que "por sección" significa a nivel de dato, y un
  `<select>` la satisface igual. Un segundo comentario del cliente en una
  sección con hilo abierto se agrega a ese hilo en vez de crear uno
  paralelo. `lib/db/commentThreads.ts::syncCommentThreadsForRevision` corre
  dentro de la misma transacción que `createProposalShare` y marca
  `orphaned` en los hilos abiertos cuya sección ya no existe en la revisión
  nueva (por `sourceSectionId` o `sectionKey`); si la sección vuelve a
  aparecer, se desmarca automáticamente.
- **Chequeo programado de shares por vencer**
  (`scripts/checkExpiringShares.ts`, `npm run notifications:check-expiring`):
  `ensureExpiringShareNotifications()` ya existía y ya se llamaba desde
  `/proposals` en cada carga del dashboard (dedupe por `dedupeKey`, así que
  es inofensivo llamarla seguido), pero no tenía un disparador real — un
  share podía vencer sin que nadie abriera el dashboard. Documentado en
  `docs/OPERATIONS.md` junto al backup, para correr cada 4-6 horas vía Task
  Scheduler/cron, sin reemplazar el trigger de la carga del dashboard.

**Suite E2E estabilizada y aislada.** `npm run test:e2e` ya no reutiliza
`data/proposals.db` ni el build `.next` del servidor de desarrollo: el hook
`pretest:e2e` recrea `data/e2e-proposals.db` desde migraciones + seed y limpia
`.next-e2e`, mientras `scripts/runE2E.mjs` levanta Next en el puerto 3100,
espera `/api/health`, ejecuta Playwright y termina el árbol del servidor aun
si hay un fallo. Las respuestas de Google Fonts se simulan localmente durante
esta corrida, por lo que no dependen de red. Las 15 omisiones generadas por
`test.skip()` se reemplazaron por tags `@desktop-only`/`@mobile-only`
filtrados por proyecto:
la matriz registra solo los 43 escenarios que realmente aplican y termina con
**43 passed, 0 skipped**. También se corrigieron los tres fallos observados:
el test de thumbnail ahora elige una imagen seed poblada; el botón de gestión
de plantilla tiene un nombre accesible único; y el drag desde catálogo espera
la activación del ghost y del gap antes de soltar. El caso de inserción por
teclado espera de forma resistente la hidratación del shell SSR, y el nuevo
runner evita el proceso de Playwright colgado al apagar Next en Windows.

**UI: selector de diseño removido de la toolbar.** El toolbar del editor
tenía un selector de diseño duplicado (`#document-design`, junto a
"Review"/"Share"/"Generate PDF") además del que ya existe dentro del panel
Properties, modo "Design" (`#inspector-document-design-*`, con formato de
página/orientación y variantes visibles debajo). A pedido del usuario se
quitó el de la toolbar; el cambio de diseño sigue disponible completo desde
Properties → Design. `activeDesignKey`/`changeDocumentDesign` no cambiaron —
siguen siendo consumidos por el selector del inspector.

**Recalibración de zoom, fuera del alcance de cualquier fase:** el rango de
zoom del canvas (`ProposalEditorShell.tsx`) estaba `MIN_ZOOM=0.3`/
`MAX_ZOOM=0.95`/`ZOOM_STEP=0.05` — un techo de 95% que aplicaba tanto al zoom
manual (+/-, slider) como a la fórmula de "Fit width", así que **nunca** era
posible ver una página a tamaño real (100%) ni más grande para inspeccionar
detalle, y "Fit width" en ventanas angostas (sin el panel de catálogo
acoplado) quedaba pegado en 95% en vez del valor real que le correspondía —
confirmado midiendo el ancho real en píxeles de la página: a 1000px de
ventana, el fit correcto es ~114%, pero el código lo recortaba a 95% igual.
Recalibrado a `MIN_ZOOM=0.2`/`MAX_ZOOM=2`/`ZOOM_STEP=0.1` (20%–200%, pasos de
10%) — mismo mecanismo (`clampZoom`, slider, botones +/-, "Fit width" son
todos derivados de estas 3 constantes, sin cambios de lógica), solo se movió
el rango. Verificado que "Fit width" en 1000px ahora da 114% real en vez de
95% recortado, y que el zoom manual llega genuinamente a 20% y 200%.

**Bug real corregido, fuera del alcance de cualquier fase:** los 9 bloques con
campos de imagen opcionales (`CoverBlock`, `TriangleDividerBlock`,
`SectionDividerBlock`, `CityToursDividerBlock`, `ThankYouBlock`,
`FromOwnersBlock`, `HotelBlock` ×3, `ExcursionListBlock`,
`DayItineraryBlock`) renderizaban `<img src={...}>` sin proteger contra
string vacío — cualquier campo de imagen dejado en blanco (posible desde
siempre: `validImageUrl()` en las actions acepta `""` como válido, y
`ADDABLE_SECTION_DEFAULTS` en `lib/editor/addableSections.ts` arranca
`triangleDivider`/`sectionDivider`/`thankYou` nuevos con `imageUrl: ""` hasta
que el usuario carga una imagen) producía una imagen rota real en editor,
preview **y PDF**, no solo un warning de consola. Corregido con
`src={value || undefined}` (el patrón que React mismo recomienda en su propio
warning) en cada bloque; `DayItineraryBlock` filtra `imageUrls` vacíos antes
de mapear en vez de renderizar un hueco. Descubierto al investigar errores de
consola reportados por el usuario, que en este caso puntual venían de 2
secciones (`thankYou`/`triangleDivider`) dejadas sin imagen por corridas
previas de la suite e2e completa contra la propuesta seed — esas 2 filas se
borraron; sigue habiendo una sección `hotel` extra (id 273, con imagen real,
sin bug asociado) de otro test de persistencia de la misma corrida, sin
limpiar a propósito por ahora.

La Fase 13.2–13.4 del plan de expansión está **completa, cerrando la Fase 13
entera**. La nueva pestaña Library del catálogo reúne cuatro activos globales:
secciones guardadas como snapshots independientes de payload+variante,
snippets insertables en el cursor (inspector e inline), imágenes subidas y
fees reutilizables. Las secciones pasan por la compatibilidad del diseño y se
insertan por botón o drag; editar/archivar luego el original de biblioteca no
modifica propuestas ya creadas. Los uploads aceptan PNG/JPEG/WebP/GIF hasta 8
MB, verifican magic bytes, usan SHA-256 como clave y se sirven con caché
inmutable desde `/api/library/images/[key]`; archivar no borra el archivo para
no romper propuestas/revisiones históricas. El adapter actual usa
`LIBRARY_UPLOAD_DIRECTORY` o un volumen junto al SQLite, pero la base guarda
solo claves estables: `docs/OPERATIONS.md` deja object storage S3-compatible
como decisión de despliegue a revisitar. Backup/restore ahora copia y recupera
el directorio hermano `<backup.db>.uploads`, con swap y recovery del volumen
anterior. Los fees almacenan centavos/basis points enteros para evitar floats
y exponen CRUD completo. Migración `0003_fearless_maria_hill.sql`; el E2E de
biblioteca cubre guardar/reinsertar sección, snippet inline, upload+selección
de imagen y fee de $125.50. La suite usa además `data/e2e-uploads` desechable,
separado del volumen de desarrollo.

La Fase 13.1 del plan de expansión (plantillas de propuesta —
`docs/STUDIO_EXPANSION_PLAN.md`) está **completa**. "Guardar como plantilla"
(`components/editor/SaveAsTemplateButton.tsx`, botón nuevo en el toolbar del
editor junto a Share) hace un deep copy del grafo completo de la propuesta
actual marcado `proposals.isTemplate` — 4 columnas nuevas y aditivas en
`proposals` (`is_template`/`template_name`/`template_description`/
`template_thumbnail_url`, migración `0002_worthless_wilson_fisk.sql`, `ALTER
TABLE ADD` plano sin rebuild de tabla). **Refactor clave:** la lógica de copia
de grafo que antes vivía solo dentro de `duplicateProposal.ts` (días,
reservas de hotel, excursiones, listas, pricing, secciones con remapeo de
`refId`) se extrajo a `lib/db/copyProposalGraph.ts::copyProposalGraphInto(tx,
sourceId, targetId, overrides?)`, reusada ahora por `duplicateProposal.ts`,
`lib/db/saveProposalAsTemplate.ts` (guardar) y
`lib/db/createProposalFromTemplate.ts` (crear desde plantilla) —
`duplicateProposal.ts` no cambió de comportamiento, solo delega. "Crear desde
plantilla" es un tercer origen en `CreateProposalDialog.tsx` ("From
template", junto a Blank/Duplicate) que llama `createProposalFromTemplate`:
copia el grafo con `skipClients:true` (inserta solo el `leadClientId` nuevo
elegido en el diálogo, sin roster de travelers de la plantilla) y limpia los
campos listados en `lib/editor/resetOnTemplateFields.ts::RESET_ON_TEMPLATE_FIELDS`
(`leadClient`, `travelDatesLabel`, `arrivalAirport`, `departureAirport`,
`proposalDaysDate`) — lista estática consultada explícitamente por la
función, **no** un intérprete genérico sobre el view-model runtime
`ProposalEditorField` (esa capa se puebla por render de página, la altura
equivocada para decidir qué columnas crudas limpiar antes de que la propuesta
nueva exista). Gestión de plantillas vive en la ruta dedicada nueva
`/proposals/templates` (`TemplateGallery.tsx`, tarjetas con thumbnail —reusa
`coverImageUrl` de la propuesta origen, sin screenshot real—, nombre,
descripción, diseño y estado): renombrar y "actualizar desde una propuesta"
comparten un solo diálogo modal (`ManageTemplateDialog`, mismo patrón de
focus-trap que `ShareProposalButton.tsx`); archivar/restaurar son botones de
ícono directos en la tarjeta. "Actualizar desde una propuesta"
(`lib/db/updateTemplateFromProposal.ts`) borra el grafo hijo actual de la
plantilla (delete de las filas padre alcanza — las hijas cascadean por FK) y
lo reemplaza con una copia fresca vía el mismo `copyProposalGraphInto`; las
propuestas ya creadas desde esa plantilla no se tocan, cada una tiene su
propia copia independiente tomada en el momento de creación — mismo
principio snapshot que Fase 2.3B. Las plantillas quedan fuera del pipeline
principal vía `proposals.isTemplate`: `getProposalListSummaries()` (dashboard
`/proposals`) las excluye con `.where(eq(proposals.isTemplate, false))`;
`lib/db/getTemplateList.ts` (nuevo, deliberadamente más liviano — sin los
joins de pricing/última-actividad que sí necesita el dashboard) las lista
aparte. Sin action de borrado de plantilla — el plan solo pedía
renombrar/actualizar/archivar. Cubierto por 2 tests nuevos en
`tests/core.test.mts` (forma de `RESET_ON_TEMPLATE_FIELDS`; round-trip
guardar-como-plantilla→crear-desde-plantilla contra la propuesta seed,
verificando conteo de secciones igual al original, fechas limpias, exclusión
del pipeline, con cleanup de las filas creadas al final del test) y verificado
de punta a punta contra un servidor real corriendo en Playwright (guardar,
ver en galería, crear, confirmar "Dates not assigned" en el nuevo proposal y
las 44 páginas de itinerario retenidas intactas).

La Fase 12.3 del plan de expansión (autenticación mínima —
`docs/STUDIO_EXPANSION_PLAN.md`) está **completa, cerrando la Fase 12
entera**. Login single-usuario (`app/login/page.tsx` + `app/login/
actions.ts`) protege `/proposals`, el editor, el preview y todas las
mutaciones. **Decisiones de esta fase:** esta versión de Next.js (16.3.2)
renombró `middleware.ts` a `proxy.ts` — confirmado leyendo los docs
vendorizados en `node_modules/next/dist/docs/`, no en memoria de
entrenamiento — así que la puerta de acceso vive en `proxy.ts` (raíz del
proyecto) con un matcher **positivo** (`/`, `/proposals`, `/proposals/:path*`,
`/api/proposals/:path*`) en vez de un negative-lookahead amplio; deja
`/login`, `/share/**`, `/api/share/**`, `/api/health` y las 18 rutas de
fixture `/preview/*` (datos hardcodeados, no de la DB) fuera a propósito. La
sesión es una cookie firmada auto-verificable (HMAC-SHA256 sobre
`{exp}`, secreto en `STUDIO_SESSION_SECRET`) sin tabla de sesiones —
`lib/auth/session.ts`. La credencial es una sola contraseña compartida
(`STUDIO_AUTH_PASSWORD`, sin usuario — no hay tabla de usuarios en el
schema ni nada que consuma un username) verificada con `timingSafeEqual`,
mismo patrón que ya usaba el flujo de password de share
(`app/api/share/[token]/unlock/route.ts`) — sin nueva dependencia,
`node:crypto` únicamente. Los docs vendorizados de Next advierten
explícitamente que la cobertura de Server Actions vía matcher de proxy es
frágil (un refactor de ruta puede perderla en silencio) y recomiendan
verificar la sesión dentro de cada action — por eso, además del proxy, las
19 funciones exportadas de mutación en los 6 archivos `"use server"`
existentes (`app/proposals/actions.ts`,
`app/proposals/[id]/editor/{actions,compositionActions,designActions,
catalogActions,shareActions}.ts`) ganaron un guard `hasValidSession()` al
inicio, mismo patrón `{ok:false, formError}` que ya usaban para cualquier
otra validación. **Riesgo real encontrado y corregido:** `/api/proposals/
[id]/pdf` lanza un Chromium headless vía Playwright y navega por HTTP real a
`/proposals/{id}/preview` — ese contexto de navegador arranca sin cookies,
así que una vez protegida esa ruta el PDF se hubiera roto en silencio;
corregido inyectando una cookie de sesión de 60 segundos generada en el
propio handler (ya autenticado) vía `page.context().addCookies()` antes de
`page.goto()`, en vez de reenviar la cookie real del que pidió el PDF. Rate
limiting básico (`lib/auth/rateLimit.ts`, Map en memoria, 5 intentos/15min,
por IP vía `X-Forwarded-For`) se aplica tanto al login nuevo como —
retrofit del punto 2 de la spec — al endpoint de unlock de share
(`app/api/share/[token]/unlock/route.ts`), que antes aceptaba intentos
ilimitados. Logout es un `<form action={logout}>` en el header del
dashboard (`ProposalDashboard.tsx`), no duplicado en el toolbar del editor
para esta pasada mínima. Cookie: `httpOnly`, `sameSite=Strict`, `path=/`,
`secure` condicional a `X-Forwarded-Proto: https`, 30 días de duración fija
(sin "remember me"). Tests: `tests/e2e/global-setup.ts` loguea una vez y
guarda `storageState` (`tests/.auth/session.json`, gitignored) reusado por
toda la suite existente (`workers: 1` ya la corre en serie); `webServer.url`
de `playwright.config.ts` pasó de `/proposals/1/editor` (ahora protegida) a
`/api/health` (pública) para el healthcheck de arranque.
`tests/e2e/auth.spec.ts` (4 tests nuevos) cubre: redirect + login exitoso,
password incorrecta con error inline, rate limit disparado tras intentos
repetidos (incluso bloquea la password correcta mientras dura el lockout), y
logout re-protegiendo `/proposals`. **Bug real encontrado corriendo la suite
completa:** como ambos proyectos de Playwright (`desktop`/`mobile`) comparten
un solo `webServer`, el test de rate-limit de un proyecto agotaba el bucket
compartido (`login:unknown`, sin `X-Forwarded-For` real en local) y dejaba al
OTRO proyecto bloqueado para loguearse durante el resto de la corrida —
corregido asignando un `X-Forwarded-For` fijo distinto por proyecto
(`extraHTTPHeaders` en `playwright.config.ts`), aislando sus buckets como lo
estarían dos clientes reales con IPs distintas. `tests/http.integration.test.mjs` ganó
un login vía submit de formulario no-JS a `/login` (Server Actions
soportan esto nativamente — sin JS, el POST llega igual y `redirect()`
devuelve la cookie en la respuesta) para poder seguir pegándole a
`/proposals/1/editor`/`/api/proposals/1/pdf`/`/api/proposals/1/share`.
`.env.local` (gitignored, ya cubierto por la regla `.env*` existente) trae
credenciales de desarrollo; no se agregó `.env.example` — este repo nunca
tuvo uno, `DATABASE_URL`/`BACKUP_DIRECTORY` ya se documentan solo en prosa
en `docs/OPERATIONS.md`, que ahora también documenta las dos variables
nuevas ahí. `docs/CLIENT_PROPOSAL_EXPERIENCE.md` (sección "Deployment
boundary") actualizado de "gap conocido" a "resuelto".

La Fase 12.2 del plan de expansión (dashboard de propuestas —
`docs/STUDIO_EXPANSION_PLAN.md`) está **completa**. `/proposals`
(`app/proposals/page.tsx` +
`components/dashboard/ProposalDashboard.tsx`) reemplaza a la propuesta seed
única como punto de entrada — `/` ahora redirige ahí en vez de a
`/proposals/1/editor`. La lista (`lib/db/getProposalList.ts`) es una tabla
con nombre, cliente, valor, estado (badge), diseño, páginas y última
actividad, con búsqueda/filtro/orden en cliente (dataset chico, sin
paginación de servidor). **Decisiones de esta fase:** "valor" es
`proposalPricing.invoiceTotal` (el total bruto del paquete, no el neto
después de comisión); "páginas" se calcula corriendo `getProposalData` por
fila (cuenta real post-paginación, no el conteo crudo de `proposalSections`)
— aceptable a esta escala de app, documentado como pendiente si la cantidad
de propuestas crece lo suficiente como para importar; "última actividad" es
el máximo entre `proposals.updatedAt` y el último `proposalEvents.createdAt`
de esa propuesta. `proposalNumber` para propuestas nuevas se genera
insertando con un placeholder único (`crypto.randomUUID()`) y renombrando a
`PRO-{id}` en la misma transacción una vez conocido el id
(`lib/db/generateProposalNumber.ts`, función pura cubierta en
`tests/core.test.mts`) — evita cualquier condición de carrera por conteo.

**Creación** (`app/proposals/actions.ts::createProposal`, diálogo
`components/dashboard/CreateProposalDialog.tsx`, modal centrado con el mismo
patrón de foco/Escape/Tab que `ShareProposalButton.tsx`) ofrece cliente
existente o nuevo, nombre de viaje, diseño inicial (selector del registro) y
origen en blanco o duplicado. **"En blanco" significa literalmente cero
filas `proposal_sections`** — se investigó y confirmó que
`getProposalData.ts` ya tolera esto (cover/from-owners/details se derivan
siempre de `proposals`/`company`/`clients`, nunca de `proposal_sections`), y
se decidió con el usuario no introducir un concepto nuevo de "secciones
default por diseño" en el contrato de diseño solo para este flujo — el
usuario arma el documento con las herramientas de inserción ya existentes
(Fase 11). **Duplicar** (`lib/db/duplicateProposal.ts`, reusado tanto por el
botón de fila como por el origen "duplicado" del diálogo de creación) es una
copia profunda de todo el grafo — días+hijos, hoteles (con remapeo de id
viejo→nuevo, porque `proposal_sections.refId` de tipo `hotel` apunta ahí),
excursiones, listas+líneas, pricing+calendario de pagos, y **todas** las
filas de `proposal_sections` incluyendo la virtual `fromOwnersOverride` — sin
compartir ninguna fila hija con el original. Revisiones/shares/eventos
**no** se copian a propósito (la copia arranca con estado `draft` y sin
historial de compartir). **Archivar/restaurar** son transiciones manuales
que bypasean `nextProposalStatus` (que excluye `lost`/`archived` a
propósito); restaurar siempre vuelve a `draft` (no hay concepto de "estado
antes de archivar" que recuperar). **Eliminar** solo aplica a propuestas
`draft` sin ninguna fila en `proposalShares` — como el estado nunca retrocede
de `sent` a `draft`, chequear `status === "draft"` ya implica "nunca
compartida", el chequeo de `proposalShares` es defensa adicional, no la
única barrera. El borrado depende del `onDelete: cascade` ya declarado en el
esquema (`foreign_keys = ON` en `lib/db/client.ts`) — sin limpieza manual
por tabla.

Toda la UI nueva usa exclusivamente primitivas de `components/editor/EditorUi.tsx`
y tokens `editor-*` (nunca `components/ui/button.tsx`, que es shadcn
genérico y no pertenece al design system del studio). Se detectó y corrigió
un problema real durante la verificación: los links de fila a
`/proposals/{id}/editor` y `/preview` con el prefetch por default de
`next/link` disparaban, con la tabla completa a la vista, un SSR pesado
completo (`getProposalData`+`getProposalDesignContext`+`getProposalEditorData`+
`getProposalCatalogData`+`getProposalCompositionData`) por cada fila en
paralelo — con SQLite síncrono (`better-sqlite3`) bloqueando el event loop,
esto causaba cuelgues intermitentes de ~90s en los tests e2e nuevos bajo
carga (varias filas a la vez). Corregido con `prefetch={false}` en los tres
links de fila — no hacía falta ese prefetch para una tabla de administración
interna. **Pendiente descubierto, no introducido por esta fase:** 4 tests de
`editor.spec.ts` (accesibilidad, edición inline, popover de imagen ×2) fallan
de forma intermitente en el proyecto `mobile` de Playwright — reproducido
corriendo *solo* `editor.spec.ts` (sin ningún archivo de dashboard
involucrado) contra una base de datos recién sembrada, así que es
preexistente al plan de expansión, no algo que ligar a 12.2; no investigado
en profundidad todavía. Cubierto por 4 tests e2e nuevos en
`tests/e2e/dashboard.spec.ts` (desktop-only, mismo criterio que 11.x: listar
con búsqueda; crear en blanco y verificar 3 páginas base; duplicar produce
un id independiente; archivar/restaurar/eliminar en el ciclo completo).

La Fase 12.1 del plan de expansión (promoción de esquema —
`docs/STUDIO_EXPANSION_PLAN.md`) está **completa**. Los 7 `sectionType`
"virtuales" que vivían mezclados en `proposal_sections`
(`documentDesign`, `proposalRevision`, `shareSettings`,
`proposalLifecycleEvent`, `proposalApproval`, `pdfGeneration`, más
`fromOwnersOverride`, que queda fuera de alcance a propósito por ser un
override de contenido, no de compartir/revisiones) se redujeron a 6
promovidos a tablas/columnas reales — `fromOwnersOverride` sigue siendo
virtual. Diseño nuevo (`lib/db/schema.ts`): `proposals` gana columnas
`designId`/`designVersion` (reemplaza `documentDesign`); `proposalRevisions`
guarda el snapshot completo (`data`+`design`) que ya se tomaba al crear un
share — **la investigación previa confirmó que "revisión" ya era un
snapshot real** (`createProposalShare` llamaba `getProposalData` en el
momento de compartir; `/share/[token]` nunca vuelve a consultar la
propuesta viva), así que la migración fue de storage, no de semántica;
`proposalShares` reemplaza `shareSettings` con `token` como columna
`unique()` (antes `getSharedProposal.ts` escaneaba en JS TODAS las filas
`shareSettings` de TODAS las propuestas buscando el token — ahora es una
consulta directa) y gana `revokedAt` (columna nueva, ya respetada en la
lectura — un share revocado resuelve igual que un token desconocido — pero
sin UI para setearla todavía, eso es 12.2); `proposalEvents` consolida
`proposalLifecycleEvent`+`proposalApproval`+`pdfGeneration` en un solo log
de eventos (los tres eran write-only sin ningún read site, confirmado antes
de migrar). `proposals.status` ya existía pero nunca se escribía en ningún
lado (confirmado por grep); se amplió el vocabulario a
`draft|sent|viewed|approved|lost|archived` y se conectaron las
transiciones automáticas (`lib/db/proposalStatus.ts`, monótonas — nunca
retroceden, nunca pisan `lost`/`archived`): `sent` al compartir, `viewed`
al abrir el link, `approved` al aprobar. `lost`/`archived`/reabrir son
manuales y quedan pendientes de UI (Fase 12.2, sin dashboard todavía).
`VIRTUAL_TYPES`, que estaba duplicado en `compositionActions.ts` y
`getProposalCompositionData.ts`, se consolidó en
`lib/db/virtualSectionTypes.ts`. La migración SQL generada por
`drizzle-kit generate` tenía un bug real (el `INSERT INTO __new_proposals
... SELECT` intentaba leer `design_id`/`design_version` de la tabla vieja,
que todavía no las tenía) — se corrigió a mano en
`lib/db/migrations/0001_productive_donald_blake.sql` antes de aplicarla.
`scripts/backfillVirtualProposalSections.ts` (uno-vez, defensivo — la DB de
dev tenía cero filas virtuales al momento de migrar) traslada cualquier
fila virtual vieja restante a las tablas nuevas y borra las filas viejas;
probado insertando un set completo a mano y verificando la migración +
limpieza. Verificado de punta a punta contra un servidor real: cambiar
diseño, generar PDF, crear share con y sin password, abrir el link,
desbloquear, aprobar — confirmando en cada paso que `proposals.status`
avanza (`draft→sent→viewed→approved` en la corrida real) y que las tablas
nuevas quedan correctas. `tests/http.integration.test.mjs`
(`npm run test:integration`) ya cubría automatizado este flujo completo por
HTTP contra un servidor real (compartir, PDF, password, aprobación) — sigue
pasando sin cambios; no hizo falta agregar un test e2e nuevo para cerrar
ese hueco como se había anticipado, porque el hueco no existía. Suite e2e
completa (desktop+mobile) y `npm run test` verificados sin regresiones.

La Fase 10 del plan de expansión (edición directa en el canvas —
`docs/STUDIO_EXPANSION_PLAN.md`) está **completa (10.1–10.4)**.
`lib/editor/editableRegions.ts` define regiones editables tipadas
(`data-edit-field`/`data-edit-kind`) y los 16 bloques del diseño de
referencia están anotados; click en una región selecciona la página y
cambia el inspector a Content mode. Para campos simples de guardado
automático (Cover salvo el título rotado, Details, dividers, Thank You —
17 campos) el click abre un editor **inline directamente sobre la página**
(`InlineRegionEditor`, portado con `createPortal` dentro del propio
`[data-page-content]`, posicionado y estilizado copiando
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
corridas separadas por proyecto).

La Fase 11.1 del plan de expansión (reordenar secciones arrastrando
miniaturas en el panel Pages — `docs/STUDIO_EXPANSION_PLAN.md`) está
**completa**. `PageNavigator`/`PageThumbnail` se extrajeron de
`ProposalEditorShell.tsx` (que ya superaba 1900 líneas) a
`components/editor/PageNavigator.tsx`, junto con un hook nuevo y reusable
`usePointerReorder.ts` que implementa la mecánica de drag con pointer events
propios (umbral de activación, auto-scroll, cancelación con Escape) sin
ninguna librería de DnD, tal como pedía el plan. El reorden por drag reusa
100% la action existente `moveProposalSection` (la misma que ya usaban los
botones Move up/down de Document Structure) — no hubo cambio de servidor.
Solo la primera página de cada sección (`sourceSectionId`) es arrastrable;
las páginas de continuación de paginación se mueven con su sección. El
algoritmo que traduce una posición de drop visible a la cantidad de
llamadas `moveProposalSection` necesarias tiene una sutileza real: el
orden visible (`pageMeta`, solo secciones visibles) y el orden raw que la
action manipula (`composition.items`, incluye ocultas/borradas) pueden
divergir, así que el índice de destino se calcula sobre el array raw *sin*
la sección arrastrada, no sobre el array completo — calcularlo mal desplaza
la sección una posición de más cuando hay secciones ocultas de por medio
(validado con un subagente antes de implementar, y confirmado end-to-end
con drags reales contra la base de datos). El drag es desktop-only a
propósito (el criterio de aceptación de la fase pide que mobile conserve
exclusivamente el camino por botones); el drawer de Pages en mobile no
recibe `enableDrag` y no expone handles. Cubierto por 2 tests e2e nuevos
(reorder bidireccional en desktop con persistencia verificada tras reload;
ausencia de handles + botones intactos en mobile).

La Fase 11.3 (affordance "+" entre páginas para insertar secciones de
plantilla en cualquier posición) está **completa**, junto con la base de
servidor que la desbloqueó: `lib/composition/insertionOrder.ts` expone
`resolveInsertionOrders(rows, afterSectionId, count)`, que generaliza el
shift-por-10 que ya usaba `duplicateProposalSection` para insertar `count`
filas nuevas inmediatamente después de un `afterSectionId` dado (`null`
inserta al principio del espacio de `sortOrder`; `undefined` preserva el
comportamiento previo de agregar al final). Las tres actions de inserción
(`addProposalSection`, `addCatalogHotelToProposal`,
`addCatalogExcursionToProposal`) ahora aceptan un `afterSectionId` opcional
sin romper ningún sitio de llamada existente (el parámetro es
retrocompatible: omitirlo agrega al final, igual que antes). Para
excursiones, la posición solo aplica cuando se crea un cityToursDivider
nuevo (ciudad sin lista todavía); agregar un ítem a una lista de excursiones
ya existente no inserta una fila de sección nueva, así que no hay nada que
posicionar en ese caso — comportamiento esperado, no una limitación a
resolver. En el cliente, `computeSectionRuns` (antes local a
`PageNavigator.tsx`) se extrajo a `lib/editor/sectionRuns.ts` para
compartirla con el nuevo `components/editor/InsertionGap.tsx`: un botón "+"
(44px de objetivo táctil, visible en hover/foco) que se renderiza en el
canvas antes de cada página que inicia una sección y al final del
documento, usando exactamente la misma noción de "run" que ya usa el drag
de reorden de 11.1 — por eso el gap "al principio" aparece antes de la
primera sección respaldada por `proposalSections`, no antes de Cover/
Details/From Owners (esas páginas no tienen `editorSource`, así que quedan
fuera del rango insertable/arrastrable, igual que ya quedan fuera del
panel Document Structure). El menú del botón ofrece las mismas 3 secciones
de plantilla que `CompositionPanel` (ahora en `lib/editor/addableSections.ts`,
compartido). Cubierto por 2 tests e2e nuevos (inserción en la posición
exacta con persistencia tras reload; alcance por teclado con Escape para
cancelar sin cambios), desktop-only porque la verificación lee el panel
Pages, que en mobile vive en un drawer.

La Fase 11.2 (arrastrar hoteles/excursiones del catálogo al canvas) está
**completa**, cerrando toda la Fase 11. Al investigar el punto de partida
se encontró que `CatalogPanel` era un modal a pantalla completa
(`EditorDrawer`: `fixed inset-0` + overlay que tapa el canvas y cierra al
click afuera) — mientras estaba abierto el canvas no era visible ni
interactuable, así que un drag literal del catálogo al canvas no era
posible sin acoplarlo primero. **Decisión de diseño nueva:** `CatalogPanel`
se acopla como 4ta columna del shell en un breakpoint nuevo `2xl:`
(`ProposalEditorShell.tsx`, grid `2xl:grid-cols-[252px_minmax(0,1fr)_304px_380px]`),
mismo patrón que ya usa `PropertiesPanel` en `xl:` (aside oculto por
defecto, sin `onClose`, con el botón de toolbar correspondiente ganando
`2xl:hidden`). Por debajo de `2xl` el catálogo sigue siendo exactamente el
mismo modal de siempre — sigue siendo el camino accesible equivalente en
cualquier ancho, ya que el botón "Add to proposal" (agrega al final, sin
drag) nunca se tocó. `CatalogPanel.onClose` pasó a opcional
(`EditorPanelHeader` ya no renderiza el botón de cerrar si no se provee).

La mecánica de arrastre es un hook nuevo,
`components/editor/useCatalogDragInsert.ts`, instanciado en
`ProposalEditorShell` (no en `CatalogPanel`) porque el origen del drag
(catálogo) y el destino (gaps del canvas) viven en árboles de componentes
distintos — el hook expone `startDrag(item, event)` que `CatalogPanel`
llama desde un handle `GripVertical` (mismo ícono/patrón que
`PageNavigator` usa para 11.1) en cada card no seleccionada y compatible
con `designContext.active.supportedSectionTypes`. Sigue la misma mecánica
de `usePointerReorder.ts` (umbral de activación, listeners en `window`,
cancelación con Escape, auto-scroll), pero calcula el gap de destino
comparando la posición del puntero contra los rects reales de
`pageRefs.current` en cada página que inicia una sección (`sectionRuns`,
el mismo dato que ya usa `InsertionGap`) — no hizo falta que `InsertionGap`
se registre como drop target, es el mismo "punto más cercano" que
`computeGap` de `usePointerReorder` pero aplicado a rects de página en vez
de miniaturas. Al soltar sobre un gap válido llama
`addCatalogHotelToProposal`/`addCatalogExcursionToProposal` con el
`afterSectionId` de ese gap (ya soportado desde 11.3, sin cambios de
servidor). `InsertionGap.tsx` ganó una prop `highlighted` puramente visual
(línea/botón resaltados en verde) que `ProposalEditorShell` activa cuando
el gap coincide con el hover del drag — su lógica de click-to-open-menu
(11.3) queda intacta y es independiente. Un ghost preview simple
(`position: fixed`, portaled a `document.body`, `pointer-events-none`)
sigue el puntero mientras se arrastra.

**Nota de comportamiento documentada, no un bug:** para una excursión cuya
ciudad ya tiene una lista en la propuesta, la posición de drop no tiene
efecto — el ítem se agrega a la sección `excursionList` existente en vez de
crear una nueva (mismo comportamiento ya documentado para 11.3 en
`catalogActions.ts`); no se bloquea el drag en ese caso, simplemente no
reposiciona nada.

Cubierto por 2 tests e2e nuevos, ambos a un viewport ancho explícito
(1600×900, porque `2xl` cae fuera del viewport por defecto del proyecto
`desktop` de Playwright): arrastrar un hotel recién insertado sin vincular
(`insertUnlinkedHotel`, vía `better-sqlite3` directo en el test, ya que el
dataset seed vincula todos sus hoteles/excursiones a la propuesta 1 y no
deja ninguno "sin agregar" para arrastrar) a un gap específico lo inserta
ahí y persiste tras reload; y que por debajo de `2xl` el catálogo sigue
siendo modal, con Escape cancelando un drag en curso sin cambios. Ambos
desktop-only (mismo criterio que 11.1/11.3: la verificación lee el panel
Pages y el catálogo acoplado, ninguno disponible en mobile).

En paralelo sigue pendiente importar el paquete de marca aprobado para
cerrar el último criterio de Fase 9; el pipeline de import ya está listo
(logo wordmark e íconos fijos de sección config-driven vía
`lib/brand/config.ts`, tipografía de encabezado resuelta por una sola
cadena de variables CSS en `app/globals.css`), documentado en
`docs/BRAND_ASSET_PACK.md` — solo falta que lleguen los assets reales con
derechos confirmados.

Pruebas, accesibilidad, paginación medida, persistencia, backup,
recuperación y observabilidad están completos. La Fase 8 está completa con
snapshots inmutables, vista responsive, password/expiration, eventos y
aprobación por revisión. La Fase 7 está completa con generación PDF por
propuesta, descargas únicas, estados/retry, metadata y smoke test real de
34 páginas. La Fase 6 está completa con inserción, reordenamiento,
duplicación, hide/show, borrado recuperable, variantes y readiness review.
La Fase 5 está completa con catálogo contextual de hoteles/excursiones,
filtros geográficos, inserción segura, creación ligera, control de
duplicados y edición explícita de defaults versus overrides de propuesta.
La Fase 4 está completa con un editor travel-native de días, actividades,
narrativa e imágenes, modos expandido/condensado, reordenamiento,
duplicación y warnings de paginación. La implementación de Fase 3.4 está
completa con modos Content/Design, variantes contextuales, metadata
plegable y Review, validada por Playwright en desktop y móvil. La Fase 3.3
está completa: el diseño activo es proposal-scoped, el selector valida
compatibilidad en cliente y servidor, la geometría viene del contrato y
Safari Editorial/Minimal Grid prueban el registro versionado. La Fase 3.2
está completa: el shell usa tokens semánticos y primitivas comunes para
botones, encabezados, avisos, campos, secciones, controles segmentados,
page cards, badges, drawers y empty states. La Fase 3.1 de especificación
UX está completa. La Fase 2 está completa: todas las páginas con
contenido tienen formulario persistente, incluyendo From Owners, Important
Items, overrides visuales de hotel y un único editor de itinerario
compartido por Overview y Day Itinerary.

## Historial de fases del editor (detalle técnico)

- **Quality pass (Fase 1.1)**: el canvas calcula "fit to page" con
  `ResizeObserver`; páginas y propiedades se convierten en drawers en
  pantallas pequeñas; controles táctiles usan objetivos cercanos a 44px;
  hay foco visible, navegación con PageUp/PageDown y cierre con Escape. La
  lista usa miniaturas reales, descripciones para distinguir páginas
  repetidas y estados neutrales basados en render ("Loaded/Rendered"), sin
  exponer fases internas al usuario. La portada demo usa
  `public/proposal-assets/cover-zebras-v1.png`, derivada de la referencia
  visual de la pág. 1, en lugar del placeholder de Picsum.
- **Navegación continua (Fase 1.2)**: el editor muestra el documento
  completo en una columna vertical con scroll nativo. La página visible se
  sincroniza con miniaturas, contador y propiedades mediante
  `IntersectionObserver`; miniaturas, anterior/siguiente y PageUp/PageDown
  desplazan a la página elegida. Se conservan los modos Continuo y Página
  individual, con ajuste de ancho o página según corresponda.
- **Edición estructurada (Fase 2.1)**: Portada y Detalles tienen
  formularios contextuales reales en el panel de propiedades.
  `getProposalEditorData.ts` construye los campos editables;
  `app/proposals/[id]/editor/actions.ts` valida una allowlist por tipo y
  persiste propuesta/cliente dentro de una transacción. El cliente ofrece
  autosave con debounce, guardado al salir del formulario, botón manual,
  estados Loaded/Unsaved/Saving/Saved/Error y refresca editor y preview
  desde los datos canónicos. No se escriben registros compartidos del
  catálogo desde estos formularios.
- **Overrides seguros (Fase 2.2)**: cada página derivada de
  `proposal_sections` conserva `editorSource` (section/ref id) incluso
  después de paginar. Ya se editan reservas de hotel, importes/moneda/intro
  de pricing, dividers triangulares y de imagen, introducción de tours y
  cierre. Las actions verifican que booking/sección pertenecen a la
  propuesta; los campos visuales se guardan en el payload privado de la
  sección y nunca pisan el hotel/ciudad del catálogo. El render de pricing
  respeta el código de moneda guardado.
- **Colecciones proposal-scoped (Fase 2.3A)**: Inclusiones/Exclusiones se
  editan por columna con formato `[Heading]` + líneas, y el calendario de
  pagos usa `Label | Value`. Ambos requieren guardado explícito, se validan
  antes de escribir y reemplazan padres/hijos dentro de una transacción. Si
  el formulario está dirty, cambiar de página o cerrar el drawer pide
  confirmación; el scroll continuo no cambia la selección hasta guardar o
  descartar.
- **Snapshots privados (Fase 2.3B)**: Excursiones, clima y términos tienen
  editores de colección con guardado explícito y parsers server-side. El
  primer guardado copia el contenido renderizado al payload de la sección
  de la propuesta; desde ese momento no depende de cambios futuros en
  catálogos o plantillas globales. La recarga reconstruye un solo
  formulario aunque la colección ocupe varias páginas, y la selección
  tolera cambios de paginación.
- **Cobertura estática completa (Fase 2.3C)**: From Owners guarda mensaje,
  firmas y foto en una sección virtual privada; Important Items guarda un
  snapshot de requisitos; Hotel combina reserva con nombre, descripción e
  imágenes proposal-scoped. Ningún formulario modifica company,
  destination, requirement ni hotel catalog.
- **Formulario canónico de itinerario (Fase 2.4)**: Overview y Day
  Itinerary muestran el mismo editor explícito de días, fechas, subtítulos,
  highlights, actividades, párrafos e imágenes. El guardado reemplaza el
  grafo relacional completo dentro de una transacción y repagina ambos
  tipos de bloque.

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
- **Iconos/ilustraciones/logo:** el logo wordmark y los dos íconos fijos de
  sección (globo, triángulo de advertencia) ya son config-driven vía
  `lib/brand/config.ts` (ver `docs/BRAND_ASSET_PACK.md`), pero sin asset
  real todavía renderizan como texto/emoji. Nota: los emoji de bandera
  compuestos (🇹🇿) no renderizan en Chromium headless — usar emoji de un
  solo codepoint (🌍, etc.) en su lugar.
- **Catálogo acoplado solo en `2xl:`:** `CatalogPanel` es modal (`EditorDrawer`)
  en cualquier ancho por debajo de `2xl` (~1536px) y panel fijo (4ta
  columna del shell) desde `2xl:` en adelante — necesario para que el drag
  del catálogo al canvas (Fase 11.2) tenga ambos paneles visibles a la vez.
  No se acopló en `xl:` (donde ya vive `PropertiesPanel`) para no competir
  por espacio ni forzar un toggle nuevo; el resultado es que el drag-insert
  desde catálogo es una mejora exclusiva de pantallas anchas, con el modal
  + botón "Add to proposal" como camino completo y accesible en cualquier
  otro ancho.

## Pendientes conocidos

**Fidelidad visual (deferred desde el inicio del proyecto):**
- ~~La portada deja una letra sola al envolver el subtítulo estrecho~~ —
  corregido: `coverSubtitle` y `clientName` en `CoverBlock.tsx` usan
  `text-pretty` (CSS `text-wrap: pretty`, soportado por el Chromium de
  Playwright), que rebalancea las líneas para no dejar una palabra corta
  huérfana. Reproducido y verificado con el string real del seed
  ("An Unforgettable Tanzanian Experience For": sin el fix la última línea
  medía 28px de ancho — una sola palabra —; con el fix, [138, 77, 116]).
  Como `coverSubtitle`/`clientName` son campos editables por el usuario, el
  fix es genérico (cualquier texto futuro), no un ajuste del string default.
- Fuentes custom del original (Prata, BankGothicBT, Muli, Gotham-Bold,
  PalmClubScript, Oswald, EBGaramond, etc.) — todo usa la fuente sans por
  defecto + serif/italic genérico como aproximación. El hook para
  reemplazarlas ya existe (`--font-serif` → `--font-heading` →
  `--font-brand-heading` en `app/globals.css`); ver `docs/BRAND_ASSET_PACK.md`.
- Logo real como imagen — sigue siendo texto placeholder (config-driven,
  ver arriba).
- ~~Iconos e ilustraciones hechas a mano (pasaporte, visa, conchas,
  clima)~~ — parcialmente atendido (ver "Limpieza de pendientes" arriba):
  emoji del seed mejorados/completados donde faltaban (clima, seguro de
  Zanzibar). Sigue siendo contenido por-registro en `lib/db/seed.ts` con
  emoji, no íconos vectoriales — decisión explícita de mantenerlo así
  porque el campo es texto libre editable por el usuario, no un
  vocabulario cerrado tipo brand-pack.

**Estructural:**
- Overview/ExcursionList/TermsConditions se dividen primero con presupuestos
  heurísticos y después se verifican con medición DOM real en Review, PDF y
  Playwright. El caso seed de 10 días, 16 excursiones y 9 secciones de términos
  genera 34 páginas sin texto fuera del área imprimible.
- `DayItineraryBlock` usa un orden fijo (título→imágenes→texto) para ambas
  columnas cuando hay 2 días por página; el original alterna el orden según
  el espacio disponible por columna en un flujo continuo tipo revista, que
  puede partir un día entre columnas/páginas — **investigado en detalle,
  decisión explícita de no replicarlo** (ver "Limpieza de pendientes"
  arriba): requeriría rediseñar el motor de paginación de itinerario, no
  un reorden acotado. Queda como limitación de arquitectura permanente,
  no como pendiente activo.
- ~~`ExcursionItem.price` es un string simple con el calificador
  concatenado~~ — corregido: `ExcursionItem` ahora tiene `priceNote?: string`
  separado de `price`. La tabla catálogo (`excursions.priceNote`) ya era
  estructurada; el problema estaba solo en `formatPrice()` de
  `getProposalData.ts`, que unía todo en un string. `ExcursionListBlock.tsx`
  renderiza el note en una línea chica arriba del precio en negrita, como en
  pág. 25. El editor de colección explícita (formato `[Title]`/`Price:`/
  `Image:`/`Description:` en `actions.ts`) gana una línea `Note:` opcional,
  simétrica en parser (`parseExcursionSnapshot`) y serializador
  (`formatExcursionSnapshot`). Snapshots ya guardados con el string viejo
  ("$13,000 (per helicopter...)") siguen renderizando igual que antes hasta
  que se re-guarden — sin migración de datos.
- ~~`sampleProposalData.ts` es representativo (32 páginas: 2 hoteles, no 3;
  Arusha únicamente, falta Karatu)~~ — completado (ver "Limpieza de
  pendientes" arriba): se agregó el 3er hotel (Serengeti Signature Safari
  Lodge) y la sección de excursiones de Karatu, transcritos de
  `reference/pdf-pages/page-11/12/26-29.png`.

**Proposal Studio pendiente:**
- La cobertura de formularios del documento está completa. Las Fases 10–17
  enteras del plan de expansión están completas (ver "Fases 14–17 del plan
  de expansión completas" arriba). Pendiente: el brand asset pack (ver
  `docs/BRAND_ASSET_PACK.md`) para cerrar Fase 9, bloqueado en assets
  externos — es el único criterio abierto de todo `STUDIO_EXPANSION_PLAN.md`.
  El orden y criterios están en `docs/EDITOR_IMPLEMENTATION_PLAN.md` y
  `docs/STUDIO_EXPANSION_PLAN.md`.
- ~~4 tests de `editor.spec.ts` fallaban de forma intermitente en mobile.~~
  Resuelto al aislar la base y el build E2E, partir siempre del seed y ejecutar
  únicamente los escenarios aplicables a cada proyecto; la corrida completa
  actual termina con 43 passed y 0 skipped.
- **Nuevo, encontrado al verificar "Paleta de inserción unificada" (arriba,
  2026-08-25) — no corregido, fuera de alcance de ese cambio.** La corrida
  completa ya no da 43/0 — hay 6 fallos deterministas, reproducidos
  idénticos tanto con el cambio de este pase aplicado como contra el commit
  base sin él (vía `git stash`), así que son preexistentes y no relacionados
  con la paleta/drag-drop: (1-2) `dashboard.spec.ts` — "duplicating a
  proposal" y "archive, restore and delete", ambas timeout esperando
  controles de la fila `DEMO-0001`; (3) `auth.spec.ts` — "logout clears the
  session" en mobile, el botón "Log out" queda bloqueado por otro elemento
  que intercepta el click; (4) `editor.spec.ts` — "editor exposes document,
  catalog..." en mobile, el heading "The Mainland Tour" queda `hidden`; (5-6)
  `editor.spec.ts` — "rendered pages annotate editable regions..." en
  desktop y mobile, el contrato de `data-edit-kind` espera
  `"text"|"multiline"|"image"` pero encuentra `"collection"` en al menos una
  región del canvas — sugiere que algún bloque nuevo (posiblemente de la
  Biblioteca de Itinerarios Fase 2, o del renderer Minimal Grid) empezó a
  emitir un `data-edit-kind="collection"` que el test todavía no contempla,
  o que la lista blanca del test quedó desactualizada. Ninguno de los 6
  toca `InsertionGap`/`CatalogPanel`/el drag ghost. Queda pendiente
  investigar la causa raíz y decidir si es el contrato o el test el que
  hay que actualizar.
