import math
import logging
from typing import Optional, List, Tuple, Dict, Any
import httpx

logger = logging.getLogger(__name__)

# Lightweight in-memory cache: key -> (distance_km, duration_minutes)
_DRIVING_CACHE: Dict[Tuple[float, float, float, float], Dict[str, Any]] = {}
_MAX_CACHE_SIZE = 500


def calculate_distance_km(
    lat1: Optional[float],
    lon1: Optional[float],
    lat2: Optional[float],
    lon2: Optional[float],
) -> Optional[float]:
    """
    Calculate geodesic distance in kilometers between two GPS coordinates
    using the Haversine formula. Returns None if any coordinate is missing.
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None

    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(distance, 2)


async def calculate_driving_distances_batch(
    origin_lat: float,
    origin_lon: float,
    destinations: List[Tuple[Optional[float], Optional[float]]],
    timeout_seconds: float = 2.0,
) -> List[Optional[Dict[str, Any]]]:
    """
    Calculate real road driving distances and estimated durations using OSRM Table API.
    Performs a single batch request for all destinations.
    Returns a list of dicts with {"distance_km": float, "duration_minutes": int} or None for each dest.
    Falls back gracefully if OSRM is unreachable or times out.
    """
    if not destinations:
        return []

    results: List[Optional[Dict[str, Any]]] = [None] * len(destinations)
    missing_indices: List[int] = []

    # 1. Check in-memory cache for rounded coordinates (approx 100m grid)
    o_lat_r = round(origin_lat, 3)
    o_lon_r = round(origin_lon, 3)

    for idx, dest in enumerate(destinations):
        if not dest or dest[0] is None or dest[1] is None:
            continue
        d_lat, d_lon = dest[0], dest[1]
        cache_key = (o_lat_r, o_lon_r, round(d_lat, 3), round(d_lon, 3))
        if cache_key in _DRIVING_CACHE:
            results[idx] = _DRIVING_CACHE[cache_key]
        else:
            missing_indices.append(idx)

    if not missing_indices:
        return results

    # 2. Build OSRM Table query for missing destinations
    # OSRM format: {lon},{lat};{lon},{lat}...
    # Coordinate index 0 is origin, indices 1..N are destinations
    sub_dests = [destinations[i] for i in missing_indices]
    coords_list = [f"{origin_lon:.5f},{origin_lat:.5f}"] + [
        f"{d[1]:.5f},{d[0]:.5f}" for d in sub_dests if d[0] is not None and d[1] is not None
    ]
    coords_param = ";".join(coords_list)
    url = f"http://router.project-osrm.org/table/v1/driving/{coords_param}?sources=0&annotations=distance,duration"

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            resp = await client.get(url, headers={"User-Agent": "HealthcareAI-Cambodia/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                distances = data.get("distances", [[]])[0][1:]
                durations = data.get("durations", [[]])[0][1:]

                if len(_DRIVING_CACHE) > _MAX_CACHE_SIZE:
                    _DRIVING_CACHE.clear()

                for sub_idx, orig_idx in enumerate(missing_indices):
                    if sub_idx < len(distances) and distances[sub_idx] is not None:
                        dist_m = distances[sub_idx]
                        dur_s = durations[sub_idx] if sub_idx < len(durations) else None
                        dist_km = round(dist_m / 1000.0, 2)
                        dur_mins = max(1, round(dur_s / 60.0)) if dur_s is not None else None
                        info = {
                            "distance_km": dist_km,
                            "duration_minutes": dur_mins,
                        }
                        results[orig_idx] = info

                        dest = destinations[orig_idx]
                        if dest and dest[0] is not None and dest[1] is not None:
                            cache_key = (o_lat_r, o_lon_r, round(dest[0], 3), round(dest[1], 3))
                            _DRIVING_CACHE[cache_key] = info
            else:
                logger.warning(f"OSRM Table API returned status {resp.status_code}")
    except Exception as err:
        logger.warning(f"OSRM driving distance lookup error (falling back to geodesic): {err}")

    return results
