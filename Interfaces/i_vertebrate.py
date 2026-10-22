from abc import ABC, abstractmethod


class IVertebrate(ABC):
    @abstractmethod
    def getNumberOfBones(self) -> int:
        raise NotImplementedError
