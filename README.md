# Ortopedia Humberto Salazar: sitio web

Landing de cotización por WhatsApp para Ortopedia Humberto Salazar, taller familiar chileno
de fabricación ortopédica a medida con más de 40 años de trayectoria.

**Estado:** Fase 1 (infraestructura). Landing V5.1 aprobada; sin publicar.

## Carpetas
- `sitio/`: versión publicable (lo que sube al hosting).
- `fuente/`: HTML editable aprobado, con editor local. Fuente del contenido.
- `scripts/preparar_sitio.py`: genera `sitio/` desde `fuente/`.
- `pruebas/revisar.js`: revisión automática en navegador.
- `docs/`: auditoría, propuesta de hosting y dominio, decisiones y pendientes.
- `CLAUDE.md`: reglas del proyecto (contenido, privacidad, aprobaciones, técnica).

## Actualizar el sitio
```bash
python3 -I scripts/preparar_sitio.py fuente/Ortopedia_Salazar_V5_1_Editable.html sitio
NODE_PATH=$(npm root -g) node pruebas/revisar.js sitio/index.html
```

## Ver localmente
```bash
python3 -m http.server -d sitio 8080   # luego abrir http://localhost:8080
```
