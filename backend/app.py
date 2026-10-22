import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from Model.db_connection import test_connection
from backend.api import api as api_blueprint, ctl

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public"


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config["JSON_SORT_KEYS"] = False
    app.register_blueprint(api_blueprint)

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        if os.getenv("VERCEL") == "1":
            response.headers.setdefault("Strict-Transport-Security", "max-age=63072000")
        return response

    @app.get("/")
    def index():
        return send_from_directory(PUBLIC_DIR, "index.html")

    @app.get("/static/<path:filename>")
    def static_file(filename: str):
        return send_from_directory(PUBLIC_DIR / "static", filename)

    @app.get("/favicon.ico")
    def favicon():
        return ("", 204)

    @app.get("/api")
    def api_info():
        ok, message = test_connection(ctl.db_data)
        if not ok:
            app.logger.warning("La comprobación de PostgreSQL falló: %s", message)
        return jsonify({
            "ok": ok,
            "app": "Pet Manager (web)",
            "database": ok,
            "database_message": "Conectada" if ok else "No disponible",
            "endpoints": [
                "GET    /api/health",
                "GET    /api/pets?type=Dog|Cat",
                "GET    /api/pets/search?type=Dog|Cat&code=001",
                "POST   /api/pets",
                "PUT    /api/pets",
                "DELETE /api/pets",
                "GET    /api/reports?kind=pets|dogs|cats",
                "GET    /api/export?kind=pets|dogs|cats",
            ],
        }), (200 if ok else 503)

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"ok": False, "error": "Recurso no encontrado (404)"}), 404

    @app.errorhandler(500)
    def server_error(_error):
        return jsonify({"ok": False, "error": "Error interno del servidor"}), 500

    return app
