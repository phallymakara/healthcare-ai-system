#!/bin/bash
set -e

echo "=================================================="
echo "  Healthcare AI System — Backend Container"
echo "=================================================="

# --- 1. Wait for PostgreSQL to be ready ---
echo "⏳ Waiting for PostgreSQL at ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}..."
MAX_RETRIES=30
RETRY_COUNT=0
until pg_isready -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" -q 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ PostgreSQL did not become ready after ${MAX_RETRIES} retries. Exiting."
        exit 1
    fi
    echo "   Retry ${RETRY_COUNT}/${MAX_RETRIES}..."
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# --- 2. Run Alembic database migrations ---
echo "🔄 Running Alembic database migrations..."
alembic upgrade head
echo "✅ Database migrations complete!"

# --- 3. Seed initial data if needed ---
if [ "${SEED_DATA:-false}" = "true" ]; then
    echo "🌱 Seeding initial data..."
    python -m app.seeds.seed_data
    echo "✅ Seeding complete!"
fi

# --- 4. Start the FastAPI application ---
echo "🚀 Starting FastAPI server..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers "${UVICORN_WORKERS:-2}" \
    --log-level "${LOG_LEVEL:-info}"
