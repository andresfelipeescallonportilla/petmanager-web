from Classes.cls_pet import clsPet


class clsCat(clsPet):
    def __init__(self, catId=0, breed="", petId=0, code="", name="", born_year=0, color="", health_status=""):
        super().__init__(petId, code, name, born_year, color, health_status)
        self.catId = catId
        self.breed = breed

    @classmethod
    def fromIds(cls, petId: int, catId: int) -> "clsCat":
        return cls(catId=catId, petId=petId)

    def SelfCleaning(self) -> None:
        return None

    def getAnimalType(self) -> str:
        return "Cat"

    def getNumberOfBones(self) -> int:
        return 230
