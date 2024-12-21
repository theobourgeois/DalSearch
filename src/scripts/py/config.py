import json

class Config:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(Config, cls).__new__(cls)
        return cls._instance

    def __init__(self, config_file="config.json"):
        if not hasattr(self, "config"):
            with open(config_file, "r") as f:
                self.config = json.loads(f.read())

    def get_property(self, property_value, default=None):
        return self.config.get(property_value, default)