import pytest
from datetime import datetime
from app.services.wait_time_calculator import WaitTimeCalculator


def test_wait_time_zero_position():
    res = WaitTimeCalculator.calculate_wait_time_details(position_ahead=0)
    assert res["target_minutes"] == 0
    assert res["min_minutes"] == 0
    assert res["max_minutes"] == 0


def test_wait_time_position_scaling():
    # 3 ahead, 15 min avg consultation, normal hour
    off_peak_time = datetime(2026, 9, 1, 12, 0, 0)
    res = WaitTimeCalculator.calculate_wait_time_details(
        position_ahead=3,
        avg_consultation_minutes=15,
        is_serving_in_progress=False,
        check_time=off_peak_time,
    )
    # 3 * 15 = 45 mins
    assert res["target_minutes"] == 45
    assert res["min_minutes"] <= 45
    assert res["max_minutes"] >= 45


def test_wait_time_active_serving_elapsed_deduction():
    # Current serving started 10 mins ago (5 mins remaining of 15 min consultation) + 1 patient ahead (15 mins) = 20 mins
    serving_start = datetime(2026, 9, 1, 12, 0, 0)
    current_time = datetime(2026, 9, 1, 12, 10, 0)

    res = WaitTimeCalculator.calculate_wait_time_details(
        position_ahead=2,
        avg_consultation_minutes=15,
        is_serving_in_progress=True,
        serving_started_at=serving_start,
        check_time=current_time,
    )
    assert res["target_minutes"] == 20


def test_peak_hour_congestion_multiplier():
    morning_peak = datetime(2026, 9, 1, 10, 0, 0)  # 10:00 AM -> 1.15 multiplier
    off_peak = datetime(2026, 9, 1, 12, 30, 0)      # 12:30 PM -> 1.0 multiplier

    mult_peak = WaitTimeCalculator.get_peak_hour_multiplier(morning_peak)
    mult_off = WaitTimeCalculator.get_peak_hour_multiplier(off_peak)

    assert mult_peak == 1.15
    assert mult_off == 1.0

    res_peak = WaitTimeCalculator.calculate_wait_time(
        position_ahead=4,
        avg_consultation_minutes=20,
        is_serving_in_progress=False,
        check_time=morning_peak,
    )
    res_off = WaitTimeCalculator.calculate_wait_time(
        position_ahead=4,
        avg_consultation_minutes=20,
        is_serving_in_progress=False,
        check_time=off_peak,
    )
    assert res_peak > res_off
