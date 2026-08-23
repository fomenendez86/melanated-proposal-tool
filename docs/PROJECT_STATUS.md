# Project status

This file is the changelog/status log: what has been built, what was
decided and why, and what remains open. `CLAUDE.md` stays reserved for
durable rules and architecture an agent needs on every session — update
this file, not `CLAUDE.md`, when a phase finishes, a design decision gets
made, or a new pendiente is found.

## Estado general

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
- Iconos e ilustraciones hechas a mano (pasaporte, visa, conchas, clima,
  bandera de Tanzania) — contenido por-registro en `lib/db/seed.ts`, todo
  con emoji; no son brand-pack, son un pendiente de contenido/catálogo
  separado.

**Estructural:**
- Overview/ExcursionList/TermsConditions se dividen primero con presupuestos
  heurísticos y después se verifican con medición DOM real en Review, PDF y
  Playwright. El caso seed de 10 días, 16 excursiones y 9 secciones de términos
  genera 34 páginas sin texto fuera del área imprimible.
- `DayItineraryBlock` usa un orden fijo (título→imágenes→texto) para ambas
  columnas cuando hay 2 días por página; el original alterna el orden según
  el espacio disponible por columna — no replicado.
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
- `sampleProposalData.ts` es representativo (32 páginas: 2 hoteles, no 3;
  Arusha únicamente, falta Karatu) — el mecanismo de ensamblado ya soporta
  agregar más secciones, solo falta cargarlas.

**Proposal Studio pendiente:**
- La cobertura de formularios del documento está completa. La Fase 11
  (**11.1–11.3**) y la Fase 12.1 (promoción de esquema) del plan de
  expansión están completas. Pendiente: el brand asset pack (ver
  `docs/BRAND_ASSET_PACK.md`) para cerrar Fase 9, bloqueado en assets
  externos; y dentro de la Fase 12, **12.2** (dashboard de propuestas —
  listar/crear/duplicar/archivar N propuestas, y ahí sí exponer las
  transiciones manuales `lost`/`archived`/reabrir que 12.1 dejó en el
  schema pero sin UI) y **12.3** (autenticación mínima), ambas apoyadas
  directamente sobre las tablas/columnas que dejó 12.1 sin requerir más
  cambios de servidor. Después siguen las Fases 13+. El orden y criterios
  están en `docs/EDITOR_IMPLEMENTATION_PLAN.md` y
  `docs/STUDIO_EXPANSION_PLAN.md`.
