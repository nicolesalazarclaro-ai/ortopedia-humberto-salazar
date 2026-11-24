"""Genera sitio/index.html a partir del HTML editable aprobado (fuente/).

Qué hace (sin cambiar textos ni diseño):
1. Extrae las 13 imágenes incrustadas en base64 a sitio/img/*.webp.
2. Agrega width/height y loading="lazy" (excepto logo y portada).
3. Quita el editor local ("Editar página"), que no debe publicarse.

Uso: python3 -I scripts/preparar_sitio.py fuente/Ortopedia_Salazar_V5_1_Editable.html sitio
"""
import base64, re, struct, sys
from pathlib import Path

NOMBRES = ["logo", "portada", "corse", "plantillas", "ferula", "calzado", "otros",
           "taller-1", "taller-2", "taller-3", "taller-4", "taller-5", "fundador"]

def medidas(b):
    t = b[12:16]
    if t == b"VP8X":
        return 1 + int.from_bytes(b[24:27], "little"), 1 + int.from_bytes(b[27:30], "little")
    if t == b"VP8 ":
        w, h = struct.unpack("<HH", b[26:30]); return w & 0x3FFF, h & 0x3FFF
    if t == b"VP8L":
        v = int.from_bytes(b[21:25], "little"); return (v & 0x3FFF) + 1, ((v >> 14) & 0x3FFF) + 1
    return None, None

def main(fuente, salida):
    html = Path(fuente).read_text(encoding="utf-8")
    out = Path(salida); (out / "img").mkdir(parents=True, exist_ok=True)

    def reemplazar(m):
        tag = m.group(0)
        idx = int(re.search(r'data-image="(\d+)"', tag).group(1))
        datos = base64.b64decode(re.search(r'base64,([A-Za-z0-9+/=]+)', tag).group(1))
        nombre = f"{NOMBRES[idx] if idx < len(NOMBRES) else 'imagen-' + str(idx)}.webp"
        (out / "img" / nombre).write_bytes(datos)
        w, h = medidas(datos)
        tag = re.sub(r'src="data:image/webp;base64,[^"]+"', f'src="img/{nombre}"', tag)
        extra = f' width="{w}" height="{h}"' if w else ""
        extra += ' fetchpriority="high"' if idx in (0, 1) else ' loading="lazy"'
        return tag[:-2] + extra + "/>" if tag.endswith("/>") else tag[:-1] + extra + ">"

    html, n = re.subn(r'<img\b[^>]*data-image="\d+"[^>]*>', reemplazar, html)
    html, e = re.subn(r'<div id="local-editor">.*?</script>', "", html, flags=re.S)
    assert "base64," not in html, "quedaron imágenes incrustadas"
    (out / "index.html").write_text(html, encoding="utf-8")
    print(f"{n} imágenes extraídas; editor eliminado: {bool(e)}; {len(html)//1024} KB")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
