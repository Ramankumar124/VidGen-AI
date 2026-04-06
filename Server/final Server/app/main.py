from fastapi import FastAPI
from app.routers import user_router
from app.routers import auth_router
from app.models import * 
from app.db.database import Base,engine
from fastapi import HTTPException,Request
from fastapi.responses import JSONResponse
app=FastAPI()



Base.metadata.create_all(bind=engine)
app.include_router(user_router.router)
app.include_router(auth_router.router)

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.detail,
            "data": None
        }
    )