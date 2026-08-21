@AGENTS.md
# Melanated Safaris — Proposal Generator

## Objetivo
Sistema que reemplaza proposals hechos a mano en Canva (1 hora por cambio)
por un motor de bloques HTML/CSS + Playwright que genera PDFs, con
contenido variable (días, hoteles, excursiones) sin romper el diseño.

## Cómo mantener este archivo (leer antes de trabajar)
- **Actualizar esta sección de estado en cada paso relevante** — cuando se
  construye/corrige un bloque, se cambia una decisión de diseño, o se
  descubre un pendiente nuevo, reflejarlo acá en el mismo turno, no al
  final de la sesión. Este archivo es la fuente de verdad de "qué está
  hecho y qué falta", no un resumen retroactivo.
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
El documento original NO es consistente entre secciones (fue armado a mano
en Canva) — cuando haya conflicto entre "replicar el original exacto" y
"mantener consistencia del sistema", priorizar consistencia del sistema y
documentarlo acá.

## Arquitectura
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + Playwright + `qrcode`.
- Cada bloque: componente en `components/blocks/{Nombre}Block.tsx`, tipo en
  `lib/types.ts`, ruta de preview en `app/preview/{nombre}/page.tsx`, script
  de render standalone en `lib/render/render{Nombre}.ts` + entrada
  `render:{nombre}` en `package.json`.
- Página fija: 816×1056px (Letter a 96dpi). Margen lateral estándar
  82px (`px-[82px]`). Componentes compartidos en `components/blocks/shared/`:
  `SectionHeader` (título + línea), `PageHeader` (logo centrado o solo
  "Proposal"), `PageFooter` (número de página abajo-derecha — estándar
  único del sistema, ver más abajo).
- **Documento completo**: `lib/sampleProposalData.ts` arma el `ProposalData`
  (unión discriminada `ProposalSection` en `lib/types.ts`) con datos reales
  extraídos del PDF de referencia. `components/ProposalRenderer.tsx` lo
  recorre y renderiza cada bloque con `break-after: page` entre secciones.
  Preview en `/preview/full-proposal`, render con `npm run render:full` →
  `output/full-proposal.pdf`.
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

**Fuera de alcance, nunca pedido:**
- No hay forma de que un usuario real cargue datos de un cliente
  (formulario/API) — todo sigue siendo data de prueba hardcodeada en
  `lib/sampleProposalData.ts`.
