from pydantic import BaseModel

# define chat request class which used to validate the input data which the user send to us
class ChatRequest(BaseModel):
    message: str


# define chat response model used to validate and  formatted the response
class ChatResponse(BaseModel):
    answer: str