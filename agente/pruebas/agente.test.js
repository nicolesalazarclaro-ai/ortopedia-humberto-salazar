import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { cargarConfig, validarConfig } from '../config.js';
import { crearAlmacen } from '../almacen.js';
import { crearAgente } from '../conversacion.js';
import { crearServidor, firmaValida } from '../servidor.js';
import { crearClaude } from '../claude.js';
import { TEXTOS } from '../textos.js';

const cfg = cargarConfig({ WHATSAPP_VERIFY_TOKEN: 'tv', META_APP_SECRET: 'sec', NUMERO_EQUIPO: '56911111111' });

function montar(respuestas = []) {
  const enviados = [];
  const llamadasClaude = [];
  const wa = { enviarTexto: async (a, t) => enviados.push([a, t]), marcarLeido: () => {} };
  const claude = { responder: async (h) => { llamadasClaude.push(structuredClone(h)); return respuestas.shift() || { texto: 'ok', derivar: null }; } };
  const almacen = crearAlmacen();
  const agente = crearAgente({ cfg, almacen, wa, claude, log: () => {} });
  let n = 0;
  const msg = (texto, de = '56922222222') => agente.procesarMensaje({ from: de, id: 'm' + n++, type: 'text', text: { body: texto } });
  return { enviados, llamadasClaude, msg, agente, almacen };
}

test('primer mensaje: aviso de privacidad y nada va a Claude', async () => {
  const { enviados, llamadasClaude, msg } = montar();
  await msg('Hola, quiero cotizar un corsé');
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0][1], TEXTOS.aviso);
  assert.equal(llamadasClaude.length, 0);
});

test('sin aceptar, no se llama a Claude; con SÍ continúa', async () => {
  const { enviados, llamadasClaude, msg } = montar([{ texto: 'Perfecto, ¿para quién es?', derivar: null }]);
  await msg('hola');
  await msg('cuánto cuesta?');
  assert.equal(enviados[1][1], TEXTOS.recordatorioConsentimiento);
  await msg('Sí');
  assert.equal(enviados[2][1], TEXTOS.consentimientoOk);
  assert.equal(llamadasClaude.length, 0);
  await msg('un corsé');
  assert.equal(llamadasClaude.length, 1);
  assert.deepEqual(llamadasClaude[0], [{ role: 'user', content: 'un corsé' }]);
  assert.equal(enviados[3][1], 'Perfecto, ¿para quién es?');
});

test('NO borra y no continúa', async () => {
  const { enviados, almacen, msg } = montar();
  await msg('hola'); await msg('no');
  assert.equal(enviados[1][1], TEXTOS.rechazo);
  assert.equal(almacen.tamano(), 0);
});

test('Claude deriva: avisa al cliente y al equipo, luego el agente calla', async () => {
  const { enviados, msg } = montar([{ texto: 'Gracias.', derivar: { motivo: 'cotizacion_lista', resumen: 'Corsé, adulto, Ñuñoa, con indicación' } }]);
  await msg('hola'); await msg('si'); await msg('corsé');
  const aEquipo = enviados.filter(([a]) => a === '56911111111');
  assert.equal(aEquipo.length, 1);
  assert.match(aEquipo[0][1], /wa\.me\/56922222222/);
  assert.equal(enviados.at(-1)[1], TEXTOS.derivado);
  await msg('hola?');
  assert.equal(enviados.at(-1)[1], TEXTOS.yaDerivado);
  const antes = enviados.length;
  await msg('??');
  assert.equal(enviados.length, antes); // solo avisa una vez
});

test('PERSONA deriva sin llamar a Claude', async () => {
  const { enviados, llamadasClaude, msg } = montar();
  await msg('hola'); await msg('si'); await msg('quiero hablar con una persona');
  assert.equal(llamadasClaude.length, 0);
  assert.equal(enviados.at(-1)[1], TEXTOS.derivado);
});

test('BORRAR elimina la conversación', async () => {
  const { enviados, almacen, msg } = montar();
  await msg('hola'); await msg('si');
  await msg('borrar mis datos');
  assert.equal(enviados.at(-1)[1], TEXTOS.borrado);
  assert.equal(almacen.tamano(), 0);
});

test('mensaje repetido por Meta se procesa una sola vez', async () => {
  const { enviados, agente } = montar();
  const m = { from: '56933333333', id: 'dup', type: 'text', text: { body: 'hola' } };
  await agente.procesarMensaje(m); await agente.procesarMensaje(m);
  assert.equal(enviados.length, 1);
});

