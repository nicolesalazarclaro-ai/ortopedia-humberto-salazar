// Toda la configuración viene de variables de entorno. Nunca se guardan claves en archivos.
const PRODUCCION = process.env.NODE_ENV === 'production';

export function cargarConfig(env = process.env) {
  const cfg = {
    puerto: Number(env.PORT || 3000),
    // Meta / WhatsApp Cloud API
    tokenVerificacion: env.WHATSAPP_VERIFY_TOKEN || '',
    appSecret: env.META_APP_SECRET || '',
    tokenWhatsApp: env.WHATSAPP_TOKEN || '',
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || '',
    graphVersion: env.GRAPH_VERSION || 'v22.0',
    graphBase: env.GRAPH_BASE || 'https://graph.facebook.com',
    // Claude
    anthropicKey: env.ANTHROPIC_API_KEY || '',
    modelo: env.CLAUDE_MODEL || 'claude-haiku-5-5',
    anthropicBase: env.ANTHROPIC_BASE || 'https://api.anthropic.com',
    // Derivación: número de la persona que atiende (formato 569XXXXXXXX). Opcional.
    numeroEquipo: env.NUMERO_EQUIPO || '',
    // Límites para controlar costo y abuso
    maxMensajesPorHora: Number(env.MAX_MENSAJES_POR_HORA || 30),
    maxTurnosHistorial: Number(env.MAX_TURNOS_HISTORIAL || 12),
    horasRetencion: Number(env.HORAS_RETENCION || 24),
    // Si es "1", el agente no llama a WhatsApp ni a Claude (modo simulación para pruebas locales)
    simulacion: env.SIMULACION === '1',
  };
  return cfg;
}

export function validarConfig(cfg, produccion = PRODUCCION) {
  const faltan = [];
  if (!cfg.tokenVerificacion) faltan.push('WHATSAPP_VERIFY_TOKEN');
  if (!cfg.appSecret) faltan.push('META_APP_SECRET');
  if (!cfg.simulacion) {
    if (!cfg.tokenWhatsApp) faltan.push('WHATSAPP_TOKEN');
    if (!cfg.phoneNumberId) faltan.push('WHATSAPP_PHONE_NUMBER_ID');
    if (!cfg.anthropicKey) faltan.push('ANTHROPIC_API_KEY');
  }
  if (faltan.length && produccion) {
    throw new Error('Faltan variables de entorno: ' + faltan.join(', '));
  }
  return faltan;
}
