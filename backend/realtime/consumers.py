# backend/realtime/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from accounts.models import User
from vehicles.models import EntryLog, Vehicle
from django.utils import timezone

class VehicleLogConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get user from token in query string
        token = self.scope['query_string'].decode().split('token=')[-1]
        user = await self.get_user_from_token(token)
        
        if user and user.is_authenticated:
            self.user = user
            self.room_group_name = f"vehicle_logs_{user.org.id if user.org else 'global'}"
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # Send initial data
            recent_logs = await self.get_recent_logs()
            await self.send(text_data=json.dumps({
                'type': 'initial_data',
                'logs': recent_logs
            }))
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong',
                'timestamp': timezone.now().isoformat()
            }))

    # Receive message from room group
    async def vehicle_log_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            from rest_framework_simplejwt.tokens import UntypedToken
            from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
            from django.contrib.auth import get_user_model
            import jwt
            from django.conf import settings
            
            # Validate token
            UntypedToken(token)
            
            # Decode token to get user_id
            decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_data.get('user_id')
            
            User = get_user_model()
            return User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None

    @database_sync_to_async
    def get_recent_logs(self):
        # Get recent logs for user's organization
        if self.user.role == 'ADMIN':
            logs = EntryLog.objects.all()[:20]
        else:
            logs = EntryLog.objects.filter(vehicle__org=self.user.org)[:20]
        
        return [
            {
                'id': log.id,
                'vehicle_plate': log.vehicle.license_plate or log.vehicle.vin,
                'action': log.action,
                'timestamp': log.timestamp.isoformat(),
                'created_by': log.created_by.username if log.created_by else 'System'
            }
            for log in logs.order_by('-timestamp')
        ]