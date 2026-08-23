# Proposal Studio — Plan de expansión (Fases 10–17)

**Estado:** Plan aprobado; Fase 10 completa (regiones editables, selección en
canvas/puente con el inspector, edición de texto inline para campos simples,
interacción de imágenes con popover en canvas). Fase 11.1 completa (reorden
de secciones arrastrando miniaturas en el panel Pages). Fase 11.3 completa
(affordance "+" entre páginas, con posición explícita de inserción en las 3
actions de composición/catálogo). 11.2 pendiente, ya apoyada sobre esa misma
base de servidor.
**Actualizado:** 2026-08-22

Este documento extiende el roadmap de
[`EDITOR_IMPLEMENTATION_PLAN.md`](EDITOR_IMPLEMENTATION_PLAN.md) (Fases 1–9,
completas salvo el paquete de marca de la Fase 9) con las fases necesarias para
que el Proposal Studio **funcione como un editor comercial de propuestas
moderno**: edición
directa sobre el documento, composición drag & drop, pipeline multi-propuesta,
plantillas, biblioteca de contenido, variables, pricing interactivo, envío,
firma electrónica, analytics de cliente y comentarios.

## Qué significa "editor comercial moderno" en este producto

Los editores comerciales de referencia ofrecen dos modos: un diseñador libre
y un modo de **plantillas bloqueadas** donde el vendedor edita contenido dentro de layouts protegidos.
Este proyecto replica el segundo. Los principios existentes se conservan
intactos:

- **Layouts protegidos** — se edita contenido, no geometría. Sin canvas libre.
- **Un editor, varios diseños** — todo lo nuevo (selección en canvas, drag &
  drop, variables, firma) se define en el contrato de diseño o en el shell,
  nunca en ramas por plantilla.
- **Guardado server-authoritative** — la edición inline reutiliza las mismas
  server actions, allowlists y validaciones existentes; el canvas es otra vista
  del mismo draft state, no un segundo pipeline de guardado.
- **Revisiones inmutables** — firmar, aprobar y medir siempre ocurre contra una
  revisión, nunca contra el borrador vivo.

## Mapa de capacidades

| Capacidad | Estado actual | Fase |
| --- | --- | --- |
| Edición inline sobre el documento | **Completo (Fase 10)** | **10** |
| Selección de bloques haciendo click en la página | **Completo (Fase 10)** | **10** |
| Drag & drop de contenido al documento | Parcial — el "+" entre páginas (11.3) cubre secciones de plantilla; falta drag desde catálogo (11.2) | **11** |
| Reordenar páginas arrastrando miniaturas | **Completo (Fase 11.1)** — inserción por drag desde catálogo (11.2) sigue pendiente | **11** |
| Pipeline de propuestas con estados (Draft/Sent/Viewed/Won/Lost) | No — una sola propuesta seed, `/` redirige a `1` | **12** |
| Crear, duplicar, archivar propuestas | No | **12** |
| Plantillas (guardar como / crear desde) | No | **13** |
| Biblioteca de contenido: secciones guardadas, snippets, imágenes, fees | Parcial — catálogo de hoteles/excursiones | **13** |
| Variables / merge fields (`{{client.name}}`) | No | **14** |
| Tabla de precios interactiva (cantidades, ítems opcionales, totales) | Parcial — montos estáticos | **14** |
| Envío por email con link rastreable | Parcial — link manual con password/expiración | **15** |
| Firma electrónica y cierre Won/Lost | No — aprobación simple por revisión | **15** |
| Analytics de visualización por página + feed de actividad | Parcial — eventos shared/opened/approved | **16** |
| Comentarios del cliente e internos | No | **17** |
| PDF fiel, multi-diseño, revisiones, share protegido | **Completo (Fases 1–9)** | — |

El orden prioriza primero la *sensación* de edición directa (Fases 10–11,
sin cambios de esquema), después la *aplicación* alrededor del editor
(Fases 12–13), después el *contenido inteligente* (Fase 14) y por último el
*ciclo de venta* (Fases 15–17). Cada fase es entregable y útil por sí sola.

---

## Fase 10 — Edición directa en el canvas

**La brecha central.** Hoy el documento es read-only y todo se edita en el
inspector. En un editor comercial moderno el documento *es* el formulario:
click en un texto y
se edita ahí mismo.

**Tamaño estimado:** XL (la fase más grande del plan). Dividida en 10.1–10.4,
todas completas.

### 10.1 — Contrato de regiones editables

