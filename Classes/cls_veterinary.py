from Classes.abst_hospital import abstHospital


class clsVeterinary(abstHospital):
    def getHospitalType(self) -> str:
        return "Veterinary"
