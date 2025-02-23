"""
Configuration management for BizTools components
"""

from typing import Any, Dict, Optional
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    """Base settings class for BizTools components"""
    
    # Database settings
    database_url: str = Field(
        default="sqlite:///biztools.db",
        description="Database connection string"
    )
    
    # Cache settings
    cache_url: Optional[str] = Field(
        default=None,
        description="Cache backend URL (e.g. redis://localhost)"
    )
    
    # API settings
    api_prefix: str = Field(
        default="/api/v1",
        description="API route prefix"
    )
    
    # Logging settings
    log_level: str = Field(
        default="INFO",
        description="Logging level"
    )
    
    class Config:
        env_prefix = "BIZTOOLS_"
        case_sensitive = False

    def get_component_settings(self, component: str) -> Dict[str, Any]:
        """Get settings specific to a component"""
        return {
            k.replace(f"{component}_", ""): v
            for k, v in self.dict().items()
            if k.startswith(f"{component}_")
        } 