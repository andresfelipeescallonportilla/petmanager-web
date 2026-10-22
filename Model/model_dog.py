from Classes.cls_dog import clsDog
from Model._pet_model import PetModel


class modelDog(PetModel):
    animal_type = "Dog"
    detail_table = "tb_dog"
    detail_key = "dogId"

    def _object(self, row):
        return clsDog(
            dogId=row["dog_id"],
            breed=row["breed"],
            pedigree=row["pedigree"],
            petId=row["pet_id"],
            code=row["code"],
            name=row["name"],
            born_year=row["born_year"],
            color=row["color"],
            health_status=row["health_status"],
        )

    def ListDogByHealthStatus(self) -> list:
        return self._report("tb_dog")
