from .devices import router as devices_router
from .profiles import router as profiles_router
from .buttons import router as buttons_router
from .actions import router as actions_router
from .homeassistant import router as homeassistant_router
from .icons import router as icons_router
from .data import router as data_router
from .media import router as media_router
from .streaming import router as streaming_router

__all__ = [
    "devices_router",
    "profiles_router",
    "buttons_router",
    "actions_router",
    "homeassistant_router",
    "icons_router",
    "data_router",
    "media_router",
    "streaming_router",
]
