from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.queues import router as queues_router
from app.api.v1.tickets import router as tickets_router
from app.api.v1.partners import router as partners_router
from app.api.v1.patients import router as patients_router
from app.api.v1.admin import router as admin_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.assistant import router as assistant_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(queues_router)
api_v1_router.include_router(tickets_router)
api_v1_router.include_router(partners_router)
api_v1_router.include_router(patients_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(assistant_router)
