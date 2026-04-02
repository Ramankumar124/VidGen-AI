from passlib.context import CryptContext
from pwdlib import PasswordHash
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
password_hash = PasswordHash.recommended()
def hash_password(password: str):
         return password_hash.hash(password)