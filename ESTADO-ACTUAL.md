# Estado actual (actualizado 28-nov-2026)

## Hecho
- Landing V5.1 aprobada, sin publicar (ver README y docs/pendientes.md).
- Meta: portafolio, página, Instagram, píxel, cuenta publicitaria y app "Ortopedia HS Mensajes" conectados.
- WhatsApp Cloud API con número de prueba +1 (555) 157-7562 (Phone Number ID 1379790768560621), destinatario de prueba: celular de Nicole.
- **Código del webhook y agente WhatsApp** en `agente/` (rama `claude/project-thread-inxv8p`, PR abierto): verificación de Meta, firma, consentimiento, respuesta con Claude, derivación a persona, borrado. 14 pruebas automáticas pasan. Detalle y opciones de hosting en `docs/agente-whatsapp.md`.

## Pendiente (requiere a Nicole)
1. Aprobar el PR y elegir hosting (A Railway, B Render o C Fly.io; ver docs/agente-whatsapp.md).
2. Token permanente de usuario del sistema y clave de la API de Claude, solo como variables de entorno del hosting.
3. Probar el agente contra Meta desde un servidor con salida a internet (el entorno en la nube bloquea graph.facebook.com).
4. Número real del negocio; verificación del negocio en Meta.
5. Revisión de abogado del aviso de privacidad (`agente/textos.js`) y aprobación expresa antes de usar el número real.
6. Decidir qué hacer con la cuenta publicitaria antigua de Smartgo.
7. Datos del negocio que faltan para el agente: horarios y dirección (hoy el agente deriva esas preguntas a una persona).

## Reglas vigentes
Ver CLAUDE.md. Cambio decidido por Nicole el 28-nov: el agente sí puede recibir datos de salud mínimos por WhatsApp (su negocio es de salud), con aviso, consentimiento y registro mínimo; la Ley 21.719 sigue aplicando.
