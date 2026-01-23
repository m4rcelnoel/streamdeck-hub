"""Wake-on-LAN service for waking up computers over the network."""
import socket
import struct
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class WakeOnLanService:
    """Service to send Wake-on-LAN magic packets."""

    def __init__(self):
        self._socket = None

    def _create_magic_packet(self, mac_address: str) -> bytes:
        """Create a Wake-on-LAN magic packet.

        The magic packet consists of:
        - 6 bytes of 0xFF
        - 16 repetitions of the target MAC address (6 bytes each)
        Total: 102 bytes
        """
        # Clean and validate MAC address
        mac = self._clean_mac(mac_address)
        if not mac:
            raise ValueError(f"Invalid MAC address: {mac_address}")

        # Convert MAC to bytes
        mac_bytes = bytes.fromhex(mac)

        # Create magic packet: 6 bytes of 0xFF + 16 repetitions of MAC
        magic_packet = b'\xff' * 6 + mac_bytes * 16

        return magic_packet

    def _clean_mac(self, mac_address: str) -> Optional[str]:
        """Clean and validate a MAC address.

        Accepts formats:
        - AA:BB:CC:DD:EE:FF
        - AA-BB-CC-DD-EE-FF
        - AABBCCDDEEFF
        """
        # Remove common separators and convert to uppercase
        mac = mac_address.replace(':', '').replace('-', '').replace('.', '').upper()

        # Validate: should be 12 hex characters
        if re.match(r'^[0-9A-F]{12}$', mac):
            return mac

        return None

    def _format_mac(self, mac_address: str) -> str:
        """Format MAC address for display (AA:BB:CC:DD:EE:FF)."""
        mac = self._clean_mac(mac_address)
        if mac:
            return ':'.join(mac[i:i+2] for i in range(0, 12, 2))
        return mac_address

    async def wake(
        self,
        mac_address: str,
        ip_address: Optional[str] = None,
        port: int = 9
    ) -> Dict[str, Any]:
        """Send a Wake-on-LAN magic packet.

        Args:
            mac_address: MAC address of the target machine
            ip_address: Optional IP for directed broadcast (default: broadcast)
            port: UDP port (usually 9 or 7)

        Returns:
            Result dict with success status
        """
        try:
            # Create the magic packet
            magic_packet = self._create_magic_packet(mac_address)

            # Create UDP socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

            # Determine broadcast address
            if ip_address:
                # Use specified IP (could be directed broadcast or specific IP)
                broadcast_addr = ip_address
            else:
                # Use general broadcast
                broadcast_addr = '255.255.255.255'

            # Send the magic packet
            sock.sendto(magic_packet, (broadcast_addr, port))
            sock.close()

            formatted_mac = self._format_mac(mac_address)
            logger.info(f"Sent WOL packet to {formatted_mac} via {broadcast_addr}:{port}")

            return {
                "success": True,
                "mac_address": formatted_mac,
                "broadcast_address": broadcast_addr,
                "port": port
            }

        except ValueError as e:
            logger.error(f"Invalid MAC address: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Error sending WOL packet: {e}")
            return {"success": False, "error": str(e)}

    def validate_mac(self, mac_address: str) -> Dict[str, Any]:
        """Validate a MAC address format.

        Returns:
            Dict with valid status and formatted MAC if valid
        """
        mac = self._clean_mac(mac_address)
        if mac:
            return {
                "valid": True,
                "formatted": self._format_mac(mac_address)
            }
        return {
            "valid": False,
            "error": "Invalid MAC address format"
        }


# Global instance
wol_service = WakeOnLanService()
