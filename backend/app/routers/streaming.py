"""Streaming integrations API router for Discord and Twitch."""
from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

from ..services.discord import discord_service
from ..services.twitch import twitch_service
from ..services.hotkey import hotkey_service
from ..services.wakeonlan import wol_service

router = APIRouter(prefix="/api/streaming", tags=["streaming"])


# Schemas
class DiscordBotConfig(BaseModel):
    bot_token: str


class TwitchConfig(BaseModel):
    client_id: str
    client_secret: str


class TwitchAuthCode(BaseModel):
    code: str


class WolValidate(BaseModel):
    mac_address: str


# Discord endpoints
@router.get("/discord/status")
def discord_status():
    """Get Discord service status."""
    return discord_service.get_status()


@router.post("/discord/configure")
def discord_configure(config: DiscordBotConfig):
    """Configure Discord bot token."""
    discord_service.configure(config.bot_token)
    return {"success": True}


# Twitch endpoints
@router.get("/twitch/status")
def twitch_status():
    """Get Twitch service status."""
    return twitch_service.get_status()


@router.post("/twitch/configure")
def twitch_configure(config: TwitchConfig):
    """Configure Twitch API credentials."""
    result = twitch_service.configure(config.client_id, config.client_secret)
    return result


@router.get("/twitch/auth-url")
def twitch_auth_url():
    """Get Twitch authorization URL."""
    if not twitch_service.is_configured:
        raise HTTPException(status_code=400, detail="Twitch not configured")

    url = twitch_service.get_auth_url()
    if not url:
        raise HTTPException(status_code=500, detail="Failed to get auth URL")

    return {"auth_url": url}


@router.post("/twitch/authenticate")
async def twitch_authenticate(auth: TwitchAuthCode):
    """Authenticate with Twitch using authorization code."""
    if not twitch_service.is_configured:
        raise HTTPException(status_code=400, detail="Twitch not configured")

    result = await twitch_service.authenticate(auth.code)
    return result


@router.get("/twitch/stream-info")
async def twitch_stream_info():
    """Get current stream information."""
    if not twitch_service.is_authenticated:
        raise HTTPException(status_code=401, detail="Not authenticated with Twitch")

    return await twitch_service.get_stream_info()


@router.get("/twitch/search-game")
async def twitch_search_game(query: str):
    """Search for a game/category."""
    if not twitch_service.is_authenticated:
        raise HTTPException(status_code=401, detail="Not authenticated with Twitch")

    return await twitch_service.search_game(query)


# Hotkey endpoints
@router.get("/hotkey/status")
def hotkey_status():
    """Get hotkey service status."""
    return {
        "available": hotkey_service.is_available,
        "keys": hotkey_service.get_available_keys()
    }


# Wake-on-LAN endpoints
@router.post("/wol/validate")
def wol_validate(data: WolValidate):
    """Validate a MAC address."""
    return wol_service.validate_mac(data.mac_address)
