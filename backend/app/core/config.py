from typing import List, Union
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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()

