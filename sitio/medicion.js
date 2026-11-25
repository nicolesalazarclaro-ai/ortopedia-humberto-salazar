// Medición publicitaria (píxel de Meta) y aviso de cookies de Ortopedia Humberto Salazar.
//
// Reglas (CLAUDE.md, Ley 21.719):
// - Solo se mide el clic en los botones de WhatsApp y el producto del botón. Nada más.
// - Nunca se envían datos de salud, nombres, teléfonos ni textos escritos por la persona.
// - El píxel solo se carga si ACTIVO es true Y la persona aceptó en el aviso de cookies.
// - Rechazar es tan fácil como aceptar, y la decisión se puede cambiar en "Preferencias de cookies".
{
  const ACTIVO = true;
  const PIXEL_ID = '4108469076122551';
  const CLAVE = 'ohs-consentimiento'; // 'aceptado' | 'rechazado'

  const leer = () => { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } };
  const guardar = (v) => { try { localStorage.setItem(CLAVE, v); } catch (e) {} };

  let cargado = false;
  const cargarPixel = () => {
    if (cargado || !ACTIVO) return;
    cargado = true;
    const fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
    window.fbq = window._fbq = fbq;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
    for (const a of document.querySelectorAll('[data-wa]')) {
      a.addEventListener('click', () => {
        // Solo el nombre del producto del botón (general, corse, plantillas, etc.).
        window.fbq('track', 'Contact', { producto: a.dataset.wa });
      });
    }
  };

  // Estilos del aviso (colores de la identidad V5.1).
  const css = document.createElement('style');
  css.textContent = `
.cookies{position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:560px;margin:0 auto;
  background:#fff;color:#193344;border:1px solid #d5dbd5;border-radius:14px;padding:18px 20px;
  box-shadow:0 12px 32px rgba(25,51,68,.18);font:400 15px/1.55 Figtree,system-ui,sans-serif}
.cookies[hidden]{display:none}
.cookies h2{font:600 18px/1.3 Fraunces,Georgia,serif;margin:0 0 6px}
.cookies p{margin:0 0 14px}
.cookies a{color:#22724C}
.cookies-botones{display:flex;gap:10px}
.cookies-botones button{flex:1;min-height:44px;border-radius:999px;font:600 15px Figtree,system-ui,sans-serif;cursor:pointer}
.cookies-aceptar{background:#193344;color:#fff;border:1px solid #193344}
.cookies-rechazar{background:#fff;color:#193344;border:1px solid #193344}
.cookies-botones button:focus-visible,.cookies-pref:focus-visible{outline:3px solid #22724C;outline-offset:2px}
.cookies-pref{background:none;border:0;padding:0;min-height:44px;color:inherit;font:inherit;text-decoration:underline;cursor:pointer}
@media(max-width:820px){.cookies{bottom:84px}}`;
  document.head.appendChild(css);

  const aviso = document.createElement('section');
  aviso.className = 'cookies';
  aviso.setAttribute('aria-label', 'Aviso de cookies');
  aviso.hidden = true;
  aviso.innerHTML = `
<h2>Usamos cookies solo si tú quieres</h2>
<p>Con tu permiso, el píxel de Meta registra cuando haces clic en "Cotizar por WhatsApp". Así sabemos qué anuncios funcionan. No enviamos tus mensajes ni datos de salud. Más detalle en nuestra <a href="privacidad.html">política de privacidad</a>.</p>
<div class="cookies-botones">
<button type="button" class="cookies-aceptar">Aceptar</button>
<button type="button" class="cookies-rechazar">Rechazar</button>
</div>`;

  const decidir = (valor) => {
    const antes = leer();
    guardar(valor);
    aviso.hidden = true;
    if (valor === 'aceptado') cargarPixel();
    // Si antes había aceptado y ahora rechaza, recargar para quitar el píxel ya cargado.
    else if (antes === 'aceptado' && cargado) location.reload();
  };

  const iniciar = () => {
    document.body.appendChild(aviso);
    aviso.querySelector('.cookies-aceptar').addEventListener('click', () => decidir('aceptado'));
    aviso.querySelector('.cookies-rechazar').addEventListener('click', () => decidir('rechazado'));

    // Enlace "Preferencias de cookies" al pie de la página.
    const legal = document.querySelector('footer .legal');
    if (legal) {
      const pref = document.createElement('button');
      pref.type = 'button';
      pref.className = 'cookies-pref';
      pref.textContent = 'Preferencias de cookies';
      pref.addEventListener('click', () => {
        aviso.hidden = false;
        aviso.querySelector('.cookies-aceptar').focus();
      });
      const envoltura = document.createElement('span');
      envoltura.appendChild(pref);
      legal.appendChild(envoltura);
    }

    const d = leer();
    if (d === 'aceptado') cargarPixel();
    else if (d !== 'rechazado') aviso.hidden = false;
  };

  if (ACTIVO) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
  }
}
