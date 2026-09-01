import enum


class UserRole(str, enum.Enum):
    PATIENT = "PATIENT"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
    RECEPTIONIST = "RECEPTIONIST"
    DOCTOR = "DOCTOR"
    NURSE = "NURSE"
    SUPER_ADMIN = "SUPER_ADMIN"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class TicketStatus(str, enum.Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    SERVING = "SERVING"
    COMPLETED = "COMPLETED"
    SKIPPED = "SKIPPED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class TicketSource(str, enum.Enum):
    ONLINE = "ONLINE"
    WALK_IN = "WALK_IN"


class QueueStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CLOSED = "CLOSED"


class OverrideType(str, enum.Enum):
    LEAVE = "LEAVE"
    HOLIDAY = "HOLIDAY"
    SPECIAL_HOURS = "SPECIAL_HOURS"
