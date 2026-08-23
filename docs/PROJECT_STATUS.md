# Project status

This file is the changelog/status log: what has been built, what was
decided and why, and what remains open. `CLAUDE.md` stays reserved for
durable rules and architecture an agent needs on every session — update
this file, not `CLAUDE.md`, when a phase finishes, a design decision gets
made, or a new pendiente is found.

## Estado general

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

**Pendiente dentro de la misma fase:** 11.2 (arrastrar ítems del catálogo al
canvas para insertarlos) y 11.3 (affordance "+" en hover entre páginas,
alternativa sin drag) quedaron fuera de esta sesión a propósito — a
diferencia de 11.1, ambas requieren un cambio de servidor real: las actions
de inserción (`addProposalSection`, `addCatalogHotelToProposal`,
`addCatalogExcursionToProposal`) hoy solo agregan al final de la
composición; necesitan aceptar una posición explícita (o insertar y
reubicar transaccionalmente) antes de que cualquiera de las dos
interacciones sea posible. Insertar un hotel además crea 2+ secciones a la
vez (divider + detalle), que tendrían que reubicarse juntas. Este es el
punto de partida exacto para retomar — no hace falta re-investigar el
mapeo de `CompositionPanel`/`CatalogPanel`/actions, ya está hecho.

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
- La cobertura de formularios del documento está completa. Fase 10 y Fase
  11.1 del plan de expansión están completas. El siguiente trabajo es (a)
  el brand asset pack (ver `docs/BRAND_ASSET_PACK.md`) para cerrar Fase 9,
  bloqueado en assets externos, y (b) Fase 11.2/11.3 (drag-insert desde
  catálogo y affordance "+" de inserción), que requieren extender las
  actions de inserción con una posición — ver el detalle en "Estado
  general" arriba. Después siguen las Fases 12+. El orden y criterios
  están en `docs/EDITOR_IMPLEMENTATION_PLAN.md` y
  `docs/STUDIO_EXPANSION_PLAN.md`.
