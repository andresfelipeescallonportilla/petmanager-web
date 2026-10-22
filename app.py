import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent
if not os.getenv("VERCEL"):
    for env_file in (".env.development.local", ".env.local", ".env"):
        load_dotenv(PROJECT_ROOT / env_file, override=False)

from backend.app import create_app

app = create_app()


if __name__ == "__main__":
    import os

    app.run(
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
        use_reloader=False,
    )
