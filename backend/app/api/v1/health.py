import time
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.core.redis import get_redis_client

router = APIRouter(prefix="/health", tags=["Health & Status"])


@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    """System health check verifying database and Redis connectivity"""
    db_status = "healthy"
    redis_status = "healthy"
    
    # Test DB
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Test Redis
    try:
        redis = await get_redis_client()
        await redis.ping()
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if db_status == "healthy" and redis_status == "healthy" else "degraded",
        "timestamp": time.time(),
        "services": {
            "database": db_status,
            "redis": redis_status,
        }
    }
