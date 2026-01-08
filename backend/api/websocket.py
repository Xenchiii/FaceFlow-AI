from fastapi import WebSocket
from typing import List
import json

class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ New WebSocket connection. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.remove(websocket)
        print(f"❌ WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific client"""
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")
    
    async def broadcast_json(self, data: dict):
        """Broadcast JSON data to all clients"""
        message = json.dumps(data)
        await self.broadcast(message)
    
    async def send_attendance_update(self, event_id: int, count: int, method: str):
        """Send attendance update to all clients"""
        update = {
            "type": "attendance_update",
            "event_id": event_id,
            "count": count,
            "method": method,
            "timestamp": str(json.datetime.now())
        }
        await self.broadcast_json(update)
    
    async def send_prediction_update(self, event_id: int, prediction: dict):
        """Send prediction update to all clients"""
        update = {
            "type": "prediction_update",
            "event_id": event_id,
            "prediction": prediction
        }
        await self.broadcast_json(update)
    
    async def send_anomaly_alert(self, anomaly: dict):
        """Send anomaly alert to all clients"""
        alert = {
            "type": "anomaly_alert",
            "anomaly": anomaly
        }
        await self.broadcast_json(alert)