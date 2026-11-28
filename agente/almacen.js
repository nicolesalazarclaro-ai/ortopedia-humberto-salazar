// Almacén mínimo en memoria. Guarda solo lo necesario para sostener la conversación:
// estado, últimos turnos y mensajes ya vistos. Todo expira por inactividad.
// El identificador del cliente se guarda como hash, no como número.
import { createHash } from 'node:crypto';

export function hashCliente(numero, sal = '') {
  return createHash('sha256').update(sal + numero).digest('hex').slice(0, 16);
}

export function crearAlmacen({ horasRetencion = 24, ahora = () => Date.now() } = {}) {
  const conversaciones = new Map(); // id -> {estado, historial, ultimo, avisos}
  const vistos = new Map(); // id mensaje -> ts
  const ventanas = new Map(); // id -> [ts]
  const ttl = horasRetencion * 3600 * 1000;

  function limpiar() {
    const t = ahora();
    for (const [k, v] of conversaciones) if (t - v.ultimo > ttl) conversaciones.delete(k);
    for (const [k, ts] of vistos) if (t - ts > ttl) vistos.delete(k);
    for (const [k, arr] of ventanas) {
      const r = arr.filter((x) => t - x < 3600 * 1000);
      if (r.length) ventanas.set(k, r); else ventanas.delete(k);
    }
  }

  return {
    obtener(id) {
      limpiar();
      let c = conversaciones.get(id);
      if (!c) {
        c = { estado: 'nuevo', historial: [], ultimo: ahora() };
        conversaciones.set(id, c);
      }
      c.ultimo = ahora();
      return c;
    },
    borrar(id) {
      conversaciones.delete(id);
      ventanas.delete(id);
    },
    yaVisto(idMensaje) {
      if (vistos.has(idMensaje)) return true;
      vistos.set(idMensaje, ahora());
      return false;
    },
    // Devuelve true si el cliente superó el límite por hora.
    limitado(id, max) {
      const t = ahora();
      const arr = (ventanas.get(id) || []).filter((x) => t - x < 3600 * 1000);
      arr.push(t);
      ventanas.set(id, arr);
      return arr.length > max;
    },
    tamano: () => conversaciones.size,
  };
}
