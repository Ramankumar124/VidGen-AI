from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import user_router
from app.routers import auth_router
from app.routers import agent_router
from app.models import *
from app.db.database import Base, engine
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import os

app = FastAPI(title="AdScript Cinematic AI", version="1.0.0")

# ── Serve uploaded product images ─────────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Database ──────────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(user_router.router)
app.include_router(auth_router.router)
app.include_router(agent_router.router)


# ── Global error handler ──────────────────────────────────────────────────────
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


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "AdScript AI"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
 