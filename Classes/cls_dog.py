from Classes.cls_pet import clsPet


class clsDog(clsPet):
    def __init__(self, dogId=0, breed="", pedigree=False, petId=0, code="", name="", born_year=0, color="", health_status=""):
        super().__init__(petId, code, name, born_year, color, health_status)
        self.dogId = dogId
        self.breed = breed
        self.pedigree = pedigree

    @classmethod
    def fromIds(cls, petId: int, dogId: int) -> "clsDog":
        return cls(dogId=dogId, petId=petId)

    def WalkAround(self, km=None, dogLeash=None) -> None:
        return None

    def getAnimalType(self) -> str:
        return "Dog"

    def getNumberOfBones(self) -> int:
        return 320
