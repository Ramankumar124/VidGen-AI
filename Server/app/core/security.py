from passlib.context import CryptContext
from pwdlib import PasswordHash


pwd_context = CryptContext( deprecated="auto")
password_hash = PasswordHash.recommended()
def hash_password(password: str):
         return password_hash.hash(password)

def verify_password(plain_password:str,hashed_password:str):
        return password_hash.verify(plain_password,hashed_password)
        