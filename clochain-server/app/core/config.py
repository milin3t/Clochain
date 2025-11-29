import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()


class Settings(BaseModel):
  app_name: str = Field(default="CloChain Server")
  environment: str = Field(default=os.getenv("ENVIRONMENT", "local"))
  jwt_secret: str = Field(default=os.getenv("JWT_SECRET", "change-me"))
  jwt_algorithm: str = Field(default="HS256")
  jwt_exp_minutes: int = Field(default=60)
  hmac_secret: str = Field(default=os.getenv("HMAC_SECRET", "replace-me"))
  cors_origins_raw: str = Field(default=os.getenv("CORS_ORIGINS", "*"))

  @property
  def cors_origins(self) -> list[str]:
    if self.cors_origins_raw == "*":
      return ["*"]
    return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache(1)
def get_settings() -> Settings:
  return Settings()


settings = get_settings()
