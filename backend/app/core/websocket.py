import json
from typing import Dict, Set, Any
from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections grouped by channel / room"""

    def __init__(self):
        # channel_name -> Set[WebSocket]
        self.active_channels: Dict[str, Set[WebSocket]] = {}
        # individual connections
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, channel: str = "global"):
        await websocket.accept()
        self.all_connections.add(websocket)
        if channel not in self.active_channels:
            self.active_channels[channel] = set()
        self.active_channels[channel].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str = "global"):
        self.all_connections.discard(websocket)
        if channel in self.active_channels:
            self.active_channels[channel].discard(websocket)
            if not self.active_channels[channel]:
                del self.active_channels[channel]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            self.all_connections.discard(websocket)

    async def broadcast_to_channel(self, channel: str, message: dict):
        if channel in self.active_channels:
            dead_sockets = set()
            for connection in list(self.active_channels[channel]):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    dead_sockets.add(connection)
            for dead_socket in dead_sockets:
                self.disconnect(dead_socket, channel)

    async def broadcast_all(self, message: dict):
        dead_sockets = set()
        for connection in list(self.all_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_sockets.add(connection)
        for dead_socket in dead_sockets:
            self.all_connections.discard(dead_socket)

    async def dispatch_queue_event(
        self,
        event_type: str,
        session_id: Any,
        hospital_id: Any,
        data: dict,
        ticket_id: Any = None,
    ):
        """Dispatch real-time update to department, hospital, and personal ticket channels"""
        payload = {
            "type": event_type,
            "session_id": str(session_id),
            "hospital_id": str(hospital_id),
            "data": data,
        }
        # 1. Queue Counter / Department Channel
        await self.broadcast_to_channel(f"queue:{session_id}", payload)
        # 2. Hospital Organization Channel
        await self.broadcast_to_channel(f"hospital:{hospital_id}", payload)
        # 3. Specific Ticket Channel (if patient listening)
        if ticket_id:
            await self.broadcast_to_channel(f"ticket:{ticket_id}", payload)


manager = ConnectionManager()
