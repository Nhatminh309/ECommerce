class ResourceNotFoundException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class InsufficientStockException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class InvalidRequestException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class DuplicateResourceException(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)
