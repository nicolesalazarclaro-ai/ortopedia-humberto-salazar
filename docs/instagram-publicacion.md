# Publicación programada en Instagram (Graph API)

Cuenta: @ortopedia.humbertosalazar (id 17841445590397589), vinculada a la página de Facebook 1502713056255317, portafolio 1814675739770277. App de Meta: "Ortopedia HS Mensajes" (id 1537213269465741).

## 0. Programar una publicación nueva (procedimiento corto)
1. Nicole le pide a Claude la pieza (tema o producto).
2. Claude escribe el borrador en `instagram/cola.json` (gancho, texto, hashtags), diseña la imagen en Moda y exporta el JPEG (1080x1350).
3. Claude pone en la pieza el enlace público del JPEG y valida con `python3 -I instagram/publicador.py validar`.
4. Nicole responde **"aprobado"** con día y hora de Chile. Claude sella la aprobación y la sube a `main` con un PR.
5. El workflow `.github/workflows/instagram.yml` corre cada 15 minutos y publica lo aprobado cuya hora ya llegó. Anota lo publicado en la rama `registro-publicaciones`. Nicole no hace nada más.
- Si cambia el texto de una pieza ya aprobada, hay que aprobarla de nuevo.
- Para publicar al instante: Actions > "Publicar en Instagram" > Run workflow con `publicar` = `true` (la pieza debe tener hora vencida).

### Imágenes
Hoy se usan los enlaces públicos de las exportaciones de Moda, que vencen el **28-nov-2027**. Meta copia la imagen al publicar, así que una publicación ya hecha no depende del enlace. Riesgo: si se borra el diseño en Moda antes de que la pieza salga, el enlace puede dejar de funcionar. Para algo más estable, subir los JPEG a un repositorio público de imágenes (hoy existe `ortopedia-hs-imagenes`, vacío) y usar sus enlaces `raw.githubusercontent.com`.

### Renovar el token si caduca
1. business.facebook.com > Configuración > Usuarios del sistema > `publicador-instagram` > **Generar token**.
2. App "Ortopedia HS Mensajes"; permisos `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`; caducidad "Nunca" si Meta la ofrece.
3. Copiar el token y pegarlo en GitHub: repositorio > Settings > Secrets and variables > Actions > `IG_ACCESS_TOKEN` > Update secret. Nunca en el chat ni en archivos.
- Si al generar el token se eligió una caducidad de 60 días, hay que repetirlo antes de la fecha. El workflow falla con un error visible si el token venció, sin publicar nada.

## 1. Qué exige Meta (a revisar con la documentación vigente al momento de conectar)
- **Cuenta profesional** de Instagram (Empresa o Creador), vinculada a la página. Ya lo está.
- **API usada:** Instagram API con Facebook Login (`graph.facebook.com`), porque la cuenta está ligada a una página.
- **Permisos:** `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement` (a veces `business_management`).
- **Modo desarrollo:** como la app solo publica en cuentas propias de Nicole y ella es administradora de la app, basta el acceso estándar en modo desarrollo. **No hace falta revisión de la app** (App Review) ni verificación del negocio para esto; eso se pide solo si se atienden cuentas de terceros.
- **Token:** usuario del sistema del portafolio, con la página y la cuenta de Instagram asignadas y los permisos anteriores. Puede ser el mismo usuario del sistema que necesita el agente de WhatsApp.
- **Límites:** publicación por API limitada cada 24 horas (hoy 100 por cuenta; el script consulta `content_publishing_limit` y se detiene por prudencia a las 20). Caption hasta 2.200 caracteres, hasta 30 hashtags, carrusel de 2 a 10 imágenes.
- **Imágenes:** JPEG en una URL pública `https` (Meta la descarga; no sube archivos locales). Proporción entre 4:5 y 1,91:1. Las del sitio están en WebP y la web aún no está publicada, así que falta dónde alojar los JPEG.
- **Programación:** la API de Instagram no programa de forma nativa; por eso existe la cola propia (`instagram/cola.json`) y un ejecutor que publica lo aprobado cuando llega la fecha (hora de Chile).
- **Entorno cloud:** bloquea `graph.facebook.com`. El ejecutor debe correr en el computador de Nicole o en un servicio que ella apruebe (por ejemplo GitHub Actions o el hosting del webhook). No se configuró ninguno.

## 2. Configuración inicial (hecha el 28-nov-2026; no hay que repetirla)
1. En developers.facebook.com, app "Ortopedia HS Mensajes": agregar el producto **Instagram** y aceptar los términos que Meta muestre.
2. Aceptar en las ventanas emergentes de Meta los permisos `instagram_content_publish` e `instagram_basic` (Claude no puede tocar esas ventanas).
3. En Configuración del negocio > Usuarios del sistema: crear o reutilizar el usuario del sistema, asignarle la página y la cuenta de Instagram, y generar el token con esos permisos.
4. Guardar el token **solo** como variable de entorno donde corra el ejecutor: `IG_ACCESS_TOKEN` e `IG_USER_ID` (ver `.env.example`). Nunca en el repositorio ni en el chat.
5. Entregar fotos reales en JPEG y decidir dónde se alojan.

## 3. Flujo de aprobación
1. **Claude propone** cada pieza en `instagram/cola.json` con estado `borrador`: gancho, título, texto, hashtags, idea visual (o diseño en Canva) y fecha sugerida.
2. `python3 -I instagram/publicador.py validar` revisa límites, promesas de salud, rótulo de imagen ilustrativa y el aviso de que no reemplaza a un profesional.
3. **Nicole revisa** (en el chat o en el PR) y responde "aprobada" con fecha y hora de Chile.
4. Solo entonces la pieza pasa a `aprobada` con `aprobada_por: Nicole`, la fecha y el texto exacto aprobado. Si el texto cambia después, deja de ser publicable y se pide aprobar de nuevo.
5. El ejecutor publica únicamente piezas `aprobadas` con fecha vencida y las marca `publicada` o `error`. Un error no se reintenta solo, para no duplicar.
6. Todo corre en **ensayo** salvo que se use `--publicar`.

## 4. Reglas de contenido que el script hace cumplir
Sin promesas de curación ni cifras, testimonios o certificaciones inventados; sin fotos de pacientes; imágenes ilustrativas rotuladas; textos sobre el producto y no sobre la condición de salud de la persona; sin gasto en publicidad ni impulso de publicaciones.
