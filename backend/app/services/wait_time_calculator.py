from datetime import datetime, timezone
from typing import Optional, Dict


class WaitTimeCalculator:
    """Formula-based deterministic wait-time engine for outpatient queues.
    
    Formula:
        Estimated Wait = max(0, avg_consultation - serving_elapsed) + (position_ahead - 1) * avg_consultation * peak_multiplier
    """

    DEFAULT_AVG_CONSULTATION_MINUTES = 15
    MIN_WAIT_MINUTES = 0

    @classmethod
    def get_peak_hour_multiplier(cls, dt: Optional[datetime] = None) -> float:
        """Determines congestion multiplier based on hospital peak outpatient hours"""
        current = dt or datetime.now()
        hour = current.hour
        minute = current.minute
        time_decimal = hour + (minute / 60.0)

        # Morning rush: 09:00 - 11:30
        if 9.0 <= time_decimal <= 11.5:
            return 1.15

        # Afternoon rush: 14:00 - 16:00
        if 14.0 <= time_decimal <= 16.0:
            return 1.10

        return 1.0

    @classmethod
    def calculate_wait_time(
        cls,
        position_ahead: int,
        avg_consultation_minutes: Optional[int] = None,
        is_serving_in_progress: bool = True,
        serving_started_at: Optional[datetime] = None,
        check_time: Optional[datetime] = None,
    ) -> int:
        """Calculates expected target wait time in integer minutes using queue formula"""
        res = cls.calculate_wait_time_details(
            position_ahead=position_ahead,
            avg_consultation_minutes=avg_consultation_minutes,
            is_serving_in_progress=is_serving_in_progress,
            serving_started_at=serving_started_at,
            check_time=check_time,
        )
        return res["target_minutes"]

    @classmethod
    def calculate_wait_time_details(
        cls,
        position_ahead: int,
        avg_consultation_minutes: Optional[int] = None,
        is_serving_in_progress: bool = True,
        serving_started_at: Optional[datetime] = None,
        check_time: Optional[datetime] = None,
    ) -> Dict[str, int]:
        """Calculates target, minimum, and maximum wait time range estimates"""
        if position_ahead <= 0:
            return {"target_minutes": 0, "min_minutes": 0, "max_minutes": 0}

        avg_duration = avg_consultation_minutes or cls.DEFAULT_AVG_CONSULTATION_MINUTES
        peak_multiplier = cls.get_peak_hour_multiplier(check_time)

        # 1. Remaining time for the patient currently being served at counter
        current_serving_remaining = 0.0
        if is_serving_in_progress:
            if serving_started_at:
                now_utc = (check_time or datetime.now(timezone.utc)).replace(tzinfo=None)
                elapsed_minutes = (now_utc - serving_started_at).total_seconds() / 60.0
                current_serving_remaining = max(0.0, float(avg_duration) - max(0.0, elapsed_minutes))
            else:
                # Approximate 50% through average consultation
                current_serving_remaining = float(avg_duration) * 0.5

        # 2. Remaining patients waiting in line before this ticket
        queued_patients_before = max(0, position_ahead - (1 if is_serving_in_progress else 0))
        queue_wait = queued_patients_before * float(avg_duration) * peak_multiplier

        target_total = current_serving_remaining + queue_wait
        target_minutes = max(cls.MIN_WAIT_MINUTES, int(round(target_total)))

        # 3. Calculate confidence interval range (±15%)
        min_minutes = max(0, int(round(target_minutes * 0.85)))
        max_minutes = int(round(target_minutes * 1.20)) + (2 if target_minutes > 5 else 0)

        return {
            "target_minutes": target_minutes,
            "min_minutes": min_minutes,
            "max_minutes": max_minutes,
        }
