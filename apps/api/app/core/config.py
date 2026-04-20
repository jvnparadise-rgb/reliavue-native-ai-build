from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ReliaVue API"
    environment: str = "local"

    database_url: str | None = None

    db_host: str | None = Field(default=None, alias="DB_HOST")
    db_port: str | None = Field(default=None, alias="DB_PORT")
    db_name: str | None = Field(default=None, alias="DB_NAME")
    db_user: str | None = Field(default=None, alias="DB_USER")
    db_password: str | None = Field(default=None, alias="DB_PASSWORD")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)

    @property
    def resolved_database_url(self) -> str:
        if self.database_url:
            return self.database_url

        if all([self.db_host, self.db_port, self.db_name, self.db_user, self.db_password]):
            return (
                f"postgresql+psycopg://{self.db_user}:{self.db_password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}"
            )

        return "sqlite+pysqlite:///./reliavue_dev.db"


settings = Settings()
