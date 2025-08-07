from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegisterCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_id: int
    role_id: int


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role_id: Optional[int] = None


class RoleOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True


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
