from pydantic_settings import  BaseSettings

class Settings(BaseSettings):
    app_name: str = "Welcome to the Call Center AI Assistant API"
    groq_api_key: str
    database_url: str
    jwt_secret: str

    class Config :
        env_file = ".env"


settings = Settings ()