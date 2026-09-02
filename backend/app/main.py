from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.redis import get_redis_client, close_redis_client
from app.core.websocket import manager
from app.api.v1.router import api_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Redis connection
    try:
        await get_redis_client()
        print("✅ Redis client connected successfully.")
    except Exception as e:
        print(f"⚠️ Redis connection warning: {e}")

    yield

    # Shutdown: Close Redis connection
    await close_redis_client()
    print("🛑 Redis client disconnected.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart Hospital Queue & Booking Platform API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }


@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    """Real-time WebSocket endpoint for queue updates and ticket notifications"""
    await manager.connect(websocket, channel=channel)
    try:
        # Send initial connection confirmation
        await manager.send_personal_message(
            {"type": "CONNECTION_ESTABLISHED", "channel": channel},
            websocket
        )
        while True:
            data = await websocket.receive_text()
            # Echo / heartbeat or handle client messages
            await manager.send_personal_message(
                {"type": "MESSAGE_RECEIVED", "data": data},
                websocket
            )
    except (WebSocketDisconnect, Exception):
        manager.disconnect(websocket, channel=channel)
