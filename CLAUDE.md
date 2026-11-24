# CLAUDE.md: Ortopedia Humberto Salazar

Instrucciones permanentes para cualquier persona o IA que trabaje en este repositorio.

## Idioma
- Todo en español de Chile: textos del sitio, commits, ramas, documentación y comentarios.

## El negocio
- Empresa familiar chilena de fabricación ortopédica a medida, con más de 40 años de trayectoria
  y experiencia en el ámbito hospitalario. Fundador: Humberto Salazar.
- Producto estrella: corsés ortopédicos personalizados. También plantillas, férulas para juanetes,
  calzado ortopédico y otros productos a medida.
- Objetivo del sitio: generar cotizaciones por WhatsApp Business. La venta directa (Shopify) llega
  en la Etapa 3 y solo para productos aprobados por el fundador.
- Dueña del proyecto y quien aprueba: Nicole.

## Estructura del repositorio
```
sitio/            Lo que se publica (carpeta de salida para el hosting). No editar a mano el index.html:
  index.html      se genera con scripts/preparar_sitio.py desde fuente/.
  img/            Imágenes WebP extraídas.
  robots.txt      Bloquea indexación hasta el lanzamiento.
  _headers        Cabeceras de seguridad (Cloudflare Pages).
fuente/           HTML editable aprobado (V5.1, con editor local). Es la fuente de verdad del contenido.
scripts/          Herramientas (preparar_sitio.py).
pruebas/          Revisión en navegador (revisar.js).
docs/             Auditoría, hosting y dominio, decisiones y pendientes.
```

Flujo para cambiar contenido hoy: editar `fuente/…Editable.html` (con su editor o a mano), luego
`python3 -I scripts/preparar_sitio.py fuente/Ortopedia_Salazar_V5_1_Editable.html sitio`
y `node pruebas/revisar.js sitio/index.html`. Cuando se migre a Astro (ver docs/decisiones.md),
este flujo se reemplaza.

## Reglas de contenido (obligatorias)
- No inventar testimonios, certificaciones, precios, plazos, estadísticas, cifras de clientes ni resultados médicos.
- Todo dato del negocio debe venir de Nicole. Si falta, dejar el campo vacío (la página lo oculta)
  o un marcador `[PENDIENTE: …]` y preguntarlo.
- No hacer afirmaciones de salud ni promesas de curación. Agregar siempre que la página no reemplaza
  la evaluación de un profesional de la salud.
- Las imágenes generadas con IA o de banco deben ir rotuladas como ilustrativas y nunca simular ser
  el taller, el fundador o clientes. Prioridad: reemplazarlas por fotos reales.
- Los mensajes prellenados de WhatsApp y los textos de anuncios hablan del producto, nunca de la
  condición de salud de la persona (política de Meta y privacidad).

## Aprobaciones
- No publicar, desplegar a producción, contratar servicios, comprar dominios, crear cuentas, activar
  campañas ni empujar código a GitHub sin aprobación explícita de Nicole.
- Cambios de diseño o de textos sobre la landing aprobada se proponen antes de aplicarse.
- Trabajar por etapas; cada etapa termina con revisión y aprobación.
- Textos legales (privacidad, términos) requieren revisión de abogado y aprobación expresa.

## Datos personales y salud (Ley 21.719, vigente desde el 1 de diciembre de 2026)
- Las indicaciones médicas son datos sensibles. No crear formularios web que las reciban sin
  aprobación, base legal y almacenamiento cifrado definido. Hoy se comparten solo por WhatsApp,
  previa autorización explícita.
- Nunca enviar datos de salud a Meta, Google u otras plataformas (ni en eventos, URLs ni parámetros).
- Píxel de Meta y analítica: solo con consentimiento de cookies. Medir el clic en WhatsApp por producto, nada más.
- Sin secretos en el repositorio: usar variables de entorno del hosting. `.env` está en `.gitignore`.

## Técnica
- Hoy: HTML estático autocontenido (CSS y JS en línea), imágenes en `sitio/img/`. Sin build.
- Hosting propuesto: Cloudflare Pages, carpeta de salida `sitio/`. Rama `main` = producción.
- Futuro (al agregar páginas por producto o blog): migrar a Astro, con aprobación.
- Sin dependencias ni servicios de pago nuevos sin justificación y aprobación.
- Rendimiento: Lighthouse ≥ 90 en móvil; imágenes WebP/AVIF con `width`, `height` y `loading="lazy"`.
- Accesibilidad: contraste AA, navegación por teclado, áreas táctiles ≥ 44 px, textos alternativos descriptivos.
- SEO: título y descripción únicos, Open Graph, canonical, JSON-LD LocalBusiness, sitemap. `noindex` hasta el lanzamiento.

## Diseño (identidad aprobada V5.1)
- Premium, minimalista, humano; un taller familiar, no una tienda genérica de insumos.
- Colores: azul tinta #193344, verde WhatsApp #22724C, verde salvia #496557, gris #52636A, papel #F1F3F0, blanco.
- Tipografías: Fraunces (títulos) y Figtree (texto), licencia OFL.
- Cada sección tiene un llamado claro a "Cotizar por WhatsApp".

## Control de versiones
- Ramas por cambio (`contenido/…`, `mejora/…`, `correccion/…`) y pull request hacia `main`.
- Commits en español, en imperativo y breves: "Agrega favicon", "Corrige menú móvil".
- `main` protegida: sin empujes directos una vez conectado el hosting.
- Vista previa privada (rama o despliegue de prueba) antes de publicar.
- Al terminar una tarea: resumir qué cambió, qué falta y qué requiere aprobación.
