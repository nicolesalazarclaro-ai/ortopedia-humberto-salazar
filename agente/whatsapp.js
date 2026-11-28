// Cliente mínimo de la WhatsApp Cloud API. Las pruebas reales contra Meta deben hacerse
// desde un servidor con salida a graph.facebook.com (el entorno de desarrollo en la nube lo bloquea).
export function crearWhatsApp(cfg, fetchFn = fetch) {
  const url = `${cfg.graphBase}/${cfg.graphVersion}/${cfg.phoneNumberId}/messages`;

  async function llamar(cuerpo) {
    if (cfg.simulacion) {
      console.log('[simulación] WhatsApp ←', JSON.stringify(cuerpo));
      return { ok: true };
    }
    const r = await fetchFn(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.tokenWhatsApp}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...cuerpo }),
    });
    if (!r.ok) {
      // No se registra el cuerpo (puede contener datos del cliente), solo el código.
      throw new Error(`WhatsApp respondió ${r.status}`);
    }
    return r.json();
  }

  return {
    enviarTexto: (a, texto) =>
      llamar({ to: a, type: 'text', text: { body: texto.slice(0, 4000), preview_url: false } }),
    marcarLeido: (idMensaje) =>
      llamar({ status: 'read', message_id: idMensaje }).catch(() => {}),
  };
}
