// Llamada directa a la API de Claude (Messages) sin SDK, para no sumar dependencias.
import { PROMPT_SISTEMA } from './prompt.js';

export const HERRAMIENTAS = [
  {
    name: 'derivar_a_persona',
    description:
      'Deriva la conversación a una persona del equipo. Úsala cuando la persona ya entregó los datos mínimos para cotizar, ' +
      'cuando pide hablar con una persona, cuando pregunta por precios, plazos o temas médicos que no puedes resolver, ' +
      'o ante cualquier duda. El resumen es solo para el equipo y debe ser breve.',
    input_schema: {
      type: 'object',
      properties: {
        motivo: { type: 'string', enum: ['cotizacion_lista', 'pide_persona', 'consulta_medica', 'precio_o_plazo', 'otro'] },
        resumen: {
          type: 'string',
          description: 'Resumen breve: producto de interés, para quién (adulto/niño), comuna o ciudad, si cuenta con indicación médica (sí/no) y qué consulta. No incluir diagnósticos ni detalles clínicos innecesarios.',
        },
      },
      required: ['motivo', 'resumen'],
    },
  },
];

export function crearClaude(cfg, fetchFn = fetch) {
  return {
    // historial: [{role:'user'|'assistant', content:string}, ...] que termina en un turno 'user'.
    async responder(historial) {
      if (cfg.simulacion) {
        return { texto: '[simulación] Respuesta del agente.', derivar: null };
      }
      const r = await fetchFn(`${cfg.anthropicBase}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': cfg.anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: cfg.modelo,
          max_tokens: 500,
          system: PROMPT_SISTEMA,
          tools: HERRAMIENTAS,
          messages: historial,
        }),
      });
      if (!r.ok) throw new Error(`Claude respondió ${r.status}`);
      const data = await r.json();
      const texto = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      const uso = (data.content || []).find((b) => b.type === 'tool_use' && b.name === 'derivar_a_persona');
      return { texto, derivar: uso ? uso.input : null };
    },
  };
}
