import os


class DbData:
    """Configuración de conexión PostgreSQL obtenida del entorno."""

    def __init__(self, url: str | None = None):
        self.url = (
            url
            or os.getenv("POSTGRES_URL")
            or os.getenv("DATABASE_URL")
            or os.getenv("SUPABASE_DB_URL")
        )
        if not self.url:
            raise RuntimeError(
                "Falta la variable de entorno con la URL de PostgreSQL "
                "(POSTGRES_URL / DATABASE_URL / SUPABASE_DB_URL)."
            )

    def connect(self):
        import psycopg2

        try:
            return psycopg2.connect(
                self.url,
                sslmode="require",
                connect_timeout=10,
            )
        except psycopg2.Error as exc:
            raise RuntimeError(f"No se pudo conectar a PostgreSQL: {exc}") from exc

    def getConnection(self):
        return self.connect()
