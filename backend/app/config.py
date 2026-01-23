import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "Stream Deck Hub"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./streamdeck_hub.db"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Home Assistant
    homeassistant_url: Optional[str] = None
    homeassistant_token: Optional[str] = None

    # Assets paths
    assets_path: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Assets")

    @property
    def images_path(self) -> str:
        return os.path.join(self.assets_path, "images")

    @property
    def fonts_path(self) -> str:
        return os.path.join(self.assets_path, "fonts")

    class Config:
        env_file = ".env"


settings = Settings()
