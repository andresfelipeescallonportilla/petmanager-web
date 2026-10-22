from Classes.cls_cat import clsCat
from Model._pet_model import PetModel


class modelCat(PetModel):
    animal_type = "Cat"
    detail_table = "tb_cat"
    detail_key = "catId"

    def _object(self, row):
        return clsCat(
            catId=row["cat_id"],
            breed=row["breed"],
            petId=row["pet_id"],
            code=row["code"],
            name=row["name"],
            born_year=row["born_year"],
            color=row["color"],
            health_status=row["health_status"],
        )

    def ListCatByHealthStatus(self) -> list:
        return self._report("tb_cat")
