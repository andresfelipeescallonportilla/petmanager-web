from contextlib import contextmanager

from psycopg2.extras import RealDictCursor

from Model.db_data import DbData


@contextmanager
def database_connection(db_data: DbData | None = None):
    """Abre una conexión por operación y garantiza su cierre."""
    connection = (db_data or DbData()).connect()
    try:
        yield connection
    finally:
        connection.close()


def test_connection(db_data: DbData | None = None) -> tuple[bool, str]:
    try:
        with database_connection(db_data) as connection:
            with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT version() AS version, current_database() AS db")
                result = cursor.fetchone()
        return True, f"Conexión correcta a '{result['db']}' — {result['version']}"
    except Exception as exc:
        return False, str(exc)
