from pydantic import BaseModel

class UserCreate(BaseModel):
    name:str
    email:str
    password:str
    company_id:int
    role_id:int

class UserOut(BaseModel):
    id:int
    name:str
    email:str
    company_id:int
    role_id:int

    class Config:
        orm_mode=True