**Estado: Completa (2026-08-22).** `lib/editor/editableRegions.ts` define el
contrato (`data-edit-field` tipado contra `ProposalEditorFieldName` +
`data-edit-kind`); los 16 bloques con formulario del diseño de referencia
están anotados (las colecciones agregadas anotan su contenedor; `DetailRow` y
`KeyValueLine` llevan `editField` opcional asignado en el ensamblado). El
contrato está documentado en `DOCUMENT_DESIGN_CONTRACT.md` y validado por un
test e2e que verifica campos, kinds y pertenencia a página dentro del canvas
(las miniaturas llevan los atributos de forma inerte).

1. Extender el contrato de diseño (`lib/designs/types.ts` +
   `DOCUMENT_DESIGN_CONTRACT.md`) con el concepto de **región editable**: cada
   bloque server-rendered anota sus elementos de texto e imagen con
   `data-edit-path` (ej. `cover.title`, `hotel.description`,
   `day.3.activity.2.text`) y `data-edit-kind` (`text` | `multiline` |
   `image`).
2. Los paths se derivan del mismo esquema de campos que ya construye
   `getProposalEditorData.ts` — una sola fuente de verdad entre inspector y
   canvas. Un campo sin representación visual (ej. metadata) simplemente no
   emite región.
3. Anotar los 19 bloques del diseño Safari Editorial. Minimal Grid anota solo
   sus bloques soportados y valida que el shell no asume cobertura total.
4. El shell descubre regiones por delegación de eventos sobre
   `[data-page-content]`; no importa renderers ni conoce tipos de sección.

### 10.2 — Selección en canvas y puente con el inspector

**Estado: Completa (2026-08-22).** Implementado en
`components/editor/ProposalEditorShell.tsx`, `EditorUi.tsx` e
`ItineraryEditor.tsx`; CSS en `app/globals.css`. Cubierta por 3 tests e2e
nuevos (click→foco, teclado/Escape, drawer móvil) más los 2 existentes de
Fase 10.1 — 14/14 pasan en desktop y mobile.

1. Click en una región → outline de selección (tokens `editor-border-strong` /
   `editor-focus`), la página se selecciona si no lo estaba (reutilizando el
   guard de descarte de cambios sin guardar), y el inspector cambia a Content
   mode con **scroll y focus al campo correspondiente**
   (`fieldElementId()` en `lib/editor/editableRegions.ts` es el id
   compartido entre el campo anotado y el control del inspector). Para
   colecciones agregadas sin control por-campo (itinerario), el foco cae en
   el contenedor del editor estructurado en vez de un input específico —
   limitación conocida, documentada en el propio componente.
2. Hover muestra affordance sutil (outline + cursor pointer, ver
   `app/globals.css`); el resaltado "activo" persistente usa la misma clase
   (`proposal-studio-region-active`) que dispara el punto 3.
3. Selección inversa: cualquier campo del inspector que gane foco (click,
   Tab, o el foco automático del punto 1) notifica al shell, que resalta la
   región correspondiente **solo en la página seleccionada** — necesario
   porque el modo Continuo mantiene todas las páginas montadas a la vez y
   nombres de campo como `sectionImageUrl` se repiten en varias páginas.
4. Teclado: `tabindex`/`role="button"`/`aria-label` (derivado del mismo
   `field.label` del inspector) se asignan imperativamente solo a las
   regiones de la página seleccionada en cada cambio de selección o
   contenido — Tab/Shift+Tab dentro del canvas solo recorre esa página.
   Enter/Space activa la región igual que un click. Escape devuelve el foco
   al contenedor de la página (funciona tanto si el foco estaba en la propia
   región como si ya había saltado al campo del inspector). Una región
   `aria-live="polite"` visualmente oculta anuncia "Editing {label}" en cada
   activación.
5. En pantallas sin panel persistente (`< 1280px`, el mismo breakpoint `xl`
   que ya separa el panel fijo del drawer), activar una región abre el
   drawer de Properties ya enfocado en ese campo.

**Nota de alcance de accesibilidad:** el chequeo automatizado existente de
44px de touch-target (`tests/e2e/editor.spec.ts`) solo mide elementos
`<button>` reales — íconos y controles de acción. Las regiones editables de
texto heredan el tamaño natural de su contenido (igual que en un editor de
texto convencional: se hace click sobre el texto, no sobre un botón de 44px
alrededor de cada palabra) y quedan fuera de ese chequeo a propósito; no se
considera una regresión de accesibilidad sino un alcance distinto de
interacción.

### 10.3 — Edición de texto inline

