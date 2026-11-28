import json, sys, tempfile, unittest
from datetime import datetime
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import publicador as pb


def pieza(**kw):
    p = {"id": "t1", "estado": "borrador", "tipo": "IMAGEN", "gancho": "Gancho", "texto": "Cuerpo",
         "hashtags": ["Uno"], "imagenes": ["https://x.cl/a.jpg"], "imagen_real": True}
    p.update(kw)
    return p


class Validacion(unittest.TestCase):
    def test_valida(self):
        self.assertEqual(pb.validar_pieza(pieza()), [])

    def test_promesa_de_salud(self):
        self.assertTrue(any("frase" in e for e in pb.validar_pieza(pieza(texto="Este corsé cura la escoliosis"))))

    def test_aprobada_requiere_a_nicole(self):
        errs = pb.validar_pieza(pieza(estado="aprobada", fecha_programada="2026-12-01 10:00"))
        self.assertTrue(any("aprobación" in e for e in errs))

    def test_edicion_tras_aprobar(self):
        p = pieza(fecha_programada="2026-12-01 10:00")
        pb.aprobar(p)
        self.assertEqual(pb.validar_pieza(p), [])
        p["texto"] = "Otro texto"
        self.assertTrue(any("cambió" in e for e in pb.validar_pieza(p)))

    def test_solo_jpeg_y_https(self):
        self.assertTrue(pb.validar_pieza(pieza(imagenes=["https://x.cl/a.webp"])))
        self.assertTrue(pb.validar_pieza(pieza(imagenes=["http://x.cl/a.jpg"])))

    def test_ilustrativa_rotulada(self):
        self.assertTrue(pb.validar_pieza(pieza(imagen_real=False, imagen_ilustrativa=True)))
        self.assertEqual(pb.validar_pieza(pieza(imagen_real=False, imagen_ilustrativa=True,
                                                texto="Imagen ilustrativa. Cuerpo")), [])


class Flujo(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()
        self.ruta = Path(self.d) / "cola.json"

    def _cola(self, **kw):
        p = pieza(fecha_programada="2026-12-01 10:00", **kw)
        pb.aprobar(p)
        pb.guardar(self.ruta, {"piezas": [p]})

    def test_ensayo_no_llama_a_meta(self):
        self._cola()
        def no_llamar(*a, **k): raise AssertionError("no debe llamar")
        pb.ejecutar(self.ruta, False, no_llamar, lambda: datetime(2027, 1, 1, tzinfo=pb.TZ_CHILE))
        self.assertEqual(pb.cargar(self.ruta)["piezas"][0]["estado"], "aprobada")

    def test_publica_y_marca(self):
        self._cola()
        llamadas = []
        def falso(m, ruta, params, token):
            llamadas.append(ruta)
            if ruta.endswith("content_publishing_limit"): return {"data": [{"quota_usage": 0}]}
            if ruta.endswith("/media"): return {"id": "C1"}
            if ruta == "C1": return {"status_code": "FINISHED"}
            return {"id": "M1"}
        import os
        os.environ.update(IG_ACCESS_TOKEN="x", IG_USER_ID="1")
        n = pb.ejecutar(self.ruta, True, falso, lambda: datetime(2027, 1, 1, tzinfo=pb.TZ_CHILE), lambda s: None)
        self.assertEqual(n, 1)
        p = pb.cargar(self.ruta)["piezas"][0]
        self.assertEqual((p["estado"], p["media_id"]), ("publicada", "M1"))

    def test_no_publica_antes_de_la_hora(self):
        self._cola()
        import os
        os.environ.update(IG_ACCESS_TOKEN="x", IG_USER_ID="1")
        falso = lambda m, r, p, t: {"data": [{"quota_usage": 0}]}
        n = pb.ejecutar(self.ruta, True, falso, lambda: datetime(2026, 11, 30, tzinfo=pb.TZ_CHILE))
        self.assertEqual(n, 0)


if __name__ == "__main__":
    unittest.main()
