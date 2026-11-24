# Propuesta: alojamiento web y dominio

Fecha: 24 de noviembre de 2026 · Estado: propuesta, **nada contratado ni registrado**.

## Recomendación

| Pieza | Propuesta | Costo |
|---|---|---|
| Dominio | `ortopediahumbertosalazar.cl` en NIC Chile | $9.940 + IVA al año (≈ $11.800) |
| Hosting | Cloudflare Pages (plan gratuito) | $0 |
| DNS y SSL | Cloudflare (gratis, incluido) | $0 |
| Código | GitHub, repositorio privado | $0 |
| Correo (opcional) | Google Workspace Business Starter, 1 cuenta (`contacto@…`) | ≈ $4.500 + IVA al mes, o $45.000 + IVA al año |
| **Total mínimo** | Dominio + hosting | **≈ $11.800 al año** |
| Con correo profesional | | ≈ $65.000 a $76.000 al año |

Precios en pesos chilenos, verificados en fuentes públicas el 24/11/2026; confirmar al contratar.

## Por qué Cloudflare Pages
- Gratis para uso comercial, con ancho de banda ilimitado y SSL automático.
- Se conecta a GitHub: cada cambio aprobado en `main` se publica solo, y cada rama genera una
  vista previa privada para revisar antes.
- Red con presencia en Santiago: la página carga rápido en Chile.
- Admite las cabeceras de seguridad del archivo `sitio/_headers`.
- Si más adelante se usa Astro o formularios, el mismo servicio lo soporta.

### Alternativas consideradas
| Opción | Costo | Por qué no la recomiendo |
|---|---|---|
| Netlify (gratis) | $0 | Buena, pero el plan gratis tiene límite de ancho de banda y cobra si una campaña trae mucho tráfico. |
| Vercel Hobby | $0 | Sus condiciones prohíben uso comercial en el plan gratis; el pago parte en USD 20/mes. |
| GitHub Pages | $0 | No pensado para sitios comerciales y sin cabeceras de seguridad configurables. |
| Hosting chileno con cPanel | $30.000 a $80.000/año | Paga por algo que no se necesita para una página estática; despliegue manual. |

## Dominio
- **Principal:** `ortopediahumbertosalazar.cl`. No pude confirmar disponibilidad: el acceso a nic.cl
  está bloqueado desde este entorno. Se verifica en 10 segundos en https://www.nic.cl (buscador de la portada).
- **Respaldo**, por si está tomado o para un nombre más corto en anuncios: `ortopediasalazar.cl` o `humbertosalazar.cl`.
- Registrar a nombre de la empresa (RUT de la razón social), con un correo de Nicole que se revise siempre:
  si vence y no se renueva, se pierde.
- Se puede pagar por 1 año o varios; la renovación cuesta lo mismo. Recomiendo activar renovación con aviso.
- No hace falta comprar `.com` ahora; puede sumarse luego (≈ USD 10/año en Cloudflare) para proteger la marca.

## Pasos cuando Nicole apruebe (en orden)
1. Nicole revisa disponibilidad y registra el dominio en nic.cl (requiere su RUT o el de la empresa y pago).
2. Crear cuenta gratuita en Cloudflare con el correo de la empresa.
3. Conectar Cloudflare Pages al repositorio de GitHub; carpeta de salida `sitio`, sin comando de build.
4. En nic.cl, cambiar los servidores DNS a los que indique Cloudflare (yo preparo la guía paso a paso).
5. Vista previa privada en `*.pages.dev` para revisar.
6. Lanzamiento solo con aprobación, cuando estén resueltos los 4 bloqueos de la auditoría
   (WhatsApp, privacidad, datos del pie y fotos). Ese día se quita el `noindex`.

## Fuentes
- Tarifa .cl: https://simplo.cl/calculadoras/dominio-cl/ (vigente 2026, cita a NIC Chile) y https://nic.cl/dominios/fees-usd.html
- Google Workspace en Chile: https://medhacloud.com/blog/google-workspace-pricing-in-chile
- Límites de Cloudflare Pages: https://developers.cloudflare.com/pages/platform/limits
