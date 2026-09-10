import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.redis import get_redis_client, close_redis_client
from app.core.websocket import manager
from app.api.v1.router import api_v1_router

# Proper engineering structured logger
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("healthcare_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Proper engineering startup configuration & security audit
    audit = settings.get_security_audit_summary()
    logger.info("==================================================")
    logger.info("  %s — Startup Initialization", settings.PROJECT_NAME)
    logger.info("==================================================")
    logger.info("  • Environment:     %s", audit["environment"])
    logger.info("  • Database Target: %s", audit["database_target"])
    logger.info("  • Redis Target:    %s", audit["redis_target"])
    logger.info("  • JWT Auth Key:    %s (%s, %dm expiry)", audit["jwt_secret"], settings.ALGORITHM, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    logger.info("  • AI Foundry:      %s", audit["ai_foundry"])
    logger.info("  • Azure Storage:   %s", audit["azure_storage"])
    logger.info("==================================================")

    # Security check for production secret key
    if settings.is_production and (not settings.SECRET_KEY or "CHANGE-THIS" in settings.SECRET_KEY):
        logger.warning("⚠️  SECURITY WARNING: Using default development SECRET_KEY in production! Please define a strong SECRET_KEY in .env before public release.")

    # Startup: Initialize Redis connection
    try:
        await get_redis_client()
        logger.info("✅ Redis client connected successfully.")
    except Exception as e:
        logger.warning("⚠️  Redis connection warning: %s", e)

    yield

    # Shutdown: Close Redis connection
    await close_redis_client()
    logger.info("Redis client disconnected.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart Hospital Queue & Booking Platform API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
# In Docker, CORS_ORIGINS=["*"] allows all origins via regex.
# In dev, explicit origins are used.
if "*" in settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
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