**Estado: Completa (2026-08-22)** para los campos simples de guardado
automático (Cover salvo el título rotado, Details, los tres dividers de
guardado automático, Thank You — 17 campos en 6 tipos de página). Las
colecciones de guardado explícito (Pricing, Hotel, itinerario, excursiones,
clima, términos, inclusiones/exclusiones) **permanecen deliberadamente en el
flujo de la Fase 10.2** (click → salto al inspector) — ver "Alcance decidido"
abajo. Implementado en `ProposalEditorShell.tsx`
(`usePageFieldDraft`/`InlineRegionEditor`), `EditorUi.tsx` y
`ItineraryEditor.tsx`; CSS en `app/globals.css`. Cubierto por 3 tests e2e
nuevos (edición+persistencia, límites del alcance, móvil sin drawer) — 19/19
pasan en desktop y mobile, verificado en dos corridas limpias consecutivas.

1. Al activar una región `text`/`multiline` elegible, un `<input>`/`<textarea>`
   se **porta** (`createPortal`) dentro del mismo `[data-page-content]` que la
   página, posicionado con `getBoundingClientRect()` del elemento fuente
   dividido por el zoom real (`content.getBoundingClientRect().width /
   content.offsetWidth` — no necesita prop de zoom, se autocorrige si el
   usuario hace zoom mientras edita) y estilizado copiando
   `getComputedStyle()` (fuente, peso, tracking, `text-transform`,
   `writing-mode`, color). El elemento fuente recibe la clase
   `proposal-studio-region-editing` (`color: transparent`, mismo box) para que
   solo se vea el overlay, sin duplicar texto ni mover la geometría protegida.
2. **Un solo estado compartido:** `usePageFieldDraft` (antes interno de
   `EditableFieldsForm`) se llama una sola vez en el shell y su resultado se
   pasa como prop tanto al inspector como al overlay — escribir en cualquiera
   de los dos actualiza el mismo `values`, sin duplicar autosave ni arriesgar
   que diverjan.
3. Texto plano únicamente, sin toolbar de formato — la geometría es del
   diseño. Enter cierra en campos `text` de una línea; Escape cierra siempre
   (multiline incluido) y devuelve el foco al canvas; blur (click fuera,
   incluida la miniatura/canvas en blanco) también cierra. El cierre dispara
   guardado vía el cleanup de desmontaje del componente (`saveNow()`), sea
   cual sea el camino de cierre.
4. Errores de validación del servidor tiñen el borde del overlay en rojo
   (`proposal-studio-inline-editor-error`) y el detalle se ve en el inspector,
   igual que el flujo de la 10.2 — sin duplicar el mensaje en el canvas.
5. El refresh server-rendered existente re-renderiza la página tras guardar;
   como el hook vive en el shell (no remonta por `key` de página), el estado
   solo se reinicia cuando cambia el `pageId` seleccionado (patrón "ajustar
   estado durante el render" de React, no un `useEffect`, para evitar un
   frame con datos de la página equivocada).

**Alcance decidido — por qué las colecciones de guardado explícito quedan
afuera de esta pasada:** esas páginas ya declaran explícitamente "Review the
full collection, then use Save now. These changes are not autosaved." — la
edición inline con autosave contradiría ese diseño intencional. Además varias
de esas regiones son contenedores agregados (todo el itinerario, toda la
lista de excursiones) sin mapeo 1:1 entre el rect visual y un único campo, lo
que vuelve inviable la técnica de overlay-por-rect sin antes rediseñar esos
bloques. Se documenta como límite de fase, no como pendiente accidental.

**Correcciones de precisión de región (parte del mismo trabajo):**
`DetailsBlock` anotaba la fila completa (etiqueta negra + valor); ahora solo
el `<li>` de valor. `TriangleDividerBlock`'s `sectionLabel` anotaba todo
`SectionHeader` (título + línea decorativa que se extiende con `flex-1`);
`SectionHeader` ahora acepta `titleRegionProps` para anotar solo el `<h2>`.
Ambos eran imprecisos ya en la Fase 10.1 (el overlay del 10.3 los hizo
evidentes al depender de un rect exacto), pero también mejoran el punto de
click de la Fase 10.2.

**Limitaciones conocidas:**
- `coverTitle` (texto rotado `[writing-mode:vertical-rl]`) queda excluido del
  overlay a propósito — el soporte de inputs editables en vertical-writing-mode
  es inconsistente entre navegadores; se edita solo desde el inspector.
- `dividerSubtitle` en `SectionDividerBlock` no renderiza ningún elemento
  cuando está vacío (`{data.subtitle && <p>...}`), así que no hay región para
  click-to-add en ese caso — límite heredado de la Fase 10.1, no introducido
  acá; corregirlo tocaría la geometría protegida del bloque.

