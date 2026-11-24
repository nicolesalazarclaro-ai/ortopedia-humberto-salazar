# Guía: registrar el dominio y conectar Cloudflare Pages

Aprobado por Nicole el 24/11/2026. Esta guía **no publica la página**: deja todo conectado con
una vista previa privada. El lanzamiento se hace aparte, con aprobación.

## Parte 1: registrar el dominio en NIC Chile (Nicole, unos 10 minutos)
1. Entra a https://www.nic.cl y escribe `ortopediahumbertosalazar` en el buscador de la portada.
2. Si aparece **disponible**, pulsa "Inscribir". Si está tomado, avísame antes de elegir otro
   (respaldos: `ortopediasalazar.cl`, `humbertosalazar.cl`).
3. Crea tu cuenta en NIC Chile con un correo que revises siempre (ahí llegan los avisos de renovación).
4. Titular: idealmente la empresa (razón social y RUT). Si aún no se define, puede ir a tu nombre y transferirse después.
5. Elige 1 año (≈ $11.800 con IVA) y paga con tarjeta o transferencia (Webpay).
6. **No configures servidores DNS todavía**: deja los que vienen por defecto. Los cambiamos en la Parte 3.
7. Guarda el comprobante y avísame.

## Parte 2: crear la cuenta de Cloudflare (Nicole, 5 minutos)
1. Entra a https://dash.cloudflare.com/sign-up y crea la cuenta con el mismo correo de la empresa.
2. Activa la verificación en dos pasos (Mi perfil → Autenticación). Es la llave de la página.
3. Elige siempre el plan **Free**. No ingreses tarjeta: no hace falta.

## Parte 3: conectar el dominio a Cloudflare (Nicole, con mi ayuda)
1. En Cloudflare: "Agregar un dominio" → escribe `ortopediahumbertosalazar.cl` → plan **Free**.
2. Cloudflare te mostrará dos servidores de nombres, del estilo `ana.ns.cloudflare.com` y `bob.ns.cloudflare.com`. Cópialos.
3. En nic.cl: Mis dominios → `ortopediahumbertosalazar.cl` → Modificar servidores de nombre (DNS) →
   reemplaza los actuales por los dos de Cloudflare → Guardar.
4. El cambio tarda entre minutos y 24 horas. Cloudflare te envía un correo cuando el dominio queda activo.

## Parte 4: conectar el sitio (requiere el repositorio en GitHub)
1. En Cloudflare: Workers y Pages → Crear → Pages → Conectar con Git → autoriza GitHub y elige
   `ortopedia-humberto-salazar`.
2. Configuración de compilación:
   - Rama de producción: `main`
   - Framework: Ninguno
   - Comando de compilación: (vacío)
   - Directorio de salida: `sitio`
3. Guardar e implementar. Queda una vista previa en `ortopedia-humberto-salazar.pages.dev`,
   con `noindex` (Google no la indexa) y sin el dominio todavía.
4. Me compartes ese enlace y la reviso en todos los tamaños.

## Parte 5: lanzamiento (más adelante, solo con aprobación)
Cuando estén el WhatsApp, la política de privacidad, los datos del pie y las fotos:
1. Quito el `noindex` y agrego sitemap, Open Graph y favicon (rama + revisión).
2. En Cloudflare Pages → Dominios personalizados → agregar `ortopediahumbertosalazar.cl` y `www`.
3. Prueba final y anuncio.

## Seguridad
- Nunca compartas contraseñas ni códigos de verificación conmigo ni con nadie.
- Activa la renovación con aviso en NIC Chile para no perder el dominio.
