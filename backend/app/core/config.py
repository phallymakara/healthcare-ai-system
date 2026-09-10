from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    PROJECT_NAME: str = "Healthcare AI System"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Auth & JWT (must be set in .env)
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # PostgreSQL
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "healthcare_ai_db"
    DATABASE_URL: str = ""

    # Redis
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    REDIS_URL: str = ""

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://partner.localhost:5173",
        "http://hospital.localhost:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from env var — supports JSON array string or '*'."""
        if isinstance(v, str):
            v = v.strip()
            if v == '["*"]' or v == "*":
                return ["*"]
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, TypeError):
                pass
            # Comma-separated fallback
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Microsoft Foundry / Azure OpenAI LLM (set in .env, never commit real keys)
    MICROSOFT_FOUNDRY_API_KEY: str = ""
    MICROSOFT_FOUNDRY_BASE_URL: str = ""
    MICROSOFT_FOUNDRY_MODEL: str = "gpt-4o"

    # LangGraph Configuration (set in .env)
    LANGGRAPH_CHECKPOINT_DATABASE_URL: str = ""
    LANGGRAPH_STRICT_MSGPACK: bool = True

    # Azure Blob Storage Configuration (set in .env)
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_STORAGE_CONTAINER_NAME: str = "public-profiles"
    AZURE_STORAGE_CUSTOM_DOMAIN: Optional[str] = None
    AZURE_STORAGE_ACCOUNT_NAME: str = ""
    AZURE_STORAGE_ACCOUNT_KEY: str = ""

    @model_validator(mode="after")
    def assemble_urls(self):
        """Dynamically build and normalize URLs across local and production environments."""
        # 1. Database URL: auto-normalize cloud driver prefixes or build dynamically
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgres://"):
                self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
            elif self.DATABASE_URL.startswith("postgresql://") and not self.DATABASE_URL.startswith("postgresql+asyncpg://"):
                self.DATABASE_URL = self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        else:
            auth = f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@" if self.POSTGRES_PASSWORD else (f"{self.POSTGRES_USER}@" if self.POSTGRES_USER else "")
            self.DATABASE_URL = f"postgresql+asyncpg://{auth}{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        # 2. LangGraph Checkpoint DB URL: sync driver compatibility
        if self.LANGGRAPH_CHECKPOINT_DATABASE_URL:
            if self.LANGGRAPH_CHECKPOINT_DATABASE_URL.startswith("postgres://"):
                self.LANGGRAPH_CHECKPOINT_DATABASE_URL = self.LANGGRAPH_CHECKPOINT_DATABASE_URL.replace("postgres://", "postgresql://", 1)
            elif self.LANGGRAPH_CHECKPOINT_DATABASE_URL.startswith("postgresql+asyncpg://"):
                self.LANGGRAPH_CHECKPOINT_DATABASE_URL = self.LANGGRAPH_CHECKPOINT_DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
        else:
            auth = f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@" if self.POSTGRES_PASSWORD else (f"{self.POSTGRES_USER}@" if self.POSTGRES_USER else "")
            self.LANGGRAPH_CHECKPOINT_DATABASE_URL = f"postgresql://{auth}{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        # 3. Redis URL
        if not self.REDIS_URL:
            auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
            self.REDIS_URL = f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
            
        return self

    @property
    def is_foundry_configured(self) -> bool:
        """Check if Microsoft Foundry / Azure OpenAI API key is properly set."""
        key = (self.MICROSOFT_FOUNDRY_API_KEY or "").strip()
        return bool(key and key != "your-api-key-here" and len(key) >= 10)

    @property
    def is_azure_storage_configured(self) -> bool:
        """Check if Azure Blob Storage connection string is properly set."""
        conn = (self.AZURE_STORAGE_CONNECTION_STRING or "").strip()
        return bool(conn and "DefaultEndpointsProtocol" in conn and len(conn) >= 20)

    @property
    def is_production(self) -> bool:
        return (self.ENVIRONMENT or "").lower() == "production"

    def get_security_audit_summary(self) -> dict:
        """Returns masked summary of security keys and connection targets for audit logging."""
        masked_secret = f"***{self.SECRET_KEY[-4:]}" if len(self.SECRET_KEY) > 6 else "[NOT CONFIGURED]"
        foundry_status = (
            f"Active (Model: {self.MICROSOFT_FOUNDRY_MODEL}, Key: ***{self.MICROSOFT_FOUNDRY_API_KEY[-4:]})"
            if self.is_foundry_configured
            else "Not Configured (Rule-based fallback active)"
        )
        storage_status = (
            f"Active (Container: {self.AZURE_STORAGE_CONTAINER_NAME})"
            if self.is_azure_storage_configured
            else "Not Configured (Mock upload fallback)"
        )

        return {
            "environment": self.ENVIRONMENT,
            "database_target": f"{self.POSTGRES_USER}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}",
            "redis_target": f"{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}",
            "jwt_secret": masked_secret,
            "ai_foundry": foundry_status,
            "azure_storage": storage_status,
        }

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()

