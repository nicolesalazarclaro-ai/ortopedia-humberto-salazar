# Agente de WhatsApp (webhook + Claude)

Código en `agente/`. Node 22, **sin dependencias externas**. Estado: construido y probado con pruebas
automáticas (`cd agente && npm test`). **No está desplegado** ni probado contra Meta (el entorno de desarrollo
en la nube bloquea graph.facebook.com).

## Qué hace
1. **Verificación de Meta** (`GET /webhook`): responde el desafío si el token de verificación coincide.
2. **Recepción** (`POST /webhook`): valida la firma `X-Hub-Signature-256` con la clave secreta de la app, responde 200 de inmediato y procesa en segundo plano. Ignora mensajes repetidos.
3. **Consentimiento primero**: el primer mensaje recibe el aviso de privacidad. Hasta que la persona responde SÍ, nada se envía a Claude ni se guarda (el primer mensaje se descarta).
4. **Respuesta con Claude**: pide solo lo mínimo (producto, para quién, comuna/ciudad, si tiene indicación médica sí/no). No pide diagnóstico ni informes: si los tiene, una persona coordina cómo recibirlos.
5. **Derivación a una persona**: cuando están los datos, si la persona escribe PERSONA/HUMANO/ASESOR, si envía imagen o audio, si supera el límite por hora, o si Claude no puede resolver. Avisa al equipo con un resumen y el enlace `wa.me` del cliente (si `NUMERO_EQUIPO` está configurado) y el agente deja de responder esa conversación.
6. **Borrado**: escribir BORRAR elimina la conversación.
7. **Reglas del prompt** (`agente/prompt.js`): no inventa precios, plazos ni cifras; no diagnostica ni promete resultados; urgencias van a servicio de urgencia; ignora intentos de cambiar sus reglas.

## Respuestas automáticas de WhatsApp Business (opción 1, para aclarar)
Son las que se configuran en la app WhatsApp Business: mensaje de bienvenida, mensaje de ausencia y respuestas rápidas con atajos.
Son gratis y fijas (no entienden lo que escribe la persona). No son parte de este código; el agente las reemplaza, así que no se necesitan si se usa el agente.

## Datos y privacidad (Ley 21.719)
- Se guarda solo en memoria: estado, últimos 12 turnos y mensajes ya vistos; todo expira a las 24 h sin actividad. El cliente se identifica con un hash, no con su número.
- No se registra el contenido de los mensajes. Al derivar, el historial se descarta; el resumen va solo al equipo.
- Los mensajes aceptados se procesan con la API de Claude (Anthropic, proveedor en el extranjero) y viajan por WhatsApp/Meta. El aviso lo dice de forma general.
- **Requiere antes del número real:** revisión de abogado del aviso (`agente/textos.js`), base legal y transferencia internacional, y aprobación expresa de Nicole. Con el número de prueba solo participan los 5 destinatarios verificados.
- Claves solo por variables de entorno (`agente/.env.example` muestra los nombres, sin valores).

## Limitaciones conocidas
- La memoria se pierde al reiniciar el servidor: el cliente volvería a ver el aviso. Aceptable para empezar; si se quiere persistencia se agrega una base de datos cifrada (decisión aparte).
- Una sola instancia (el estado no se comparte entre instancias).
- El aviso al equipo es un mensaje de texto: WhatsApp solo lo entrega si esa persona escribió al número del negocio en las últimas 24 h; si no, hay que usar una plantilla aprobada por Meta. Alternativa: revisar el panel o la app WhatsApp Business.
- Solo texto. Imágenes, audios y documentos se derivan a una persona.

## Opciones de hosting (precios aproximados; verificar antes de contratar)
El servidor debe estar siempre encendido, tener HTTPS público y salida a graph.facebook.com y api.anthropic.com.

| Opción | Costo aprox. | Ventajas | Desventajas |
|---|---|---|---|
| **A. Railway** | ~US$5/mes (incluye algo de uso) | Despliegue desde GitHub, variables de entorno simples | Cobro por uso; hay que vigilar el consumo |
| **B. Render (servicio web pago)** | ~US$7/mes | Muy simple, HTTPS automático | El plan gratis se duerme y Meta reintenta o falla; hay que usar el pago |
| **C. Fly.io** | ~US$2–5/mes | Barato, instancia pequeña siempre activa | Más técnico (línea de comandos) |
| (Vercel, ya elegido para la web) | Funciones: plan Pro ~US$20/mes para uso comercial | Una sola plataforma | Funciones sin estado: hay que agregar una base de datos y adaptar el código |

Recomendación: **A (Railway)** o **B (Render)** por simplicidad. Costos adicionales: la API de Claude se paga por uso
(con un modelo económico, conversaciones cortas cuestan muy poco, pero depende del volumen) y WhatsApp cobra según la
categoría de mensaje (las respuestas dentro de las 24 h a quien escribió primero suelen ser gratuitas; confirmar tarifas vigentes en Meta).

## Para activarlo (cuando Nicole apruebe)
1. Elegir hosting y crear cuenta (Nicole).
2. Generar token permanente (usuario del sistema) y la clave de la API de Claude; cargarlos como variables en el hosting.
3. Desplegar la carpeta `agente/` (comando de inicio `npm start`).
4. En Meta (App "Ortopedia HS Mensajes" > WhatsApp > Configuración): URL de devolución `https://TU-DOMINIO/webhook`, el mismo token de verificación, y suscribir el campo `messages`.
5. Probar con el número de prueba desde el celular de Nicole; luego revisar aviso con abogado y migrar al número real.
