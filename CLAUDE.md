@AGENTS.md
# Melanated Safaris — Proposal Generator

## Objetivo
Sistema que reemplaza proposals hechos a mano en Canva (1 hora por cambio) 
por un motor de bloques HTML/CSS + Playwright que genera PDFs, con 
contenido variable (días, hoteles, excursiones) sin romper el diseño.

## Referencia visual
Las páginas del PDF original están en `reference/pdf-pages/page-NN.png`. 
SIEMPRE comparar el resultado renderizado contra la página correspondiente 
antes de dar un bloque por terminado. El documento original NO es 
consistente entre secciones (fue armado a mano en Canva) — cuando haya 
conflicto entre "replicar el original exacto" y "mantener consistencia 
del sistema", priorizar consistencia del sistema y documentarlo acá.

## Decisiones de diseño ya tomadas
- **Footer de página:** estandarizado abajo a la derecha en TODOS los 
  bloques, vía componente compartido `PageFooter`. El original tiene 
  posiciones inconsistentes (Overview=centrado, Divider=arriba-izquierda, 
  Hotel/Excursion=abajo-derecha) — no replicar eso, usar siempre 
  `PageFooter`.
- **Hoteles:** un solo tipo de bloque `HotelBlock` (NO dos variantes). La 
  página "portada de sección" tipo hotel (foto grande + título) se 
  resuelve con el `SectionDividerBlock` genérico, no con un bloque de 
  hotel aparte.
- **Section Divider:** hay dos variantes geométricas en el original 
  (Excursions: barra verde + línea amarilla + rectángulo rojo; 
  Accommodations: forma diagonal oscura). Se está construyendo primero la 
  variante Excursions como base. Evaluar después si conviene parametrizar 
  ambas en un solo componente o mantenerlas separadas.

## Bloques construidos
- ✅ `OverviewBlock` — validado contra página 4
- ✅ `ExcursionListBlock` — validado contra página 22 (precio con float 
  corregido)
- ✅ `HotelBlock` — validado contra página 8 (3 imágenes, no 2; footer 
  corregido)
- 🔲 `SectionDividerBlock` — en construcción, variante Excursions (pág. 20)

## Pendientes conocidos (no bloquean el avance, resolver cuando se llegue)
- Logo real de Melanated Safaris (actualmente texto plano en todos los 
  headers) — resolver como asset SVG/PNG reutilizable una sola vez.
- Fuentes custom (serif condensada de portada, tipografía expandida de 
  headers de sección tipo "PRICING AND PAYMENT INFORMATION") — pendiente 
  de identificar/conseguir archivos.
- Efecto "papel rasgado" de portada — requiere máscara SVG, no atacado 
  todavía.

## Stack
Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Playwright. 
Cada bloque: componente React en `components/blocks/`, tipo en 
`lib/types.ts`, ruta de preview en `app/preview/{nombre}/page.tsx`, script 
de render en `lib/render/render{Nombre}.ts`.