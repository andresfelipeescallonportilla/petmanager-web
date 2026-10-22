from abc import ABC, abstractmethod


class abstHospital(ABC):
    def __init__(self, hospitalId=0, name="", phone="", address="", patien_type=None, doctorId=None):
        self.hospitalId = hospitalId
        self.name = name
        self.phone = phone
        self.address = address
        self.patien_type = patien_type
        self.doctorId = doctorId

    @abstractmethod
    def getHospitalType(self) -> str:
        raise NotImplementedError
