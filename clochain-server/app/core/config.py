import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
  def __init__(self) -> None:
    self.app_name = os.getenv("APP_NAME", "CloChain Server v2")
    self.cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
    self.jwt_secret = os.getenv("JWT_SECRET", "dev-secret")
    self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    self.jwt_exp_minutes = int(os.getenv("JWT_EXP_MINUTES", "30"))
    self.hmac_secret = os.getenv("HMAC_SECRET", "dev-hmac")
    self.database_url = os.getenv("DATABASE_URL", "sqlite:///./clochain.db")
    self.pinata_api_key = os.getenv("PINATA_API_KEY", "pinata-key")
    self.pinata_secret = os.getenv("PINATA_SECRET", "pinata-secret")


@lru_cache
def get_settings() -> Settings:
  return Settings()


settings = get_settings()
