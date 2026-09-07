import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("""
            ALTER TABLE tickets 
            ADD COLUMN IF NOT EXISTS appointment_date DATE,
            ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(32);
        """))
    print("MIGRATION_SUCCESS")

if __name__ == "__main__":
    asyncio.run(migrate())
