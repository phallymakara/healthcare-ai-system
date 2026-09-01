# CareQueue AI - Automated Docker Database Testing Pipeline
# Usage: .\test_system_docker.ps1

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "CareQueue AI - Automated Docker DB Test Runner" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Start Docker Containers
Write-Host "`n[Step 1/5] Starting Docker Containers (Postgres 5440, Redis 6379)..." -ForegroundColor Yellow
docker-compose up -d postgres redis
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start docker containers." -ForegroundColor Red
    exit 1
}

# Wait 3 seconds for database to initialize socket
Start-Sleep -Seconds 3

# 2. Run Database Migrations
Write-Host "`n[Step 2/5] Applying Alembic Migrations to Docker DB..." -ForegroundColor Yellow
cd backend
.\venv\Scripts\alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Alembic migration failed." -ForegroundColor Red
    cd ..
    exit 1
}

# 3. Seed Database
Write-Host "`n[Step 3/5] Seeding Demonstration Data into Docker DB..." -ForegroundColor Yellow
.\venv\Scripts\python -m app.seeds.seed_data
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Seeding database failed." -ForegroundColor Red
    cd ..
    exit 1
}

# 4. Verify Docker DB & Redis Connectivity
Write-Host "`n[Step 4/5] Verifying Docker DB Tables & Redis Keys..." -ForegroundColor Yellow
.\venv\Scripts\python -m scripts.verify_docker_db
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker DB verification failed." -ForegroundColor Red
    cd ..
    exit 1
}

# 5. Run Full Automated Pytest Suite
Write-Host "`n[Step 5/5] Running All 41 Automated Pytest Suites against Docker DB..." -ForegroundColor Yellow
.\venv\Scripts\pytest -v
$testExitCode = $LASTEXITCODE

cd ..

if ($testExitCode -eq 0) {
    Write-Host "`n==================================================" -ForegroundColor Green
    Write-Host "ALL DOCKER DB TESTS PASSED SUCCESSFULLY! (41/41)" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
} else {
    Write-Host "`n==================================================" -ForegroundColor Red
    Write-Host "SOME TESTS FAILED. Please review the output above." -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Red
    exit 1
}
