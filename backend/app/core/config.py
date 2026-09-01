from pydantic_settings import  BaseSettings

class Settings(BaseSettings):
    app_name: str = "Welcome to the Call Center AI Assistant API"
    groq_api_key: str
    llm_model: str = "openai/gpt-oss-120b"
    dev_mode: bool = True
    database_url: str
    jwt_secret:str

    # Email config
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 465
    smtp_user: str
    smtp_password: str
    from_email: str

    class Config :
        env_file = ".env"


settings = Settings ()