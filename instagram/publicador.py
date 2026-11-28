#!/usr/bin/env python3
"""Cola y publicación programada en Instagram (Instagram Graph API).

Solo usa la biblioteca estándar de Python. Reglas clave:
  * Nada se publica sin aprobación expresa de Nicole registrada en la pieza.
  * Por defecto es un ensayo (--ensayo): valida y muestra qué haría, sin llamar a Meta.
  * Tokens solo por variables de entorno (IG_ACCESS_TOKEN, IG_USER_ID). Nunca en archivos.
  * Hay que ejecutarlo desde un lugar con salida a graph.facebook.com (el entorno
    cloud de Claude la bloquea; sirve el computador de Nicole u otro servicio que ella apruebe).

Uso:
  python3 -I instagram/publicador.py validar            # revisa todas las piezas
  python3 -I instagram/publicador.py estado             # resume la cola
  python3 -I instagram/publicador.py ejecutar           # ensayo de lo que toca publicar ahora
  python3 -I instagram/publicador.py ejecutar --publicar   # publica de verdad lo aprobado y vencido
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

TZ_CHILE = ZoneInfo("America/Santiago")
VERSION_API = os.environ.get("IG_API_VERSION", "v21.0")
BASE = os.environ.get("IG_GRAPH_BASE", "https://graph.facebook.com")
COLA_POR_DEFECTO = Path(__file__).with_name("cola.json")

MAX_CAPTION = 2200
MAX_HASHTAGS = 30
MAX_CARRUSEL = 10
ESTADOS = {"borrador", "aprobada", "publicada", "error", "cancelada"}

# Promesas de salud y afirmaciones que las reglas del proyecto prohíben.
FRASES_PROHIBIDAS = [
    r"\bcura(r|rá|mos|n)?\b", r"\bsana(r|rá)?\b", r"\bgarantiz", r"100 ?% efectiv",
    r"\belimina (el|la|los|las) dolor", r"sin dolor", r"\bmilagro", r"\bantes y después\b",
    r"\btestimonio", r"\bcertificad[oa]", r"\bdiagnóstic",
]
AVISO_SALUD = "no reemplaza la evaluación de un profesional de la salud"


class ErrorPieza(Exception):
    pass


def ahora():
    return datetime.now(TZ_CHILE)


def parsear_fecha(texto):
    """'2026-12-03 10:30' (hora de Chile) -> datetime con zona."""
    try:
        return datetime.strptime(texto, "%Y-%m-%d %H:%M").replace(tzinfo=TZ_CHILE)
    except (TypeError, ValueError):
        raise ErrorPieza(f"fecha inválida {texto!r}; use 'AAAA-MM-DD HH:MM' (hora de Chile)")


def texto_final(p):
    """Caption completo: gancho + título + cuerpo + aviso + hashtags."""
    partes = [p.get("gancho", "").strip(), p.get("titulo", "").strip(), p.get("texto", "").strip()]
    if p.get("aviso_salud", True):
        partes.append("Esta publicación es informativa y " + AVISO_SALUD + ".")
    if p.get("hashtags"):
        partes.append(" ".join(h if h.startswith("#") else "#" + h for h in p["hashtags"]))
    return "\n\n".join(x for x in partes if x)


def validar_pieza(p):
    """Devuelve lista de problemas (vacía = válida)."""
    errs = []
    if p.get("estado") not in ESTADOS:
        errs.append(f"estado inválido {p.get('estado')!r}")
    if not p.get("id"):
        errs.append("falta id")
    for campo in ("gancho", "texto"):
        if not str(p.get(campo, "")).strip():
            errs.append(f"falta {campo}")
    tipo = p.get("tipo", "IMAGEN")
    imgs = p.get("imagenes", [])
    if tipo not in ("IMAGEN", "CARRUSEL"):
        errs.append("tipo debe ser IMAGEN o CARRUSEL")
    if tipo == "IMAGEN" and len(imgs) != 1:
        errs.append("una IMAGEN lleva exactamente 1 URL en 'imagenes'")
    if tipo == "CARRUSEL" and not 2 <= len(imgs) <= MAX_CARRUSEL:
        errs.append(f"un CARRUSEL lleva entre 2 y {MAX_CARRUSEL} imágenes")
    for u in imgs:
        if not u.startswith("https://"):
            errs.append(f"la imagen debe ser una URL pública https: {u}")
        elif not re.search(r"\.(jpe?g)(\?.*)?$", u, re.I):
            errs.append(f"Instagram solo acepta JPEG por API: {u}")
    if imgs and not p.get("imagen_ilustrativa") and not p.get("imagen_real"):
        errs.append("indique si la imagen es real (imagen_real) o ilustrativa (imagen_ilustrativa)")
    if p.get("imagen_ilustrativa") and "ilustrativ" not in texto_final(p).lower():
        errs.append("imagen ilustrativa: el texto debe rotularla ('Imagen ilustrativa')")
    tags = p.get("hashtags", [])
    if len(tags) > MAX_HASHTAGS:
        errs.append(f"máximo {MAX_HASHTAGS} hashtags")
    cap = texto_final(p)
    if len(cap) > MAX_CAPTION:
        errs.append(f"texto de {len(cap)} caracteres; máximo {MAX_CAPTION}")
    for patron in FRASES_PROHIBIDAS:
        m = re.search(patron, cap, re.I)
        if m:
            errs.append(f"frase no permitida (promesa de salud o dato no verificado): {m.group(0)!r}")
    if p.get("fecha_programada"):
        try:
            parsear_fecha(p["fecha_programada"])
        except ErrorPieza as e:
            errs.append(str(e))
    if p.get("estado") == "aprobada":
        if p.get("aprobada_por") != "Nicole" or not p.get("aprobada_en"):
            errs.append("aprobada sin registro de aprobación de Nicole (aprobada_por y aprobada_en)")
        if not p.get("fecha_programada"):
            errs.append("aprobada sin fecha_programada")
        if p.get("aprobada_texto") and p["aprobada_texto"] != cap:
            errs.append("el texto cambió después de la aprobación; Nicole debe aprobar de nuevo")
    return errs


def cargar(ruta):
    ruta = Path(ruta)
    if not ruta.exists():
        return {"piezas": []}
    return json.loads(ruta.read_text(encoding="utf-8"))


def guardar(ruta, datos):
    Path(ruta).write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def aprobar(p, quien="Nicole"):
    """Sella la aprobación: guarda el texto exacto aprobado."""
    p["estado"] = "aprobada"
    p["aprobada_por"] = quien
    p["aprobada_en"] = ahora().strftime("%Y-%m-%d %H:%M")
    p["aprobada_texto"] = texto_final(p)


# ---------- Graph API ----------
def llamar(metodo, ruta, params, token):
    url = f"{BASE}/{VERSION_API}/{ruta}"
    datos = urllib.parse.urlencode({**params, "access_token": token}).encode()
    req = urllib.request.Request(url if metodo == "POST" else url + "?" + datos.decode(),
                                 data=datos if metodo == "POST" else None, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        cuerpo = e.read().decode("utf-8", "replace")
        raise RuntimeError(f"Meta respondió {e.code}: {cuerpo}") from None


def publicar_en_instagram(p, ig_id, token, llamar=llamar, espera=lambda s: time.sleep(s)):
    """Crea contenedor(es), espera a que estén listos y publica. Devuelve el id del medio."""
    caption = texto_final(p)
    if p.get("tipo", "IMAGEN") == "IMAGEN":
        cont = llamar("POST", f"{ig_id}/media",
                      {"image_url": p["imagenes"][0], "caption": caption}, token)["id"]
    else:
        hijos = [llamar("POST", f"{ig_id}/media",
                        {"image_url": u, "is_carousel_item": "true"}, token)["id"] for u in p["imagenes"]]
        cont = llamar("POST", f"{ig_id}/media",
                      {"media_type": "CAROUSEL", "children": ",".join(hijos), "caption": caption}, token)["id"]
    for _ in range(12):
        estado = llamar("GET", cont, {"fields": "status_code"}, token).get("status_code")
        if estado == "FINISHED":
            break
        if estado in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"el contenedor quedó en estado {estado}")
        espera(5)
    else:
        raise RuntimeError("el contenedor no terminó de procesarse a tiempo")
    return llamar("POST", f"{ig_id}/media_publish", {"creation_id": cont}, token)["id"]


CAMPOS_ESTADO = ("estado", "media_id", "publicada_en", "error")


def aplicar_estado(datos, ruta_estado):
    """Superpone el registro de publicadas (archivo aparte, en otra rama) sobre la cola."""
    reg = json.loads(Path(ruta_estado).read_text(encoding="utf-8")) if ruta_estado and Path(ruta_estado).exists() else {}
    for p in datos["piezas"]:
        p.update(reg.get(p["id"], {}))
    return reg


def ejecutar(ruta, publicar, llamar_api=llamar, ahora_fn=ahora, espera=lambda s: time.sleep(s), ruta_estado=None):
    datos = cargar(ruta)
    registro = aplicar_estado(datos, ruta_estado)

    def persistir(p):
        if ruta_estado:
            registro[p["id"]] = {k: p[k] for k in CAMPOS_ESTADO if k in p}
            Path(ruta_estado).write_text(json.dumps(registro, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        else:
            guardar(ruta, datos)
    token, ig_id = os.environ.get("IG_ACCESS_TOKEN"), os.environ.get("IG_USER_ID")
    if publicar and not (token and ig_id):
        raise SystemExit("Faltan las variables de entorno IG_ACCESS_TOKEN e IG_USER_ID.")
    # Margen contra el límite de la API (se consulta /content_publishing_limit antes de publicar).
    if publicar:
        lim = llamar_api("GET", f"{ig_id}/content_publishing_limit",
                         {"fields": "quota_usage,config"}, token)
        usados = (lim.get("data") or [{}])[0].get("quota_usage", 0)
        if usados >= 20:
            raise SystemExit(f"Se usaron {usados} publicaciones en 24 h; se detiene por prudencia.")
    hechas = 0
    for p in datos["piezas"]:
        if p["estado"] != "aprobada":
            continue
        problemas = validar_pieza(p)
        if problemas:
            print(f"[{p['id']}] NO se publica: " + "; ".join(problemas))
            continue
        if parsear_fecha(p["fecha_programada"]) > ahora_fn():
            continue
        if not publicar:
            print(f"[{p['id']}] ENSAYO: se publicaría ahora ({p['fecha_programada']}).")
            continue
        try:
            p["media_id"] = publicar_en_instagram(p, ig_id, token, llamar_api, espera)
            p["estado"], p["publicada_en"] = "publicada", ahora_fn().strftime("%Y-%m-%d %H:%M")
            print(f"[{p['id']}] publicada (media {p['media_id']}).")
            hechas += 1
        except Exception as e:  # no reintenta solo: evita duplicados
            p["estado"], p["error"] = "error", str(e)[:500]
            print(f"[{p['id']}] ERROR: {e}")
        persistir(p)
    return hechas


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("accion", choices=["validar", "estado", "ejecutar"])
    ap.add_argument("--cola", default=str(COLA_POR_DEFECTO))
    ap.add_argument("--estado", help="archivo JSON con el registro de publicadas (si se omite, se escribe en la cola)")
    ap.add_argument("--publicar", action="store_true", help="publica de verdad (sin esto es ensayo)")
    a = ap.parse_args(argv)
    if a.accion == "validar":
        malas = 0
        for p in cargar(a.cola)["piezas"]:
            for e in validar_pieza(p):
                print(f"[{p.get('id')}] {e}")
                malas += 1
        print("Sin problemas." if not malas else f"{malas} problema(s).")
        return 1 if malas else 0
    if a.accion == "estado":
        for p in cargar(a.cola)["piezas"]:
            print(f"{p['id']:<24} {p['estado']:<10} {p.get('fecha_programada', '-')}")
        return 0
    ejecutar(a.cola, a.publicar, ruta_estado=a.estado)
    return 0


if __name__ == "__main__":
    sys.exit(main())
