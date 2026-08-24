# Project status

This file is the changelog/status log: what has been built, what was
decided and why, and what remains open. `CLAUDE.md` stays reserved for
durable rules and architecture an agent needs on every session — update
this file, not `CLAUDE.md`, when a phase finishes, a design decision gets
made, or a new pendiente is found.

## Estado general

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
  (**11.1–11.3**), la Fase 12 entera (**12.1–12.3**: promoción de esquema,
  dashboard de propuestas, autenticación mínima) y la Fase 13.1 (plantillas
  de propuesta) del plan de expansión están completas. Pendiente: el brand
  asset pack (ver `docs/BRAND_ASSET_PACK.md`) para cerrar Fase 9, bloqueado
  en assets externos. Después siguen 13.2 (secciones guardadas/snippets),
  13.3 (biblioteca de imágenes) y 13.4 (biblioteca de fees) para cerrar la
  Fase 13, luego las Fases 14+. El orden y criterios están en
  `docs/EDITOR_IMPLEMENTATION_PLAN.md` y `docs/STUDIO_EXPANSION_PLAN.md`.
- ~~4 tests de `editor.spec.ts` fallaban de forma intermitente en mobile.~~
  Resuelto al aislar la base y el build E2E, partir siempre del seed y ejecutar
  únicamente los escenarios aplicables a cada proyecto; la corrida completa
  actual termina con 43 passed y 0 skipped.
