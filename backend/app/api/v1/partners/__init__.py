from fastapi import APIRouter

from .dashboard_routes import router as dashboard_router
from .department_routes import router as department_router
from .doctor_routes import router as doctor_router
from .staff_routes import router as staff_router
from .hospital_routes import router as hospital_router

router = APIRouter(prefix="/partners", tags=["Hospital & Clinic Partner Platform"])

router.include_router(dashboard_router)
router.include_router(department_router)
router.include_router(doctor_router)
router.include_router(staff_router)
router.include_router(hospital_router)

__all__ = ["router"]
