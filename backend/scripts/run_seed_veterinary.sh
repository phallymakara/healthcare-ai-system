#!/bin/bash
# ==============================================================================
# Script to seed Veterinary & Animal Clinic data on the server
# ==============================================================================
set -e

echo "🐾 Seeding Veterinary & Animal Clinic Data..."

# Check if running inside Docker container or directly on host
if [ -f "/.dockerenv" ]; then
    # Inside container
    cd /app
    python -m scripts.seed_veterinary_data
else
    # On server host using Docker Compose
    if command -v docker &> /dev/null; then
        echo "🐳 Running via Docker Compose..."
        if docker ps | grep -q "healthcare_backend"; then
            docker exec -it healthcare_backend python -m scripts.seed_veterinary_data
        else
            echo "Starting backend container or running via docker compose..."
            docker compose exec backend python -m scripts.seed_veterinary_data
        fi
    else
        # Direct Python host execution
        export PYTHONPATH=.
        python scripts/seed_veterinary_data.py
    fi
fi

echo "✅ Veterinary data seeding completed successfully!"
