// Medición publicitaria (píxel de Meta) de Ortopedia Humberto Salazar.
//
// Reglas (CLAUDE.md, Ley 21.719):
// - Solo se mide el clic en los botones de WhatsApp y el producto del botón. Nada más.
// - Nunca se envían datos de salud, nombres, teléfonos ni textos escritos por la persona.
// - El píxel solo se carga si ACTIVO es true Y la persona aceptó las cookies de medición.
//
// Hoy queda APAGADO: falta la política de privacidad y el aviso de cookies.
// Para encenderlo (con aprobación de Nicole): cambiar ACTIVO a true, y el aviso de cookies
// debe guardar localStorage 'ohs-consentimiento' = 'aceptado' cuando la persona acepte.
{
  const ACTIVO = false;
  const PIXEL_ID = '4108469076122551';
  const CLAVE_CONSENTIMIENTO = 'ohs-consentimiento';

  const consintio = () => {
    try { return localStorage.getItem(CLAVE_CONSENTIMIENTO) === 'aceptado'; }
    catch (e) { return false; }
  };

  const cargarPixel = () => {
    if (window.fbq) return;
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
  };

  const iniciar = () => {
    if (!ACTIVO || !consintio()) return;
    cargarPixel();
    for (const a of document.querySelectorAll('[data-wa]')) {
      a.addEventListener('click', () => {
        // Solo el nombre del producto del botón (general, corse, plantillas, etc.).
        window.fbq('track', 'Contact', { producto: a.dataset.wa });
      });
    }
  };

  // El futuro aviso de cookies llamará a esto después de que la persona acepte.
  window.ohsActivarMedicion = iniciar;
  iniciar();
}
