import asyncio
import json
import logging
import os
import re
import sys
import uuid
from datetime import datetime
from typing import Optional, Set

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_production_nssf")

from sqlalchemy import select, delete, func, text
from app.core.database import AsyncSessionLocal
from app.models.enums import VerificationStatus
from app.models.hospital import Hospital, HospitalBranch, Department, Service
from app.models.doctor import Doctor
from app.models.queue import QueueSession, Ticket


def slugify(text: str) -> str:
    """Generate a clean, URL-safe slug."""
    text = text.lower().strip()
    # Replace non-alphanumeric characters with hyphens
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text[:200] if text else "facility"


def extract_primary_phone(raw_contact: Optional[str]) -> Optional[str]:
    """Extract a clean, single phone number capped strictly at 32 characters."""
    if not raw_contact:
        return None
    raw = str(raw_contact).strip()
    if raw.lower() in ("not found", "not available", "none", "null", "-", ""):
        return None
    
    # Try finding standard Cambodian phone numbers: e.g. 023 456 7744, 012 304 454, 012-304-454, 088 688 4076
    phones = re.findall(r"(?:\+855|0)\s*\d{1,2}[\s\-\.]*\d{3}[\s\-\.]*\d{3,4}", raw)
    if phones:
        clean = re.sub(r"\s+", " ", phones[0]).strip()
        return clean[:32]
    
    # Check 3-digit hotlines (e.g. 119, 699)
    hotlines = re.findall(r"\b\d{3,4}\b", raw)
    if hotlines:
        return hotlines[0][:32]
        
    # First line fallback
    first_line = raw.split("\n")[0].split("(")[0].strip()
    # Remove excessive symbols
    clean = re.sub(r"[^\d\s\+\-\.]", "", first_line).strip()
    if len(clean) >= 3:
        return clean[:32]
    return None


def format_address(props: dict) -> Optional[str]:
    """Format a clean Cambodia address string up to 512 chars."""
    parts = []
    street = props.get("street")
    village = props.get("village")
    commune = props.get("commune")
    district = props.get("district")
    province = props.get("province")
    
    for token, prefix in [(street, "Street "), (village, ""), (commune, ""), (district, ""), (province, "")]:
        if token and str(token).strip().lower() not in ("not found", "not available", "none", "null", "-"):
            t = str(token).strip()
            if prefix and not t.lower().startswith(prefix.lower()):
                parts.append(f"{prefix}{t}")
            else:
                parts.append(t)
                
    if parts:
        parts.append("Cambodia")
        addr = ", ".join(parts)
        return addr[:512]
    return None


def build_description(props: dict) -> Optional[str]:
    """Compile additional contact, ambulance, and operational agency info."""
    lines = []
    ambulance = props.get("ambulance")
    if ambulance and str(ambulance).strip().lower() not in ("not found", "not available", "none", "null", "-"):
        lines.append(f"Emergency / Ambulance: {str(ambulance).strip()}")
        
    contact = props.get("contact")
    if contact and str(contact).strip().lower() not in ("not found", "not available", "none", "null", "-"):
        lines.append(f"Contacts:\n{str(contact).strip()}")
        
    agency = props.get("nssf_agency")
    if agency and str(agency).strip().lower() not in ("not found", "not available", "none", "null", "-"):
        lines.append(f"NSSF Agency Office:\n{str(agency).strip()}")
        
    note = props.get("note")
    if note and str(note).strip().lower() not in ("not found", "not available", "none", "null", "-"):
        lines.append(f"Note: {str(note).strip()}")
        
    return "\n\n".join(lines) if lines else None


async def purge_all_sample_data(session):
    """Purge all previous mock/demo data in reverse foreign key order."""
    logger.info("🗑️  Purging all previous sample/demo data...")
    await session.execute(delete(Ticket))
    await session.execute(delete(QueueSession))
    await session.execute(delete(Service))
    await session.execute(delete(Doctor))
    await session.execute(delete(Department))
    await session.execute(delete(HospitalBranch))
    await session.execute(delete(Hospital))
    await session.commit()
    logger.info("✅ All sample data successfully purged.")


async def seed_nssf_facilities(json_path: str):
    """Seed 1,333 official NSSF facilities into the PostgreSQL database."""
    if not os.path.exists(json_path):
        logger.error(f"File not found: {json_path}")
        return

    logger.info(f"📖 Loading NSSF dataset from {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = data.get("features", [])
    logger.info(f"Loaded {len(features)} facility records.")

    async with AsyncSessionLocal() as session:
        # Purge sample data first
        await purge_all_sample_data(session)

        used_slugs: Set[str] = set()
        hospitals_to_insert = []
        
        for idx, feat in enumerate(features, 1):
            props = feat.get("properties", {})
            name = (props.get("name") or "").strip()
            if not name:
                name = f"Health Facility {idx}"
            name = name[:255]

            # Generate unique slug
            district = str(props.get("district") or "").strip()
            province = str(props.get("province") or "").strip()
            base_slug = slugify(f"{name}-{district}-{province}") if (district or province) else slugify(name)
            
            slug = base_slug
            counter = 2
            while slug in used_slugs:
                slug = f"{base_slug[:240]}-{counter}"
                counter += 1
            used_slugs.add(slug)

            # Extract clean phone
            primary_phone = extract_primary_phone(props.get("contact"))
            # Fallback to ambulance if contact is empty
            if not primary_phone:
                primary_phone = extract_primary_phone(props.get("ambulance"))

            # Emergency services check
            has_ambulance = False
            amb = props.get("ambulance")
            if amb and str(amb).strip().lower() not in ("not found", "not available", "none", "null", "-"):
                has_ambulance = True
            if any(w in name.lower() for w in ["referral hospital", "national hospital", "calmette", "kossamak", "friendship"]):
                has_ambulance = True

            # Address & description
            address = format_address(props)
            description = build_description(props)

            # Coordinates
            lat = None
            lng = None
            try:
                raw_lat = props.get("lat")
                raw_lng = props.get("long")
                if raw_lat is not None and raw_lng is not None:
                    fl_lat = float(raw_lat)
                    fl_lng = float(raw_lng)
                    if 9.0 <= fl_lat <= 15.0 and 102.0 <= fl_lng <= 108.0:
                        lat = fl_lat
                        lng = fl_lng
            except (ValueError, TypeError):
                pass

            hospital = Hospital(
                id=uuid.uuid4(),
                name=name,
                slug=slug,
                description=description,
                phone=primary_phone,
                address=address,
                latitude=lat,
                longitude=lng,
                is_active=True,
                is_verified=True,
                verification_status=VerificationStatus.APPROVED,
                emergency_service_available=has_ambulance,
                rating=0.0,
                total_reviews=0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            hospitals_to_insert.append(hospital)

        logger.info(f"🌱 Inserting {len(hospitals_to_insert)} verified NSSF facilities...")
        # Batch insert
        session.add_all(hospitals_to_insert)
        await session.commit()
        logger.info(f"🎉 Successfully seeded {len(hospitals_to_insert)} official facilities into production database!")

        # Verify insertion count
        res = await session.execute(select(func.count(Hospital.id)))
        total_in_db = res.scalar()
        logger.info(f"📊 Total hospitals now in database: {total_in_db}")


if __name__ == "__main__":
    seed_file = os.path.join(os.path.dirname(__file__), "..", "app", "seeds", "nssf_facilities.json")
    asyncio.run(seed_nssf_facilities(seed_file))
