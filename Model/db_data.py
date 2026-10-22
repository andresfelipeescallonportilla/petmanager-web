import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


class DbData:
    """Configuración de conexión PostgreSQL obtenida del entorno."""

    def __init__(self, url: str | None = None):
        self.url = (
            url
            or os.getenv("POSTGRES_URL")
            or os.getenv("DATABASE_URL")
            or os.getenv("SUPABASE_DB_URL")
        )
    def connect(self):
        import psycopg2

        if not self.url:
            raise RuntimeError(
                "Falta la variable de entorno con la URL de PostgreSQL "
                "(POSTGRES_URL / DATABASE_URL / SUPABASE_DB_URL)."
            )

        try:
            parsed = urlsplit(self.url)
            query = urlencode([
                (key, value)
                for key, value in parse_qsl(parsed.query, keep_blank_values=True)
                if key not in {"supa", "pgbouncer"}
            ])
            connection_url = urlunsplit(
                (parsed.scheme, parsed.netloc, parsed.path, query, parsed.fragment)
            )
            return psycopg2.connect(
                connection_url,
                sslmode="require",
                connect_timeout=10,
            )
        except psycopg2.Error as exc:
            raise RuntimeError(f"No se pudo conectar a PostgreSQL: {exc}") from exc

    def getConnection(self):
        return self.connect()
