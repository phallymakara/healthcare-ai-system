from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    PROJECT_NAME: str = "Healthcare AI System"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Auth & JWT
    SECRET_KEY: str = "healthcare-super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # PostgreSQL
    POSTGRES_HOST: str = "127.0.0.1"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres123"
    POSTGRES_DB: str = "healthcare_ai_db"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres123@127.0.0.1:5432/healthcare_ai_db"

    # Redis
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: str = "redis://127.0.0.1:6379/0"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
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

    # LangGraph Configuration
    LANGGRAPH_CHECKPOINT_DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5433/healthcare_ai"
    LANGGRAPH_STRICT_MSGPACK: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()

