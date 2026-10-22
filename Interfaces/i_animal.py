from abc import ABC, abstractmethod


class IAnimal(ABC):
    @abstractmethod
    def Eat(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def Sound(self) -> str:
        raise NotImplementedError
