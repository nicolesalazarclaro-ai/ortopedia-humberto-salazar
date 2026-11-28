# Estado actual

Actualizado: 28-nov-2026.

## Instagram: publicación programada
- Hecho: módulo `instagram/` (cola con hora de Chile, validación de reglas de contenido, aprobación sellada de Nicole, creación de contenedor y publicación por Graph API, modo ensayo) con pruebas. Guía en `docs/instagram-publicacion.md`.
- Falta (Nicole): agregar el producto Instagram a la app, aceptar permisos, crear el token del usuario del sistema y guardarlo como variable de entorno, entregar fotos reales en JPEG y decidir dónde se alojan.
- Falta (decisión): dónde corre el ejecutor, porque el entorno cloud no llega a graph.facebook.com.
- Nada se ha publicado ni se ha llamado a Meta.
- Borradores listos en `instagram/cola.json` (4 piezas, estado `borrador`), pendientes de tu aprobación, de fotos reales y de fecha. No incluyen número de WhatsApp (falta confirmarlo).
