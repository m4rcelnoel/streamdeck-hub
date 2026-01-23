import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging

from .config import settings
from .database import init_db, SessionLocal
from .routers import (
    devices_router,
    profiles_router,
    buttons_router,
    actions_router,
    homeassistant_router,
    icons_router,
    data_router,
    media_router,
    streaming_router,
)
from .services.streamdeck import streamdeck_service
from .services.websocket import websocket_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Stream Deck Hub...")
    init_db()

    # Set up Stream Deck service
    streamdeck_service.set_db_session_factory(SessionLocal)
    streamdeck_service.set_event_loop(asyncio.get_event_loop())
    streamdeck_service.start()

    logger.info("Stream Deck Hub started successfully")

    yield

    # Shutdown
    logger.info("Shutting down Stream Deck Hub...")
    streamdeck_service.stop()
    logger.info("Stream Deck Hub shut down")


app = FastAPI(
    title=settings.app_name,
    description="A modern control hub for Elgato Stream Deck devices",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(devices_router)
app.include_router(profiles_router)
app.include_router(buttons_router)
app.include_router(actions_router)
app.include_router(homeassistant_router)
app.include_router(icons_router)
app.include_router(data_router)
app.include_router(media_router)
app.include_router(streaming_router)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Echo back for ping/pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket_manager.disconnect(websocket)
