// Lógica de la conversación: consentimiento, comandos, respuesta con Claude y derivación.
import { TEXTOS } from './textos.js';
import { hashCliente } from './almacen.js';

const norm = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

const SI = new Set(['si', 'sii', 'acepto', 'ok', 'dale', 'de acuerdo', 'si acepto', 'si, acepto']);
const NO = new Set(['no', 'no acepto', 'no gracias', 'rechazo']);
const PERSONA = /\b(persona|humano|asesor|asesora|ejecutivo|ejecutiva|alguien del equipo)\b/;
const BORRAR = /\b(borrar|eliminar|elimina|borra)\b/;

export function crearAgente({ cfg, almacen, wa, claude, log = console.log }) {
  const sal = cfg.appSecret; // sal para el hash; evita relacionar el hash con el número sin el secreto

  async function derivar(numero, id, c, info) {
    c.estado = 'derivado';
    c.historial = []; // ya no se necesita el detalle de la conversación en el agente
    if (cfg.numeroEquipo) {
      const nota =
        `Nueva consulta de WhatsApp (${info.motivo}).\nCliente: https://wa.me/${numero}\nResumen: ${info.resumen}`;
      try {
        await wa.enviarTexto(cfg.numeroEquipo, nota);
      } catch (e) {
        log(`[${id}] no se pudo avisar al equipo: ${e.message}`);
      }
    } else {
      // Sin número del equipo configurado, el resumen queda solo en el registro del servidor.
      log(`[${id}] derivación (${info.motivo}): ${info.resumen}`);
    }
  }

  async function procesarTexto(numero, texto) {
    const id = hashCliente(numero, sal);
    const t = norm(texto);

    // Comando de borrado: siempre disponible.
    if (BORRAR.test(t) && t.split(' ').length <= 6) {
      almacen.borrar(id);
      return wa.enviarTexto(numero, TEXTOS.borrado);
    }

    const c = almacen.obtener(id);

    if (c.estado === 'derivado') {
      if (!c.avisado) {
        c.avisado = true;
        await wa.enviarTexto(numero, TEXTOS.yaDerivado);
      }
      return;
    }

    if (c.estado === 'nuevo') {
      c.estado = 'esperando_consentimiento';
      // El primer mensaje del cliente no se guarda ni se envía a Claude hasta que acepte.
      return wa.enviarTexto(numero, TEXTOS.aviso);
    }

    if (c.estado === 'esperando_consentimiento') {
      if (PERSONA.test(t)) {
        await derivar(numero, id, c, { motivo: 'pide_persona', resumen: 'Pidió hablar con una persona antes de aceptar el aviso de privacidad. No se registraron datos.' });
        return wa.enviarTexto(numero, TEXTOS.derivado);
      }
      if (SI.has(t)) {
        c.estado = 'activo';
        return wa.enviarTexto(numero, TEXTOS.consentimientoOk);
      }
      if (NO.has(t)) {
        almacen.borrar(id);
        return wa.enviarTexto(numero, TEXTOS.rechazo);
      }
      return wa.enviarTexto(numero, TEXTOS.recordatorioConsentimiento);
    }

    // Estado activo
    if (almacen.limitado(id, cfg.maxMensajesPorHora)) {
      await derivar(numero, id, c, { motivo: 'otro', resumen: 'Superó el límite de mensajes por hora.' });
      return wa.enviarTexto(numero, TEXTOS.limite);
    }
    if (PERSONA.test(t) && t.split(' ').length <= 8) {
      await derivar(numero, id, c, { motivo: 'pide_persona', resumen: resumirHistorial(c) });
      return wa.enviarTexto(numero, TEXTOS.derivado);
    }

    c.historial.push({ role: 'user', content: texto.slice(0, 1000) });
    recortar(c, cfg.maxTurnosHistorial);
    const r = await claude.responder(c.historial);
    if (r.texto) {
      c.historial.push({ role: 'assistant', content: r.texto });
      await wa.enviarTexto(numero, r.texto);
    } else if (!r.derivar) {
      // Respuesta vacía: se deriva en vez de dejar al cliente sin respuesta.
      r.derivar = { motivo: 'otro', resumen: 'El asistente no pudo responder.' };
    }
    if (r.derivar) {
      await derivar(numero, id, c, r.derivar);
      await wa.enviarTexto(numero, TEXTOS.derivado);
    }
  }

  async function procesarMensaje(m) {
    const numero = m.from;
    if (!numero || !m.id) return;
    if (almacen.yaVisto(m.id)) return; // Meta puede reenviar el mismo evento
    wa.marcarLeido(m.id);
    try {
      if (m.type !== 'text' || !m.text?.body) {
        const id = hashCliente(numero, sal);
        const c = almacen.obtener(id);
        if (c.estado === 'activo' || c.estado === 'derivado') {
          if (c.estado === 'activo') await derivar(numero, id, c, { motivo: 'otro', resumen: `Envió un mensaje de tipo "${m.type}" (no procesado por el agente).` });
          return wa.enviarTexto(numero, TEXTOS.noTexto);
        }
        return procesarTexto(numero, ''); // antes de aceptar: se trata como mensaje vacío (aviso o recordatorio)
      }
      await procesarTexto(numero, m.text.body);
    } catch (e) {
      log(`[${hashCliente(numero, sal)}] error: ${e.message}`);
      try {
        await wa.enviarTexto(numero, TEXTOS.falla);
      } catch { /* sin más opciones */ }
    }
  }

  return { procesarMensaje, procesarPayload };

  async function procesarPayload(payload) {
    if (payload?.object !== 'whatsapp_business_account') return;
    for (const entrada of payload.entry || []) {
      for (const cambio of entrada.changes || []) {
        for (const m of cambio.value?.messages || []) await procesarMensaje(m);
      }
    }
  }
}

function recortar(c, max) {
  while (c.historial.length > max * 2) c.historial.shift();
  while (c.historial.length && c.historial[0].role !== 'user') c.historial.shift();
}

function resumirHistorial(c) {
  const u = c.historial.filter((h) => h.role === 'user').map((h) => h.content).join(' | ');
  return u ? `Mensajes del cliente: ${u.slice(0, 600)}` : 'Pidió hablar con una persona.';
}
