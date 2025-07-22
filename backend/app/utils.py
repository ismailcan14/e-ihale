import bcrypt

SECRET_KEY = "secretkey_123"  # Gerçek projede env içine al!
ALGORITHM = "HS256"

# Şifre hash'le
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


