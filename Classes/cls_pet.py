from Interfaces.i_animal import IAnimal
from Interfaces.i_vertebrate import IVertebrate


class clsPet(IAnimal, IVertebrate):
    def __init__(self, petId=0, code="", name="", born_year=0, color="", health_status=""):
        self.petId = petId
        self.code = code
        self.name = name
        self.born_year = born_year
        self.color = color
        self.health_status = health_status
        self.veterinary = None

    def Eat(self) -> None:
        return None

    def Move(self) -> None:
        return None

    def Sound(self) -> str:
        return ""

    def getAnimalType(self) -> str:
        return "Pet"

    def getNumberOfBones(self) -> int:
        return 0
