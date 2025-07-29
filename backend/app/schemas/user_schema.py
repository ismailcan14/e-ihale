from pydantic import BaseModel, EmailStr

##İlk kayıtta
class UserRegisterCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_id: int
    role_id: int


#Çalışan eklerken
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    company_id: int
    role_id: int

    class Config:
        orm_mode = True 
