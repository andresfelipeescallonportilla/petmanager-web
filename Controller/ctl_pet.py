from Classes.cls_cat import clsCat
from Classes.cls_dog import clsDog
from Model.db_data import DbData
from Model.model_cat import modelCat
from Model.model_dog import modelDog


class ctlPet:
    def __init__(self, db_data=None):
        self.db_data = db_data or DbData()
        self.modelDog = modelDog(self.db_data)
        self.modelCat = modelCat(self.db_data)

    def _model(self, animal_type):
        normalized = str(animal_type).strip().capitalize()
        if normalized == "Dog":
            return self.modelDog
        if normalized == "Cat":
            return self.modelCat
        raise ValueError("El tipo debe ser 'Dog' o 'Cat'")

    def CreatePet(self, pet) -> bool:
        return self._model(pet.getAnimalType()).CreatePet(pet)

    def SearchPet(self, code: str, animal_type: str):
        return self._model(animal_type).SearchPet(code)

    def ListPet(self, animal_type: str) -> list:
        return self._model(animal_type).ListPet()

    def EditPet(self, pet) -> bool:
        return self._model(pet.getAnimalType()).EditPet(pet)

    def DeletePet(self, pet) -> bool:
        return self._model(pet.getAnimalType()).DeletePet(pet)

    def ListPetByHealthStatus(self) -> list:
        return self.modelDog.ListPetByHealthStatus()

    def ListDogByHealthStatus(self) -> list:
        return self.modelDog.ListDogByHealthStatus()

    def ListCatByHealthStatus(self) -> list:
        return self.modelCat.ListCatByHealthStatus()

    def getLastError(self, animal_type=None) -> str:
        try:
            return self._model(animal_type).getLastError() if animal_type else (
                self.modelDog.getLastError() or self.modelCat.getLastError()
            )
        except ValueError:
            return self.modelDog.getLastError() or self.modelCat.getLastError()
