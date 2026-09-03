import os
import sys
import secrets
from pathlib import Path

# ----------------------------------------------------------------------
# Add the backend directory (contains the app package) to import path
# ----------------------------------------------------------------------
sys.path.append(str(Path(__file__).resolve().parents[1]))  # backend folder (contains app package)

# ----------------------------------------------------------------------
# Import your app’s components
# ----------------------------------------------------------------------
from app.db.session import SessionLocal          # DB session factory
from app.models.user import User                 # ORM model
from app.models.enums import UserRole            # The enum we need
from app.core.security import get_password_hash # Password hashing helper
# ----------------------------------------------------------------------


def main() -> None:
    db = SessionLocal()

    # ------------------------------------------------------------------
    # Settings – you can override them with environment variables if you want
    # ------------------------------------------------------------------
    email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    raw_password = os.getenv("ADMIN_PASSWORD") or secrets.token_urlsafe(12)

    # ------------------------------------------------------------------
    # Guard against duplicates
    # ------------------------------------------------------------------
    if db.query(User).filter(User.email == email).first():
        print(f"⚠️  An admin with {email} already exists – aborting.")
        return

    # ------------------------------------------------------------------
    # Create the user – note the use of the enum value
    # ------------------------------------------------------------------
    admin_user = User(
        id=secrets.token_hex(16),                     # or uuid.uuid4()
        email=email,
        phone_number=None,                           # you can fill this if you like
        hashed_password=get_password_hash(raw_password),
        full_name="Platform Admin",
        role=UserRole.HOSPITAL_ADMIN,                # <-- any enum member works
        is_active=True,
        is_verified=True,
    )
    db.add(admin_user)
    db.commit()

    print("\n✅  Admin account created")
    print(f"📧  Email   : {email}")
    print(f"🔑  Password: {raw_password}")
    print("\nℹ️  Use those credentials on the login form.\n"
          "   After you have logged in you can delete or ignore this script.\n")


if __name__ == "__main__":
    main()
