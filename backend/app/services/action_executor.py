import asyncio
import subprocess
import json
import aiohttp
from typing import Dict, Any
import logging

from ..models.action import Action, ActionType
from .homeassistant import homeassistant_service
from .sonos import sonos_service
from .spotify import spotify_service
from .data import data_service
from .hotkey import hotkey_service
from .wakeonlan import wol_service
from .discord import discord_service
from .twitch import twitch_service

logger = logging.getLogger(__name__)


class ActionExecutor:
    async def execute(self, action: Action) -> Dict[str, Any]:
        """Execute an action and return the result."""
        try:
            config = json.loads(action.config) if isinstance(action.config, str) else action.config
            action_type = action.action_type

            if action_type == ActionType.SCRIPT.value:
                return await self._execute_script(config)
            elif action_type == ActionType.HTTP.value:
                return await self._execute_http(config)
            elif action_type == ActionType.HOMEASSISTANT.value:
                return await self._execute_homeassistant(config)
            elif action_type == ActionType.MULTI.value:
                return await self._execute_multi(config)
            elif action_type == ActionType.TOGGLE.value:
                return await self._execute_toggle(config)
            elif action_type == "sonos":
                return await self._execute_sonos(config)
            elif action_type == "spotify":
                return await self._execute_spotify(config)
            elif action_type == ActionType.COUNTER.value:
                return await self._execute_counter(config, action.id)
            elif action_type == ActionType.TIMER.value:
                return await self._execute_timer(config, action.id)
            elif action_type == ActionType.HOTKEY.value:
                return await self._execute_hotkey(config)
            elif action_type == ActionType.WAKE_ON_LAN.value:
                return await self._execute_wol(config)
            elif action_type == ActionType.DISCORD.value:
                return await self._execute_discord(config)
            elif action_type == ActionType.TWITCH.value:
                return await self._execute_twitch(config)
            else:
                return {"success": False, "error": f"Unknown action type: {action_type}"}

        except Exception as e:
            logger.error(f"Error executing action {action.id}: {e}")
            return {"success": False, "error": str(e)}

    async def _execute_script(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a shell script/command."""
        command = config.get("command")
        working_dir = config.get("working_dir")
        timeout = config.get("timeout", 30)

        if not command:
            return {"success": False, "error": "No command specified"}

        try:
            process = await asyncio.create_subprocess_shell(
                command,
                cwd=working_dir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout
            )

            return {
                "success": process.returncode == 0,
                "returncode": process.returncode,
                "stdout": stdout.decode() if stdout else "",
                "stderr": stderr.decode() if stderr else ""
            }

        except asyncio.TimeoutError:
            process.kill()
            return {"success": False, "error": "Command timed out"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _execute_http(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an HTTP request."""
        method = config.get("method", "POST")
        url = config.get("url")
        headers = config.get("headers", {})
        body = config.get("body")

        if not url:
            return {"success": False, "error": "No URL specified"}

        try:
            async with aiohttp.ClientSession() as session:
                kwargs = {"headers": headers}
                if body:
                    kwargs["json"] = body

                async with session.request(method, url, **kwargs) as response:
                    response_text = await response.text()
                    return {
                        "success": 200 <= response.status < 300,
                        "status_code": response.status,
                        "response": response_text
                    }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _execute_homeassistant(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a Home Assistant service call."""
        domain = config.get("domain")
        service = config.get("service")
        entity_id = config.get("entity_id")
        service_data = config.get("service_data", {})

        if not all([domain, service, entity_id]):
            return {"success": False, "error": "Missing required Home Assistant config"}

        return await homeassistant_service.call_service(
            domain, service, entity_id, service_data
        )

    async def _execute_multi(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute multiple actions in sequence."""
        action_ids = config.get("action_ids", [])
        delay_ms = config.get("delay_ms", 100)

        results = []
        for action_id in action_ids:
            # This would need database access to look up actions
            # For now, return placeholder
            results.append({"action_id": action_id, "status": "pending"})
            await asyncio.sleep(delay_ms / 1000)

        return {"success": True, "results": results}

    async def _execute_toggle(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a toggle action (alternates between two actions)."""
        # Toggle state would need to be stored somewhere
        # For now, just return success
        return {"success": True, "state": "toggled"}

    async def _execute_sonos(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a Sonos command."""
        command = config.get("command")
        speaker_uid = config.get("speaker_uid")
        volume_step = config.get("volume_step", 5)

        if not command:
            return {"success": False, "error": "No command specified"}

        try:
            result = False

            if command == "play":
                result = sonos_service.play(speaker_uid)
            elif command == "pause":
                result = sonos_service.pause(speaker_uid)
            elif command == "play_pause":
                result = sonos_service.play_pause(speaker_uid)
            elif command == "stop":
                result = sonos_service.stop(speaker_uid)
            elif command == "next":
                result = sonos_service.next_track(speaker_uid)
            elif command == "previous":
                result = sonos_service.previous_track(speaker_uid)
            elif command == "volume_up":
                result = sonos_service.volume_up(volume_step, speaker_uid)
            elif command == "volume_down":
                result = sonos_service.volume_down(volume_step, speaker_uid)
            elif command == "mute":
                result = sonos_service.mute(speaker_uid)
            elif command == "unmute":
                result = sonos_service.unmute(speaker_uid)
            elif command == "toggle_mute":
                result = sonos_service.toggle_mute(speaker_uid)
            elif command == "set_volume":
                volume = config.get("volume", 50)
                result = sonos_service.set_volume(volume, speaker_uid)
            else:
                return {"success": False, "error": f"Unknown Sonos command: {command}"}

            return {"success": result}

        except Exception as e:
            logger.error(f"Error executing Sonos command: {e}")
            return {"success": False, "error": str(e)}

    async def _execute_spotify(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a Spotify command."""
        command = config.get("command")
        device_id = config.get("device_id")
        volume_step = config.get("volume_step", 10)

        if not command:
            return {"success": False, "error": "No command specified"}

        if not spotify_service.is_authenticated:
            return {"success": False, "error": "Spotify not authenticated"}

        try:
            result = False

            if command == "play":
                result = spotify_service.play(device_id)
            elif command == "pause":
                result = spotify_service.pause(device_id)
            elif command == "play_pause":
                result = spotify_service.play_pause(device_id)
            elif command == "next":
                result = spotify_service.next_track(device_id)
            elif command == "previous":
                result = spotify_service.previous_track(device_id)
            elif command == "volume_up":
                result = spotify_service.volume_up(volume_step, device_id)
            elif command == "volume_down":
                result = spotify_service.volume_down(volume_step, device_id)
            elif command == "set_volume":
                volume = config.get("volume", 50)
                result = spotify_service.set_volume(volume, device_id)
            elif command == "shuffle_on":
                result = spotify_service.shuffle(True, device_id)
            elif command == "shuffle_off":
                result = spotify_service.shuffle(False, device_id)
            elif command == "repeat_off":
                result = spotify_service.repeat("off", device_id)
            elif command == "repeat_track":
                result = spotify_service.repeat("track", device_id)
            elif command == "repeat_context":
                result = spotify_service.repeat("context", device_id)
            else:
                return {"success": False, "error": f"Unknown Spotify command: {command}"}

            return {"success": result}

        except Exception as e:
            logger.error(f"Error executing Spotify command: {e}")
            return {"success": False, "error": str(e)}

    async def _execute_counter(self, config: Dict[str, Any], action_id: str) -> Dict[str, Any]:
        """Execute a counter action."""
        action = config.get("action", "increment")
        step = config.get("step", 1)
        min_value = config.get("min_value")
        max_value = config.get("max_value")
        set_value = config.get("set_value", 0)
        wrap = config.get("wrap", False)

        # Use action_id as the counter key
        key = f"counter_{action_id}"

        try:
            if action == "increment":
                value = data_service.increment_counter(key, step, min_value, max_value, wrap)
            elif action == "decrement":
                value = data_service.decrement_counter(key, step, min_value, max_value, wrap)
            elif action == "reset":
                value = data_service.reset_counter(key)
            elif action == "set":
                value = data_service.set_counter(key, set_value)
            else:
                return {"success": False, "error": f"Unknown counter action: {action}"}

            return {"success": True, "value": value}

        except Exception as e:
            logger.error(f"Error executing counter action: {e}")
            return {"success": False, "error": str(e)}

    async def _execute_timer(self, config: Dict[str, Any], action_id: str) -> Dict[str, Any]:
        """Execute a timer action."""
        action = config.get("action", "toggle")
        mode = config.get("mode", "stopwatch")
        duration = config.get("duration", 0)

        # Use action_id as the timer key
        key = f"timer_{action_id}"

        try:
            if action == "start":
                state = data_service.start_timer(key, mode, duration)
            elif action == "pause":
                state = data_service.pause_timer(key)
            elif action == "resume":
                state = data_service.resume_timer(key)
            elif action == "reset":
                state = data_service.reset_timer(key)
            elif action == "toggle":
                state = data_service.toggle_timer(key, mode, duration)
            else:
                return {"success": False, "error": f"Unknown timer action: {action}"}

            return {"success": True, "state": state}

        except Exception as e:
            logger.error(f"Error executing timer action: {e}")
            return {"success": False, "error": str(e)}

    async def _execute_hotkey(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a hotkey action."""
        keys = config.get("keys", [])
        hold_time = config.get("hold_time", 0)

        if not keys:
            return {"success": False, "error": "No keys specified"}

        return await hotkey_service.send_hotkey(keys, hold_time)

    async def _execute_wol(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a Wake-on-LAN action."""
        mac_address = config.get("mac_address")
        ip_address = config.get("ip_address")
        port = config.get("port", 9)

        if not mac_address:
            return {"success": False, "error": "No MAC address specified"}

        return await wol_service.wake(mac_address, ip_address, port)

    async def _execute_discord(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a Discord action."""
        action = config.get("action")

        if action == "webhook":
            return await discord_service.send_webhook(
                webhook_url=config.get("webhook_url"),
                message=config.get("message"),
            )
        elif action == "bot_message":
            return await discord_service.send_bot_message(
                channel_id=config.get("channel_id"),
                message=config.get("message"),
            )
        else:
            return {"success": False, "error": f"Unknown Discord action: {action}"}

    async def _execute_twitch(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a Twitch action."""
        action = config.get("action")

        if action == "create_clip":
            return await twitch_service.create_clip()
        elif action == "create_marker":
            return await twitch_service.create_stream_marker(
                description=config.get("message", "")
            )
        elif action == "send_chat":
            return await twitch_service.send_chat_message(
                message=config.get("message", "")
            )
        elif action == "announcement":
            return await twitch_service.send_announcement(
                message=config.get("message", ""),
                color=config.get("color", "primary")
            )
        elif action == "update_title":
            return await twitch_service.update_channel(
                title=config.get("title")
            )
        elif action == "run_ad":
            return await twitch_service.start_commercial(
                length=config.get("ad_length", 30)
            )
        else:
            return {"success": False, "error": f"Unknown Twitch action: {action}"}

    async def test_action(self, action: Action) -> Dict[str, Any]:
        """Test execute an action and return detailed results."""
        return await self.execute(action)


action_executor = ActionExecutor()