### 10.4 — Interacción de imágenes

**Estado: Completa (2026-08-22).** Implementado en `ProposalEditorShell.tsx`
(`ImageRegionPopover`, misma familia que `InlineRegionEditor`/
`usePageFieldDraft` de la Fase 10.3) y `EditorUi.tsx` (`EditorField` gana un
preview de miniatura cuando `field.isImage`). Cubierto por 3 tests e2e nuevos
(popover + persistencia + restauración, alcance en páginas de guardado
explícito, popover en móvil) — 22/22 pasan en desktop y mobile en corridas
separadas por proyecto.

1. Click en una región `image` en una página de guardado automático (Cover,
   los tres dividers, Thank You) abre un popover anclado a la página —mismo
   mecanismo de portal/zoom que el overlay de texto de la 10.3— con miniatura
   del valor actual y un input de URL que comparte el mismo `usePageFieldDraft`
   que el inspector (mismo autosave de 800 ms, mismo campo, dos vistas). Las
   páginas de guardado explícito (Hotel, From Owners) **no** abren el
   popover — mantienen el salto al inspector de la 10.2 por la misma razón de
   alcance que la 10.3 (review-then-save), y ahí el inspector ahora también
   muestra la miniatura vía `EditorField`.
2. Reemplazo por URL local (`/proposal-assets/...`) o `https://` — no hay
   "examinar biblioteca" real todavía (eso es Fase 13.3, subida de imágenes);
   el input de texto ya acepta ambas formas.
3. Alt text: **no se expone un campo independiente.** Los 9 campos de imagen
   del diseño de referencia derivan su `alt` de otro campo ya editable
   (`data.title`, `data.name`, `data.city`, etc.) — no hay ningún slot con
   alt text propio en el esquema. Añadir uno solo para este caso hipotético
   iba contra la regla del proyecto de no construir para necesidades
   especulativas; se documenta como decisión, no como pendiente.
4. Punto focal: **no implementado.** Ningún diseño registrado
   (`lib/designs/registry.ts`) declara un slot con punto focal configurable,
   así que no hay nada que ese control necesite controlar todavía — se
   añadirá si un diseño futuro lo requiere, siguiendo la condición ya escrita
   en el punto 2 original de este plan.
5. Validación de URL/formato reutiliza la existente de Fase 2.1
   (`isValidImageUrl` en `actions.ts`, sin cambios) — mismo mensaje de error
   server-side en el popover y en el inspector.

**Riesgo descubierto y corregido (mismo trabajo):** en modo Continuo, el
`IntersectionObserver` que sigue la página "más centrada" para actualizar la
selección podía disparar mientras el popover de imagen (o el overlay de texto
de la 10.3) seguía abierto — activar una región grande como la portada puede
requerir el scroll suficiente para que el observer decida que la página
siguiente está más centrada, desmontando el editor a mitad de la edición
porque ambos overlays dependen de `pageId === selectedPage.id`. Corregido
añadiendo `!activeInlineEdit && !activeImageEdit` a la condición que llama
`setSelectedIndex` en ese observer — mientras se edita, el scroll ambiental no
reasigna la selección. Afecta potencialmente a cualquier región grande de
texto también, no solo a imágenes; documentado acá porque el popover de
imagen fue lo que lo hizo evidente (las regiones de texto ya cubiertas por
tests son pequeñas y no lo disparaban).

### Criterios de aceptación

- Todo campo de texto e imagen visible del documento seed es editable con
  click directo en la página, y el resultado persiste igual que desde el
  inspector (mismas actions, misma validación, reload-safe).
- Inspector y canvas nunca divergen: editar en uno se refleja en el otro sin
  guardar dos veces ni pisarse.
- El shell no contiene ningún `data-edit-path` hardcodeado ni ramas por tipo
  de sección; Minimal Grid funciona con cobertura parcial de regiones.
- Teclado y lector de pantalla pueden descubrir, activar y salir de regiones;
  los touch targets cumplen 44px; el test de accesibilidad de
  `tests/e2e/editor.spec.ts` se amplía para cubrirlo.
- Zoom y modos Continuo/Página individual no rompen el posicionamiento de los
  overlays de edición.

### Riesgos y decisiones

- **Posicionamiento de overlays con zoom/scroll:** anclar el editor inline
  dentro del propio nodo de página (no en un portal absoluto sobre el
  viewport) para heredar transformaciones de escala.
- **Repaginación mientras se edita:** si el contenido crece y la página se
  divide, el editor inline debe cerrarse limpiamente y reabrir en la región
  re-renderizada; si eso resulta frágil, degradar a "guardar cierra el editor
  inline" y documentarlo.
