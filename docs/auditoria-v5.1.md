# Auditoría técnica: landing V5.1 (aprobada)

Fecha: 24 de noviembre de 2026
Archivo revisado: `fuente/Ortopedia_Salazar_V5_1_Editable.html` (349 KB, 425 líneas)
Método: lectura del código, pruebas en Chrome sin interfaz (Playwright) a 390, 768, 1024 y 1440 px,
y análisis de las imágenes incrustadas.

## Resumen

La landing está bien construida: un solo archivo, sin errores de JavaScript, sin desbordamiento
horizontal en ningún ancho, accesible (enlace "Saltar al contenido", foco visible, un solo H1,
acordeón nativo), y respeta las reglas del proyecto: no hay testimonios, precios, certificaciones
ni promesas médicas inventadas, y los mensajes de WhatsApp hablan del producto, no de la salud.

No está lista para publicarse tal cual. Hay **4 bloqueos de lanzamiento**, que dependen de datos
o decisiones de Nicole, y varias mejoras técnicas. Ninguna requiere cambiar el diseño aprobado.

## Ya corregido en `sitio/` (sin cambiar textos ni diseño)

`scripts/preparar_sitio.py` genera la versión publicable desde el archivo aprobado:

| Cambio | Por qué |
|---|---|
| Se quitó el editor local ("✎ Editar página") | Era visible para cualquier visitante y permitía descargar la página. |
| Las 13 imágenes base64 pasaron a `sitio/img/*.webp` | El HTML bajó de 349 KB a 33 KB; las imágenes ahora se guardan en caché. |
| `width`/`height` en cada imagen | Evita saltos de diseño al cargar (CLS). |
| `loading="lazy"` salvo logo y portada; `fetchpriority="high"` en portada | Carga inicial más rápida en móvil. |
| `robots.txt` y `_headers` | Bloquean la indexación hasta el lanzamiento y agregan cabeceras de seguridad. |

Comparé capturas antes y después en tres anchos: la única diferencia es que ya no aparece el botón del editor.
El archivo original queda intacto en `fuente/` para seguir editándolo.

## Bloqueos de lanzamiento (requieren a Nicole)

1. **Número de WhatsApp Business vacío.** Los 10 botones muestran el aviso "Número pendiente".
   Es el objetivo principal de la página.
2. **Política de privacidad inexistente.** El aviso de "Cómo trabajamos" enlaza a `#privacidad`, que no
   existe (muestra "Texto legal pendiente"). La página trata indicaciones médicas, que son datos
   sensibles según la Ley 21.719 (vigente desde el 1 de diciembre de 2026). Se necesita el texto revisado por un abogado.
3. **Pie de página vacío.** Dirección, horario, correo, redes, medios de pago y razón social/RUT
   están en blanco (se ocultan solos). Para venta a consumidores conviene mostrar razón social y RUT
   y un medio de contacto (Ley 19.496).
4. **Imágenes generadas con IA.** Están rotuladas como ilustrativas, lo que cumple la regla, pero la regla
   del proyecto pide fotos reales del fundador, el taller y los productos. Además:
   - Son de baja resolución (245 a 845 px de ancho) y se ven ampliadas: la portada mide 845×400 y
     se muestra hasta 540 px de alto; el corsé mide 291×347 y se muestra hasta 520 px. En pantallas
     retina se verán borrosas.
   - Hay 3 imágenes repetidas: la foto del corsé, la de "otros productos" y la de "herramientas"
     aparecen también en la galería del taller.

## Mejoras técnicas recomendadas (propuestas, no aplicadas)

Ordenadas por impacto. Ninguna cambia el diseño; las marco para aprobar antes de aplicarlas.

### SEO y redes (alto, necesario antes de Meta Ads)
- Falta `<link rel="canonical">`, etiquetas Open Graph y Twitter (imagen y título al compartir por WhatsApp o Facebook).
- Falta favicon e ícono para iPhone/Android.
- Falta dato estructurado `LocalBusiness` (JSON-LD) con dirección y horario, cuando existan.
- Falta `sitemap.xml`. `robots` está en `noindex` (correcto mientras no se lance).
- Jerarquía: "Corsés ortopédicos personalizados" es H2 dentro de otra sección H2; debería ser H3.

### Rendimiento y privacidad
- Las fuentes Fraunces y Figtree se cargan desde Google Fonts: envía la IP del visitante a Google y
  retrasa el texto. Recomiendo alojarlas en el propio sitio (licencia OFL lo permite).
- Hay 3 bloques `<style>` que se sobrescriben entre sí (restos de V3: modo oscuro, `.tape`, `.proto`,
  `.photo-slot`, variables coral). Unos 4 KB de CSS sin uso. Limpieza recomendada al migrar a Astro.

### Usabilidad
- El menú móvil omite "El taller" (sí está en el menú de escritorio).
- El menú móvil no se cierra al tocar un enlace.
- Enlaces del menú móvil miden menos de 44 px de alto (mínimo táctil recomendado).
- Textos alternativos repetidos: 5 imágenes dicen "Imagen ilustrativa del proceso ortopédico"; "ferula" va sin tilde.
- La nota "Imágenes ilustrativas generadas con IA" se repite 3 veces; basta una o un asterisco por sección.

### Medición (para la Fase de Meta Ads)
- No hay analítica ni píxel (correcto por ahora). Al agregarlos: banner de consentimiento, y medir
  solo el clic en "Cotizar por WhatsApp" con el tipo de producto, nunca datos de salud.

## Resultados de pruebas

| Ancho | Desborde horizontal | Errores JS | Imágenes rotas | Editor visible |
|---|---|---|---|---|
| 390 px | No | 0 | 0 | No (antes: sí) |
| 768 px | No | 0 | 0 | No (antes: sí) |
| 1024 px | No | 0 | 0 | No |
| 1440 px | No | 0 | 0 | No (antes: sí) |

Repetir con: `NODE_PATH=$(npm root -g) node pruebas/revisar.js sitio/index.html`
