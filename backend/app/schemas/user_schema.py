from pydantic import BaseModel, EmailStr
from typing import Optional

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

#Kullanıcı Güncellerken
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role_id: Optional[int] = None

#Rol Bilgisi için
class RoleOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

#Response Model
class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    company_id: int
    role_id: int

    class Config:
        orm_mode = True


class UserDetailOut(UserOut):
    role: RoleOut
