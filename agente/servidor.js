// Servidor webhook de WhatsApp. Solo usa módulos de Node (sin dependencias).
import http from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cargarConfig, validarConfig } from './config.js';
import { crearAlmacen } from './almacen.js';
import { crearWhatsApp } from './whatsapp.js';
import { crearClaude } from './claude.js';
import { crearAgente } from './conversacion.js';

const MAX_CUERPO = 256 * 1024;

export function firmaValida(cuerpoCrudo, cabecera, appSecret) {
  if (!cabecera || !appSecret || !cabecera.startsWith('sha256=')) return false;
  const esperada = createHmac('sha256', appSecret).update(cuerpoCrudo).digest('hex');
  const recibida = cabecera.slice(7);
  const a = Buffer.from(esperada);
  const b = Buffer.from(recibida);
  return a.length === b.length && timingSafeEqual(a, b);
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    const partes = [];
    let total = 0;
    req.on('data', (d) => {
      total += d.length;
      if (total > MAX_CUERPO) { reject(new Error('cuerpo demasiado grande')); req.destroy(); return; }
      partes.push(d);
    });
    req.on('end', () => resolve(Buffer.concat(partes)));
    req.on('error', reject);
  });
}

export function crearServidor({ cfg, agente }) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const responder = (codigo, texto = '') => { res.writeHead(codigo, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(texto); };

    if (req.method === 'GET' && url.pathname === '/salud') return responder(200, 'ok');

    if (url.pathname !== '/webhook') return responder(404);

    // Verificación de Meta al registrar el webhook
    if (req.method === 'GET') {
      const ok = url.searchParams.get('hub.mode') === 'subscribe' &&
        cfg.tokenVerificacion && url.searchParams.get('hub.verify_token') === cfg.tokenVerificacion;
      return ok ? responder(200, url.searchParams.get('hub.challenge') || '') : responder(403);
    }

    if (req.method === 'POST') {
      let cuerpo;
      try { cuerpo = await leerCuerpo(req); } catch { return responder(413); }
      if (!firmaValida(cuerpo, req.headers['x-hub-signature-256'], cfg.appSecret)) return responder(401);
      let payload;
      try { payload = JSON.parse(cuerpo.toString('utf8')); } catch { return responder(400); }
      responder(200); // Meta exige respuesta rápida; el procesamiento sigue en segundo plano
      agente.procesarPayload(payload).catch((e) => console.log('error procesando payload:', e.message));
      return;
    }
    responder(405);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cfg = cargarConfig();
  const faltan = validarConfig(cfg);
  if (faltan.length) console.warn('Aviso: faltan variables de entorno:', faltan.join(', '));
  const almacen = crearAlmacen({ horasRetencion: cfg.horasRetencion });
  const agente = crearAgente({ cfg, almacen, wa: crearWhatsApp(cfg), claude: crearClaude(cfg) });
  crearServidor({ cfg, agente }).listen(cfg.puerto, () => console.log(`Webhook escuchando en el puerto ${cfg.puerto}`));
}
