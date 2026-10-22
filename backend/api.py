import logging

from flask import Blueprint, jsonify, request, send_file

from Classes.cls_cat import clsCat
from Classes.cls_dog import clsDog
from Controller.ctl_pet import ctlPet
from Model.db_connection import test_connection
from View.excel_export import export_cat_list, export_dog_list, export_pet_list

logger = logging.getLogger(__name__)
api = Blueprint("api", __name__, url_prefix="/api")
ctl = ctlPet()
DOG = "Dog"
CAT = "Cat"
VALID_TYPES = (DOG, CAT)


def _body() -> dict:
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def _database_error(context: str, detail: str):
    logger.error("%s: %s", context, detail)
    return jsonify({"ok": False, "error": "No se pudo completar la operación. Inténtalo de nuevo."}), 500


def _animal_type() -> str:
    data = _body()
    value = (
        request.args.get("type")
        or data.get("type")
        or data.get("animalType")
        or request.form.get("type")
        or request.form.get("animalType")
        or ""
    )
    value = str(value).strip().capitalize()
    if value not in VALID_TYPES:
        raise ValueError("El tipo debe ser 'Dog' o 'Cat'")
    return value


def _serialize(pet) -> dict:
    data = {
        "petId": pet.petId,
        "code": pet.code,
        "name": pet.name,
        "born_year": pet.born_year,
        "color": pet.color,
        "health_status": pet.health_status,
        "animalType": pet.getAnimalType(),
    }
    if isinstance(pet, clsDog):
        data.update({"dogId": pet.dogId, "breed": pet.breed, "pedigree": bool(pet.pedigree)})
    elif isinstance(pet, clsCat):
        data.update({"catId": pet.catId, "breed": pet.breed})
    return data


def _boolean(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "on", "si", "sí"}:
        return True
    if normalized in {"0", "false", "no", "off", ""}:
        return False
    raise ValueError("'pedigree' debe ser verdadero o falso")


def _integer(value, field: str, default: int = 0) -> int:
    if value in (None, ""):
        return default
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"'{field}' debe ser un número entero") from exc


def _build_pet(data: dict):
    animal_type = str(data.get("animalType") or data.get("type") or "").strip().capitalize()
    if animal_type not in VALID_TYPES:
        raise ValueError("El campo 'animalType' debe ser 'Dog' o 'Cat'")
    born_year = _integer(data.get("born_year"), "born_year")
    pet_id = _integer(data.get("petId"), "petId")
    code = str(data.get("code") or "").strip()
    name = str(data.get("name") or "").strip()
    color = str(data.get("color") or "").strip()
    health_status = str(data.get("health_status") or "Healthy").strip()
    breed = str(data.get("breed") or "").strip()
    if animal_type == DOG:
        return clsDog(
            dogId=_integer(data.get("dogId"), "dogId"),
            breed=breed,
            pedigree=_boolean(data.get("pedigree")),
            petId=pet_id,
            code=code,
            name=name,
            born_year=born_year,
            color=color,
            health_status=health_status,
        )
    return clsCat(
        catId=_integer(data.get("catId"), "catId"),
        breed=breed,
        petId=pet_id,
        code=code,
        name=name,
        born_year=born_year,
        color=color,
        health_status=health_status,
    )


@api.get("/health")
def health():
    ok, message = test_connection(ctl.db_data)
    if not ok:
        logger.warning("La comprobación de PostgreSQL falló: %s", message)
    return jsonify({
        "ok": ok,
        "message": "Conexión a PostgreSQL correcta" if ok else "No se pudo conectar a PostgreSQL",
    }), (200 if ok else 503)


@api.get("/pets")
def list_pets():
    try:
        animal_type = _animal_type()
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    pets = ctl.ListPet(animal_type)
    error = ctl.getLastError(animal_type)
    if error:
        return _database_error("Error en una operación de mascotas", error)
    return jsonify({"ok": True, "data": [_serialize(pet) for pet in pets]})


@api.get("/pets/search")
def search_pet():
    try:
        animal_type = _animal_type()
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    code = (request.args.get("code") or "").strip()
    pet = ctl.SearchPet(code, animal_type)
    error = ctl.getLastError(animal_type)
    if error:
        return _database_error("Error en una operación de mascotas", error)
    return jsonify({"ok": True, "data": _serialize(pet) if pet else None})