- **Server Components:** las páginas siguen siendo RSC; la edición inline es
  un overlay del cliente sobre nodos ya renderizados. No convertir bloques a
  client components.

---

## Fase 11 — Composición visual: drag & drop

Completa la manipulación directa: arrastrar contenido al documento y
reordenar páginas visualmente. Reutiliza las mutaciones seguras de la Fase 6
(composición) y la Fase 5 (catálogo) — esta fase es *interacción*, no lógica
nueva de negocio.

**Estado:** 11.1 (reorden de miniaturas) y 11.3 (affordance "+" de
inserción, con las 3 actions de inserción aceptando ahora una posición
explícita vía `lib/composition/insertionOrder.ts`) completos. 11.2
(drag-insert desde catálogo) pendiente — puede apoyarse directamente en esa
misma base de servidor; ver `docs/PROJECT_STATUS.md`.

**Tamaño estimado:** M.

### Alcance

1. **Reorden de miniaturas:** arrastrar page cards en el panel Pages reordena
   secciones usando la action transaccional existente de Document Structure.
   Solo las páginas que inician sección son arrastrables (las continuaciones
   de paginación se mueven con su sección); indicador de drop entre cards;
   auto-scroll del panel durante el drag.
2. **Insertar arrastrando desde drawers (pendiente, 11.2):** los ítems del
   catálogo contextual (hoteles, excursiones) se podrán arrastrar al canvas;
   aparecerán **insertion points** válidos entre secciones (respetando
   compatibilidad del diseño y reglas de duplicado ya existentes). Soltar
   ejecutará `addCatalogHotelToProposal`/`addCatalogExcursionToProposal` con
   el `afterSectionId` del punto de drop.
3. **Puntos de inserción en canvas (completo, 11.3):** en hover/foco sobre
   el espacio entre páginas de secciones distintas, un affordance "+"
   (`components/editor/InsertionGap.tsx`) abre un menú con las secciones de
   plantilla (`lib/editor/addableSections.ts`) anclado a esa posición —
   alternativa sin drag, ya funcional para dividers y thank-you. El mismo
   menú no ofrece hoteles/excursiones todavía porque esas necesitan elegir
   un ítem del catálogo, no solo un tipo de bloque — lo cubrirá 11.2.
4. Implementar con pointer events propios (no HTML5 DnD) para soportar touch,
   con umbral de activación para no robar el scroll; mantener botones
   Move up/down y la inserción por botones como **camino accesible
   equivalente** — el drag es mejora progresiva, nunca el único camino.
5. Estados: preview fantasma del ítem arrastrado, drop targets inválidos
   marcados, cancelación con Escape, anuncio del resultado en live region.

### Criterios de aceptación

- Reordenar arrastrando produce exactamente el mismo estado persistido que los
  botones de Document Structure y repagina/renumera correctamente.
- No se puede soltar un ítem en posición inválida (incompatibilidad o
  duplicado) — el target ni se ilumina.
- Todo lo alcanzable por drag sigue siendo alcanzable por teclado/botones.
- Playwright cubre reorden por drag en desktop y verifica que mobile conserva
  los caminos por botón.

---

## Fase 12 — Multi-propuesta: pipeline, dashboard y fundaciones

La herramienta debe ser una app de *propuestas*, no de una propuesta. Esta
fase convierte
el estudio en multi-propuesta y paga la deuda técnica señalada en
`DOCUMENT_DESIGN_CONTRACT.md`.

**Tamaño estimado:** L.

### 12.1 — Promoción de esquema (prerrequisito de todo lo posterior)

1. Crear tablas reales: `proposal_revisions` (payload snapshot, diseño,
   created_at), `proposal_shares` (token, revision_id, password hash/salt,
   access key, expires_at, revoked_at), `proposal_events` (share_id, tipo,
   metadata, created_at) y columnas `design_id`/`design_version` en
   `proposals`.
2. Migración Drizzle que traslada las filas virtuales actuales de
   `proposal_sections` (`proposalRevision`, `shareSettings`, `shareEvent`,
   `documentDesign`) a las tablas nuevas y las elimina del stream de
   secciones; los links compartidos existentes deben seguir funcionando.
3. Añadir `status` a `proposals`: `draft | sent | viewed | approved | lost |
   archived`, con transiciones derivadas de eventos (sent al compartir/enviar,
   viewed al primer open, approved al aprobar/firmar) y manuales (lost,
   archived, reabrir).
4. Actualizar backup/restore (`scripts/`) y el smoke de `OPERATIONS.md` para
   las tablas nuevas.

