from typing import Optional
from pydantic import BaseModel, EmailStr

class CompanyCreate(BaseModel):
    company_name:str
    type:Optional[str]=None
    admin_name:str
    admin_email:EmailStr
    admin_password: str

    class CompanyOut(BaseModel):
        id:int
        name:str
        type:Optional[str]=None

        class Config:
            from_attributes=True