@api.post("/pets")
def create_pet():
    try:
        pet = _build_pet(_body())
    except (ValueError, TypeError) as exc:
        return jsonify({"ok": False, "error": f"Datos no válidos: {exc}"}), 400
    if not pet.code or not pet.name or not pet.color:
        return jsonify({"ok": False, "error": "Fill all fields (Code, Name y Color)"}), 400
    if ctl.CreatePet(pet):
        return jsonify({"ok": True, "message": "The record has been saved"}), 201
    return _database_error("No se pudo crear la mascota", ctl.getLastError(pet.getAnimalType()))


@api.put("/pets")
def update_pet():
    try:
        pet = _build_pet(_body())
    except (ValueError, TypeError) as exc:
        return jsonify({"ok": False, "error": f"Datos no válidos: {exc}"}), 400
    if not pet.petId:
        return jsonify({"ok": False, "error": "You have to search the record to update"}), 400
    if ctl.EditPet(pet):
        return jsonify({"ok": True, "message": "Record updated"})
    return _database_error("No se pudo actualizar la mascota", ctl.getLastError(pet.getAnimalType()))


@api.delete("/pets")
def delete_pet():
    data = _body()
    try:
        animal_type = _animal_type()
        pet_id = _integer(data.get("petId"), "petId")
        detail_id = _integer(data.get("dogId" if animal_type == DOG else "catId"), "detailId")
    except (ValueError, TypeError) as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    if not pet_id:
        return jsonify({"ok": False, "error": "You have not searched the record yet"}), 400
    pet = clsDog.fromIds(pet_id, detail_id) if animal_type == DOG else clsCat.fromIds(pet_id, detail_id)
    if ctl.DeletePet(pet):
        return jsonify({"ok": True, "message": "The pet has been deleted (removed) successfuly!"})
    return _database_error("No se pudo eliminar la mascota", ctl.getLastError(animal_type))


@api.get("/reports")
def reports():
    kind = (request.args.get("kind") or "pets").strip().lower()
    if kind == "dogs":
        records = ctl.ListDogByHealthStatus()
    elif kind == "cats":
        records = ctl.ListCatByHealthStatus()
    elif kind == "pets":
        records = ctl.ListPetByHealthStatus()
    else:
        return jsonify({"ok": False, "error": "El tipo de reporte debe ser pets, dogs o cats"}), 400
    error = ctl.getLastError(DOG if kind in {"pets", "dogs"} else CAT)
    if error:
        return _database_error("Error en una operación de mascotas", error)
    return jsonify({"ok": True, "data": [
        {"health_status": row.health_status, "amount": row.amount_of_pets_by_health_status}
        for row in records
    ]})


@api.get("/export")
def export():
    kind = (request.args.get("kind") or "pets").strip().lower()
    try:
        if kind == "dogs":
            dogs = ctl.ListPet(DOG)
            error = ctl.getLastError(DOG)
            if error:
                return _database_error("Error en una operación de mascotas", error)
            output = export_dog_list(dogs)
            filename = "dog_list.xlsx"
        elif kind == "cats":
            cats = ctl.ListPet(CAT)
            error = ctl.getLastError(CAT)
            if error:
                return _database_error("Error en una operación de mascotas", error)
            output = export_cat_list(cats)
            filename = "cat_list.xlsx"
        elif kind == "pets":
            dogs = ctl.ListPet(DOG)
            error = ctl.getLastError(DOG)
            if error:
                return _database_error("Error en una operación de mascotas", error)
            cats = ctl.ListPet(CAT)
            error = ctl.getLastError(CAT)
            if error:
                return _database_error("Error en una operación de mascotas", error)
            output = export_pet_list(dogs, cats)
            filename = "pet_list.xlsx"
        else:
            return jsonify({"ok": False, "error": "El tipo de export debe ser pets, dogs o cats"}), 400
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    except Exception as exc:
        logger.exception("Error al exportar el reporte")
        return jsonify({"ok": False, "error": "No se pudo generar el archivo Excel."}), 500
