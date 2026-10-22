from __future__ import annotations

from abc import ABC
from typing import Any

from psycopg2.extras import RealDictCursor

from Model.db_connection import database_connection

PRIMARY_KEYS: dict[str, str] = {}
ALLOWED_TABLES = {"tb_pet", "tb_dog", "tb_cat"}


class PetModel(ABC):
    animal_type = ""
    detail_table = ""
    detail_key = ""

    def __init__(self, db_data):
        self.db_data = db_data
        self.last_error = ""

    def _primary_key(self, table: str) -> str:
        if table not in ALLOWED_TABLES:
            raise ValueError("Tabla no permitida")
        if table not in PRIMARY_KEYS:
            with database_connection(self.db_data) as connection:
                with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(
                        """
                        SELECT kcu.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                          ON tc.constraint_name = kcu.constraint_name
                         AND tc.table_schema = kcu.table_schema
                        WHERE tc.table_schema = 'public'
                          AND tc.table_name = %s
                          AND tc.constraint_type = 'PRIMARY KEY'
                        ORDER BY kcu.ordinal_position
                        LIMIT 1
                        """,
                        (table,),
                    )
                    row = cursor.fetchone()
            if not row:
                raise RuntimeError(f"No se encontró la clave primaria de {table}")
            PRIMARY_KEYS[table] = row["column_name"]
        return PRIMARY_KEYS[table]

    def _object(self, row: dict[str, Any]):
        raise NotImplementedError

    def _select_sql(self, where: str = "") -> str:
        detail = "d" if self.animal_type == "Dog" else "c"
        extra = ", d.id AS dog_id, d.breed, d.pedigree" if self.animal_type == "Dog" else ", c.id AS cat_id, c.breed"
        table = "tb_dog" if self.animal_type == "Dog" else "tb_cat"
        return f"""
            SELECT p.id AS pet_id, p.code, p.name, p.born_year, p.color,
                   p.health_status{extra}
            FROM public.tb_pet AS p
            INNER JOIN public.{table} AS {detail} ON p.id = {detail}.id_pet
            {where}
        """

    def SearchPet(self, code: str):
        try:
            with database_connection(self.db_data) as connection:
                with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(self._select_sql("WHERE p.code = %s ORDER BY p.id LIMIT 1"), (code,))
                    row = cursor.fetchone()
            self.last_error = ""
            return self._object(row) if row else None
        except Exception as exc:
            self.last_error = str(exc)
            return None

    def ListPet(self) -> list:
        try:
            with database_connection(self.db_data) as connection:
                with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(self._select_sql("ORDER BY p.id"))
                    rows = cursor.fetchall()
            self.last_error = ""
            return [self._object(row) for row in rows]
        except Exception as exc:
            self.last_error = str(exc)
            return []

    def CreatePet(self, pet) -> bool:
        try:
            with database_connection(self.db_data) as connection:
                with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(
                        """INSERT INTO public.tb_pet
                           (code, name, born_year, color, health_status)
                           VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                        (pet.code, pet.name, pet.born_year, pet.color, pet.health_status),
                    )
                    pet.petId = cursor.fetchone()["id"]
                    if self.animal_type == "Dog":
                        cursor.execute(
                            "INSERT INTO public.tb_dog (breed, pedigree, id_pet) VALUES (%s, %s, %s) RETURNING id",
                            (pet.breed, bool(pet.pedigree), pet.petId),
                        )
                        pet.dogId = cursor.fetchone()["id"]
                    else:
                        cursor.execute(
                            "INSERT INTO public.tb_cat (breed, id_pet) VALUES (%s, %s) RETURNING id",
                            (pet.breed, pet.petId),
                        )
                        pet.catId = cursor.fetchone()["id"]
                connection.commit()
            self.last_error = ""
            return True
        except Exception as exc:
            self.last_error = str(exc)
            return False

    def EditPet(self, pet) -> bool:
        try:
            detail_id = getattr(pet, self.detail_key, 0)
            pet_key = self._primary_key("tb_pet")
            detail_key = self._primary_key(self.detail_table)
            with database_connection(self.db_data) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        f"""UPDATE public.tb_pet
                            SET code = %s, name = %s, born_year = %s, color = %s,
                                health_status = %s
                            WHERE {pet_key} = %s""",
                        (pet.code, pet.name, pet.born_year, pet.color, pet.health_status, pet.petId),
                    )
                    if cursor.rowcount == 0:
                        raise LookupError("No se encontró el registro de mascota")
                    if self.animal_type == "Dog":
                        cursor.execute(
                            f"UPDATE public.tb_dog SET breed = %s, pedigree = %s WHERE {detail_key} = %s",
                            (pet.breed, bool(pet.pedigree), detail_id),
                        )
                    else:
                        cursor.execute(
                            f"UPDATE public.tb_cat SET breed = %s WHERE {detail_key} = %s",
                            (pet.breed, detail_id),
                        )
                    if cursor.rowcount == 0:
                        raise LookupError(f"No se encontró el registro de {self.animal_type.lower()}")
                connection.commit()
            self.last_error = ""
            return True
        except Exception as exc:
            self.last_error = str(exc)
            return False

    def DeletePet(self, pet) -> bool:
        try:
            detail_id = getattr(pet, self.detail_key, 0)
            pet_key = self._primary_key("tb_pet")
            detail_key = self._primary_key(self.detail_table)
            with database_connection(self.db_data) as connection:
                with connection.cursor() as cursor:
                    cursor.execute("SAVEPOINT deletePoint")
                    try:
                        if detail_id:
                            cursor.execute(
                                f"DELETE FROM public.{self.detail_table} WHERE {detail_key} = %s",
                                (detail_id,),
                            )
                        else:
                            cursor.execute(
                                f"DELETE FROM public.{self.detail_table} WHERE id_pet = %s",
                                (pet.petId,),
                            )
                        cursor.execute(f"DELETE FROM public.tb_pet WHERE {pet_key} = %s", (pet.petId,))
                        if cursor.rowcount == 0:
                            raise LookupError("No se encontró el registro de mascota")
                        cursor.execute("RELEASE SAVEPOINT deletePoint")
                    except Exception:
                        cursor.execute("ROLLBACK TO SAVEPOINT deletePoint")
                        connection.rollback()
                        raise
                connection.commit()
            self.last_error = ""
            return True
        except Exception as exc:
            self.last_error = str(exc)
            return False

    def _report(self, table: str | None = None) -> list:
        if table:
            query = f"""
                SELECT p.health_status, COUNT(p.health_status) AS amount
                FROM public.tb_pet p
                INNER JOIN public.{table} a ON a.id_pet = p.id
                GROUP BY p.health_status
                ORDER BY p.health_status
            """
        else:
            query = """SELECT health_status, COUNT(health_status) AS amount
                         FROM public.tb_pet GROUP BY health_status ORDER BY health_status"""
        try:
            with database_connection(self.db_data) as connection:
                with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query)
                    rows = cursor.fetchall()
            self.last_error = ""
            from Classes.cls_report_by_health_status import clsReportByHealthStatus

            return [clsReportByHealthStatus(row["health_status"], row["amount"]) for row in rows]
        except Exception as exc:
            self.last_error = str(exc)
            return []

    def ListPetByHealthStatus(self) -> list:
        return self._report()

    def getLastError(self) -> str:
        return self.last_error
