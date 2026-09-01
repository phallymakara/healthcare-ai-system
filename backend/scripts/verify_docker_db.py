import asyncio
import sys
import uuid
from sqlalchemy import text
from app.core.database import AsyncSessionLocal
from app.core.redis import get_redis_client


async def verify_docker_environment():
    print("==================================================")
    print("Testing Docker Database & Redis Connectivity")
    print("==================================================")

    # 1. Test PostgreSQL connection & query tables
    print("[1/3] Connecting to Docker PostgreSQL on port 5440...")
    try:
        async with AsyncSessionLocal() as session:
            # Check PostgreSQL version
            v_res = await session.execute(text("SELECT version();"))
            db_version = v_res.scalar()
            print(f"      Connected successfully to PostgreSQL: {db_version[:45]}...")

            # Check table counts
            tables = [
                "users",
                "hospitals",
                "hospital_branches",
                "departments",
                "services",
                "doctors",
                "doctor_schedules",
                "queue_sessions",
                "tickets",
                "ticket_logs",
            ]

            print("[2/3] Verifying database schema tables and seed counts...")
            for table in tables:
                res = await session.execute(text(f"SELECT COUNT(*) FROM {table};"))
                count = res.scalar()
                print(f"      Table '{table}': {count} records")

    except Exception as e:
        print(f"ERROR: Failed to connect to PostgreSQL container: {e}")
        sys.exit(1)

    # 2. Test Redis connection
    print("[3/3] Connecting to Docker Redis on port 6379...")
    try:
        redis = await get_redis_client()
        ping_res = await redis.ping()
        test_key = f"test:ping:{uuid.uuid4().hex[:6]}"
        await redis.set(test_key, "active", ex=30)
        val = await redis.get(test_key)
        await redis.delete(test_key)
        await redis.aclose()
        print(f"      Redis Ping response: {ping_res} (Key write/read/delete: OK)")
    except Exception as e:
        print(f"ERROR: Failed to connect to Redis container: {e}")
        sys.exit(1)

    print("\n==================================================")
    print("All Docker Database & Redis Services are Healthy!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(verify_docker_environment())