### 12.2 — Dashboard de propuestas

1. Ruta `/proposals`: lista con nombre, cliente, valor (desde pricing),
   estado con badge, diseño, páginas, última actividad; búsqueda por texto,
   filtro por estado, orden por actividad/valor/nombre. `/` redirige aquí.
2. Acciones por fila: abrir editor, preview, duplicar (deep copy transaccional
   del grafo completo: secciones, días, hoteles, pricing, listas — nunca
   comparte filas hijas), archivar/restaurar, eliminar con confirmación
   (solo borradores sin shares).
3. Creación: diálogo con cliente (existente o nuevo), nombre del viaje,
   diseño inicial (selector del registro con compatibilidad) y origen: en
   blanco (secciones default del diseño) o duplicado. "Desde plantilla" llega
   en Fase 13.
4. Usar el design system del editor (tokens/primitivas de
   `EDITOR_DESIGN_SYSTEM.md`) — el dashboard es parte del studio, no otra app.

### 12.3 — Autenticación mínima

1. Login single-user (credencial en variable de entorno, sesión firmada con
   cookie httpOnly) que protege `/proposals`, el editor y las APIs de
   mutación. `/share/[token]` permanece público con su propia protección.
2. Rate limiting básico en login y en el endpoint de password de share.
3. Fuera de alcance: multi-usuario, roles, SSO (se registra en "decisiones a
   revisitar").

### Criterios de aceptación

- Se pueden crear, duplicar, archivar y navegar N propuestas; el seed es una
  fila más, no un supuesto del código (grep: ninguna referencia a proposal 1
  hardcodeada fuera del seed).
- Los shares creados antes de la migración siguen resolviendo revisión,
  password y expiración correctamente.
- Los estados reflejan el ciclo real y aparecen en dashboard y en el header
  del editor (hoy el badge DRAFT es estático).
- Sin sesión no hay acceso a editor/dashboard/mutaciones; los tests e2e se
  autentican en setup.

---

## Fase 13 — Plantillas y biblioteca de contenido

Convierte el trabajo hecho en activos reutilizables — el corazón del flujo
"crear propuesta en 10 minutos".

**Tamaño estimado:** L.

### 13.1 — Plantillas de propuesta

1. "Guardar como plantilla" desde el editor: snapshot del grafo completo
   (como duplicar) marcado `is_template`, con nombre, descripción y thumbnail
   (primera página).
2. Galería de plantillas en el flujo de creación (Fase 12.3 se amplía):
   crear desde plantilla = deep copy + asignar cliente nuevo + limpiar datos
   de cliente/fechas donde el campo lo declare (`resetOnTemplate` en el
   esquema de campos).
3. Gestión: renombrar, actualizar desde una propuesta, archivar. Las
   plantillas no aparecen en el pipeline.

### 13.2 — Secciones guardadas y snippets

1. Guardar una sección de la propuesta actual (payload + variante) en una
   biblioteca global, con nombre y etiquetas.
2. Nueva pestaña "Library" en el drawer de catálogo: buscar e insertar
   secciones guardadas (pasando las mismas validaciones de compatibilidad de
   diseño) — y arrastrarlas al canvas vía Fase 11.
3. Snippets de texto (párrafos reutilizables: políticas, descripciones de
   ciudades) insertables desde el inspector y desde la edición inline
   (comando o botón "insertar snippet" en campos multiline).

### 13.3 — Biblioteca de imágenes

1. Upload real de imágenes (hasta ahora todo es URL/asset preexistente):
   almacenamiento en disco del volumen (`OPERATIONS.md` ya define backup),
   límites de tamaño/formato, nombres content-hash.
2. Grid de imágenes en el drawer Library con búsqueda por nombre/etiqueta;
   los pickers de imagen (inspector y Fase 10.4) ofrecen "elegir de la
   biblioteca | subir | URL".
3. Registrar la decisión de object storage para producción en "decisiones a
   revisitar" — el contrato de la biblioteca no debe asumir filesystem.

### 13.4 — Biblioteca de fees (precursor de Fase 14)

1. Tabla de ítems de precio reutilizables: nombre, descripción, precio
   unitario, moneda, unidad (por persona/noche/vehículo), impuesto aplicable.
2. CRUD dentro del drawer Library; la Fase 14 los consumirá en la tabla de
   precios.

### Criterios de aceptación

- Crear desde plantilla produce una propuesta completa editable sin residuos
  del cliente original.
- Cambios posteriores en una plantilla o en la biblioteca **nunca** alteran
  propuestas ya creadas (mismo principio snapshot de Fase 2.3B).
- Subir una imagen y usarla en portada/hotel/itinerario funciona de punta a
  punta y sobrevive backup/restore.

---

## Fase 14 — Variables y pricing interactivo

El contenido se vuelve inteligente: datos que se escriben una vez y fluyen, y
precios que se calculan en lugar de tipearse.

**Tamaño estimado:** L.

### 14.1 — Variables / merge fields

1. Sintaxis `{{path}}` en campos de texto, con catálogo cerrado de variables
   resuelto server-side en el render: `client.name`, `client.partySize`,
   `trip.title`, `trip.startDate`, `trip.endDate`, `trip.nights`,
   `pricing.total`, `pricing.currency`, `company.*`, fechas formateadas.
2. Picker de variables en inspector y edición inline (botón `{{}}` que
   inserta en el cursor); en el canvas, las variables renderizan su valor
   resuelto con un subrayado sutil en modo edición para distinguirlas.
3. Variables sin resolver (cliente sin nombre, fechas vacías) aparecen en el
   Review drawer como warnings y bloquean compartir solo si el diseño marca el
   campo como requerido.
4. Las revisiones guardan el texto **resuelto** además del crudo — un share
   firmado nunca cambia porque cambió el cliente.

### 14.2 — Tabla de precios 2.0

1. Modelo de line items: descripción, cantidad, precio unitario, unidad,
   impuesto %, descuento (monto o %), opcional sí/no, seleccionado por
   defecto sí/no. Subtotal/impuestos/descuento/total calculados server-side —
   nunca confiar en cálculo del cliente.
2. Editor de tabla en inspector + inline (Fase 10 aplica): agregar desde la
   biblioteca de fees (13.4) o crear ad hoc; reordenar; el `PricingBlock` del
   diseño renderiza la tabla calculada manteniendo su estética.
3. **Interactividad del cliente en el share:** los ítems opcionales se pueden
   marcar/desmarcar y (si se habilita por ítem) editar cantidad; el total se
   recalcula server-side vía el endpoint del share; la selección queda
   registrada como evento y congelada al aprobar/firmar.
4. Compatibilidad: las propuestas existentes con montos estáticos migran a un
   line item único; el calendario de pagos (Fase 2.3A) puede expresar montos
   como % del total calculado además de valores fijos.

### Criterios de aceptación

- Cambiar el nombre del cliente actualiza cada aparición en el documento sin
  tocar ninguna sección; el PDF y el share de revisiones viejas no cambian.
- Un pricing con cantidades, impuestos, descuento e ítems opcionales cuadra
  centavo a centavo entre editor, share interactivo y PDF (redondeo definido
  y testeado por unidad).
- La selección de opcionales del cliente queda auditada (evento + snapshot al
  aprobar) y el vendedor la ve en el editor.

---

## Fase 15 — Envío, firma electrónica y cierre

El ciclo de venta completo: enviar desde la app, firmar en el share, cerrar
Won/Lost. Levanta el non-goal original de e-signatures ahora que las
revisiones son tablas reales.

**Tamaño estimado:** L.

### 15.1 — Envío por email

1. Abstracción de proveedor (un servicio transaccional de email o SMTP
   directo, configurable por env; en dev, log + archivo `.eml`). Ningún dato del cliente sale a
   servicios no configurados explícitamente.
2. Diálogo "Send" en el editor: destinatarios, asunto y mensaje con variables
   (14.1), adjuntando el link de share (creándolo si no existe con las
   opciones de password/expiración actuales).
3. El envío registra evento `sent` → estado Sent; reenvíos y recordatorios
   manuales ("Remind client") quedan en el historial.

### 15.2 — Bloque y flujo de firma

1. Nuevo tipo de sección `SignatureBlock` registrado en el contrato de diseño
   (Safari Editorial lo estiliza; Minimal Grid valida el registro): nombres y
   roles de firmantes (cliente / empresa), líneas de firma y fecha en el
   documento y el PDF.
2. En el share, el cliente firma **tipeando** (nombre renderizado en estilo
   manuscrito) o **dibujando** (canvas → PNG); se registra nombre, email,
   timestamp, IP truncada/user-agent y el hash SHA-256 del payload de la
   revisión firmada.
3. Al firmar: estado → Approved/Won, la revisión queda sellada, se regenera el
   PDF con página de **certificado de firma** (firmantes, timestamps, hash) y
   el flujo de aprobación existente de Fase 8 se convierte en este (aprobar
   sin firma sigue disponible si la propuesta no tiene SignatureBlock).
4. Alcance legal: firma electrónica simple con evidencia, no firma calificada
   ni proveedor externo certificado — documentarlo.

### 15.3 — Cierre del pipeline

1. Marcar Lost con razón opcional; reabrir a Draft crea propuesta duplicada
   nueva en lugar de mutar la histórica si ya hubo firma.
2. El dashboard refleja Won/Lost y el valor cerrado.

### Criterios de aceptación

- Enviar, abrir, firmar y descargar el PDF firmado funciona de punta a punta
  con password y expiración activos.
- El hash del certificado coincide con la revisión almacenada; ninguna
  mutación posterior de la propuesta altera lo firmado.
- Sin proveedor de email configurado, la UI de envío degrada a "copiar link"
  sin errores rotos.

---

## Fase 16 — Analytics de visualización y notificaciones

La capacidad estrella de esta categoría: saber qué miró el cliente y cuánto
tiempo.

**Tamaño estimado:** M.

### Alcance

1. Instrumentar el share con IntersectionObserver + Page Visibility: tiempo
   por página/sección en lotes enviados por `sendBeacon` a
   `/api/share/[token]/events`; también descargas de PDF y cambios de
   selección de pricing. Sin cookies de tracking, sin fingerprinting; se mide
   la sesión del share, no a la persona.
2. Panel "Activity" por propuesta (drawer o pestaña del dashboard): timeline
   de eventos (enviada, abierta, X min en Pricing, firmada…) y resumen:
   aperturas, tiempo total, páginas más y menos vistas.
3. Notificaciones in-app (badge en dashboard) y por email al vendedor
   (reutiliza 15.1): primera apertura, firma, expiración próxima —
   configurables.
4. Retención definida (ej. eventos crudos 12 meses) y agregados por revisión.

### Criterios de aceptación

- Una visita real de prueba produce tiempos por página plausibles y el feed
  ordenado correctamente; visitas concurrentes de dos shares no se mezclan.
- El share no pierde rendimiento perceptible ni rompe sin JS (los eventos son
  mejora progresiva).
- Las notificaciones respetan la configuración y nunca bloquean el flujo del
  cliente.

---

## Fase 17 — Comentarios y colaboración ligera

Cierra el loop de negociación sin salir de la herramienta. La colaboración
multi-usuario en tiempo real sigue fuera de alcance.

**Tamaño estimado:** M.

### Alcance

1. **Comentarios del cliente en el share:** por sección (anclados a
   `editorSource`), con nombre + texto; aparecen como hilos en el panel
   Activity y notifican al vendedor.
2. **Respuestas del vendedor** desde el editor; el cliente las ve en el share
   (por revisión: si se re-comparte una revisión nueva, los hilos abiertos se
   arrastran con referencia a la sección, o se marcan huérfanos si la sección
   ya no existe).
3. **Notas internas** por sección en el editor (nunca visibles en share/PDF).
4. Resolver/reabrir hilos; contador de hilos abiertos en Review antes de
   re-compartir.

### Criterios de aceptación

- Cliente comenta → vendedor responde → cliente ve la respuesta, todo
  auditado en eventos.
- Ninguna nota interna ni hilo aparece en el PDF ni en el render del share
  fuera de su UI de comentarios.
- XSS imposible: todo comentario es texto plano escapado.

---

## Dependencias entre fases

```text
F10 canvas inline ──► F11 drag&drop (usa selección/insertion points)
F12 esquema+pipeline ──► F13 plantillas (necesita crear/duplicar)
F13.4 fees ──► F14.2 pricing
F12 revisiones reales ──► F14.1 texto resuelto ──► F15 firma (hash revisión)
F15.1 email ──► F16 notificaciones
F12 eventos en tabla ──► F16 analytics ──► F17 comentarios (mismo canal)
```

F10–F11 y F12–F13 son trenes paralelos si hace falta; F14+ es secuencial
sobre F12.

## Riesgos transversales

- **SQLite en producción** con analytics de escritura frecuente (F16):
  mantener los eventos en batch/transacción; si el volumen crece, es el
  primer candidato a mover a Postgres (ya listado en decisiones a revisitar).
- **Crecimiento del shell:** `ProposalEditorShell.tsx` ya es grande; F10–F11
  deben extraer módulos (selección de canvas, DnD) a hooks/componentes
  propios antes de sumar lógica.
- **Fase 9 pendiente:** el paquete de marca sigue gateado por el owner; no
  bloquea ninguna fase de este plan y puede aterrizar en paralelo.
- **Cada fase actualiza** `CLAUDE.md` (estado), su doc de fase, los tests de
  `tests/` y, cuando toque esquema, `scripts/` de backup/restore — según las
  reglas de mantenimiento existentes.
