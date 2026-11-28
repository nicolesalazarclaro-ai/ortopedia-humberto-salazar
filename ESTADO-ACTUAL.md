# Estado actual

Actualizado: 28-nov-2026.

## Instagram: publicación programada
- Hecho: módulo `instagram/` (cola con hora de Chile, validación de reglas de contenido, aprobación sellada de Nicole, creación de contenedor y publicación por Graph API, modo ensayo) con pruebas. Guía en `docs/instagram-publicacion.md`.
- Falta (Nicole): agregar el producto Instagram a la app, aceptar permisos, crear el token del usuario del sistema y guardarlo como variable de entorno, entregar fotos reales en JPEG y decidir dónde se alojan.
- Falta (decisión): dónde corre el ejecutor, porque el entorno cloud no llega a graph.facebook.com.
- Nada se ha publicado ni se ha llamado a Meta.
- Borradores listos en `instagram/cola.json` (4 piezas, estado `borrador`), pendientes de tu aprobación, de fotos reales y de fecha. No incluyen número de WhatsApp (falta confirmarlo).
- Captions persuasivos listos como borrador, con fechas propuestas (hora de Chile): sáb 28-nov 12:30, dom 29-nov 20:00, lun 30-nov 12:30, mar 1-dic 20:00. Ninguno está aprobado. Los diseños los rehace otro hilo con Moda.
- 28-nov: Nicole aprobó los 4 textos y las fechas; quedan en estado `aprobada` en `instagram/cola.json`. Aún no se publicó nada: faltan el producto Instagram en la app (no aparece en los casos de uso), los permisos, el token, los JPEG finales en URL pública y un lugar donde corra el ejecutor.
- Ejecutor: workflow `.github/workflows/instagram.yml` (cada 15 minutos; solo corre programado una vez fusionado en main). El registro de publicadas va en la rama `registro-publicaciones`, no en main. Faltan los secretos `IG_ACCESS_TOKEN` e `IG_USER_ID`, que los pega Nicole directamente en GitHub.
- Las imágenes se sirven desde los enlaces públicos firmados de Moda (CDN), sin repositorio aparte. Meta descarga la imagen desde esa URL al publicar.

## Instagram: estado al 28-nov-2026 (03:57)
- Publicada: pieza 1 (03:56, id de publicación 18049583180837068).
- Programadas y aprobadas por Nicole: pieza 2 dom 29-nov 20:00, pieza 3 lun 30-nov 12:30, pieza 4 mar 1-dic 20:00 (hora de Chile). El workflow corre cada 15 minutos.
- Procedimiento para piezas nuevas y renovación del token: `docs/instagram-publicacion.md`, sección 0.
- Enlaces de imágenes de Moda válidos hasta el 28-nov-2027.
- Sin promoción ni gasto en anuncios.