test('error de Claude: se avisa al cliente sin exponer detalles', async () => {
  const { enviados, agente } = montar();
  const wa = { enviarTexto: async (a, t) => enviados.push([a, t]), marcarLeido() {} };
  const ag = crearAgente({ cfg, almacen: crearAlmacen(), wa, claude: { responder: async () => { throw new Error('boom'); } }, log: () => {} });
  const m = (t, i) => ag.procesarMensaje({ from: '56944444444', id: i, type: 'text', text: { body: t } });
  await m('hola', '1'); await m('si', '2'); await m('corsé', '3');
  assert.equal(enviados.at(-1)[1], TEXTOS.falla);
});

test('límite por hora deriva', async () => {
  const c2 = { ...cfg, maxMensajesPorHora: 2 };
  const enviados = [];
  const wa = { enviarTexto: async (a, t) => enviados.push([a, t]), marcarLeido() {} };
  const ag = crearAgente({ cfg: c2, almacen: crearAlmacen(), wa, claude: { responder: async () => ({ texto: 'ok', derivar: null }) }, log: () => {} });
  let i = 0;
  const m = (t) => ag.procesarMensaje({ from: '56955555555', id: 'x' + i++, type: 'text', text: { body: t } });
  await m('hola'); await m('si'); await m('a'); await m('b'); await m('c');
  assert.equal(enviados.at(-1)[1], TEXTOS.limite);
});

test('imagen o audio tras aceptar: deriva y avisa', async () => {
  const { enviados, agente, msg } = montar();
  await msg('hola'); await msg('si');
  await agente.procesarMensaje({ from: '56922222222', id: 'img1', type: 'image' });
  assert.equal(enviados.at(-1)[1], TEXTOS.noTexto);
});

test('firma HMAC válida e inválida', () => {
  const cuerpo = Buffer.from('{"a":1}');
  const f = 'sha256=' + createHmac('sha256', 'sec').update(cuerpo).digest('hex');
  assert.equal(firmaValida(cuerpo, f, 'sec'), true);
  assert.equal(firmaValida(cuerpo, f.slice(0, -1) + '0', 'sec'), false);
  assert.equal(firmaValida(cuerpo, undefined, 'sec'), false);
  assert.equal(firmaValida(cuerpo, f, ''), false);
});

test('servidor: verificación de Meta, firma y recepción', async () => {
  const recibidos = [];
  const srv = crearServidor({ cfg, agente: { procesarPayload: async (p) => recibidos.push(p) } });
  await new Promise((r) => srv.listen(0, r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  try {
    let r = await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=tv&hub.challenge=123`);
    assert.equal(r.status, 200); assert.equal(await r.text(), '123');
    r = await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=malo&hub.challenge=123`);
    assert.equal(r.status, 403);
    const cuerpo = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
    r = await fetch(`${base}/webhook`, { method: 'POST', body: cuerpo, headers: { 'x-hub-signature-256': 'sha256=00' } });
    assert.equal(r.status, 401);
    const f = 'sha256=' + createHmac('sha256', 'sec').update(cuerpo).digest('hex');
    r = await fetch(`${base}/webhook`, { method: 'POST', body: cuerpo, headers: { 'x-hub-signature-256': f } });
    assert.equal(r.status, 200);
    await new Promise((x) => setTimeout(x, 20));
    assert.equal(recibidos.length, 1);
    assert.equal((await fetch(`${base}/salud`)).status, 200);
  } finally { srv.close(); }
});

test('cliente de Claude: lee texto y herramienta de derivación', async () => {
  const falso = async (url, init) => {
    const b = JSON.parse(init.body);
    assert.ok(b.system.includes('No inventes'));
    assert.equal(b.tools[0].name, 'derivar_a_persona');
    return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Hola' }, { type: 'tool_use', name: 'derivar_a_persona', input: { motivo: 'otro', resumen: 'x' } }] }) };
  };
  const c = crearClaude({ ...cfg, anthropicKey: 'k' }, falso);
  const r = await c.responder([{ role: 'user', content: 'hola' }]);
  assert.equal(r.texto, 'Hola'); assert.equal(r.derivar.motivo, 'otro');
});

test('validarConfig exige variables en producción', () => {
  assert.throws(() => validarConfig(cargarConfig({}), true), /WHATSAPP_VERIFY_TOKEN/);
  assert.deepEqual(validarConfig(cargarConfig({ SIMULACION: '1', WHATSAPP_VERIFY_TOKEN: 'a', META_APP_SECRET: 'b' }), true), []);
});
