import uuid
from fastapi import APIRouter, Body, Depends, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.dependencies import get_db
from typing import Any, List, Optional
from app.services.agent_service import agent_resume, agent_run
from app.models.product import Product
from app.models.project import Project
from app.schemas.product_schema import ProductRead
from app.schemas.project_schema import ProjectListItem, ProjectRead, ProjectSave
from fastapi.exceptions import HTTPException
from pathlib import Path
import os
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/agent", tags=["agent"])


class ResumeRequest(BaseModel):
    run_id: str
    decision: Any


# ── Agent endpoints ────────────────────────────────────────────────────────────

@router.post("/run")
def run_agent(
    url: str = Body(..., example='https://www.instagram.com/p/DV1GrR5CJc5/'),
    db: Session = Depends(get_db)
):
    run_id = str(uuid.uuid4())
    result = agent_run(url, run_id, db)
    return {
        "run_id": run_id,
        "status": result["status"],
        "interrupt": result["interrupt"],
        "data": result["data"],
    }


@router.post("/resume")
def resume_agent(payload: ResumeRequest, db: Session = Depends(get_db)):
    result = agent_resume(payload.run_id, payload.decision, db)
    return {
        "run_id": payload.run_id,
        "status": result["status"],
        "interrupt": result["interrupt"],
        "data": result["data"],
    }


# ── Project endpoints (DB-backed) ─────────────────────────────────────────────

@router.post("/projects/save")
def save_project(payload: ProjectSave, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """
    Upsert a project into the DB.
    Called from the frontend after script generation OR after skipping.
    """
    # Derive status & convenience fields
    has_script = payload.script is not None
    status = "with_script" if has_script else "without_script"

    existing = db.query(Project).filter(Project.run_id == payload.run_id, Project.user_id == current_user).first()

    if existing:
        existing.url = payload.url
        existing.summary = payload.summary
        existing.product = payload.product
        existing.script = payload.script
        existing.status = status
        db.commit()
        db.refresh(existing)
        project = existing
    else:
        project = Project(
            run_id=payload.run_id,
            url=payload.url,
            summary=payload.summary,
            product=payload.product,
            script=payload.script,
            status=status,
            user_id=current_user,
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    return {
        "status": "saved",
        "project_id": project.id,
        "run_id": project.run_id,
    }


@router.get("/projects", response_model=List[ProjectListItem])
def list_projects(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """List all saved projects from the DB for current user, newest first."""
    projects = db.query(Project).filter(Project.user_id == current_user).order_by(Project.created_at.desc()).all()
    result = []
    for p in projects:
        script = p.script or {}
        product = p.product or {}

        # product_name lives at different nesting depths depending on source
        product_name = (
            product.get("product_name")
            or (product.get("details") or {}).get("product_name")
            or ""
        )

        result.append(
            ProjectListItem(
                id=p.id,
                run_id=p.run_id,
                url=p.url,
                status=p.status,
                script_title=script.get("title") if script else None,
                product_name=product_name,
                scene_count=len(script.get("scenes", [])) if script else 0,
                created_at=p.created_at,
            )
        )
    return result


@router.get("/projects/{run_id}", response_model=ProjectRead)
def get_project(run_id: str, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Get full project data for a specific run_id and user."""
    project = db.query(Project).filter(Project.run_id == run_id, Project.user_id == current_user).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


# ── Product endpoints ──────────────────────────────────────────────────────────

@router.get("/products", response_model=List[ProductRead])
def list_products(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    """Return all products stored in the DB for the current user."""
    products = db.query(Product).filter(Product.user_id == current_user).order_by(Product.id.desc()).all()
    return products


@router.post("/products", response_model=ProductRead)
async def create_product(
    product_name: str = Form(...),
    brand: str = Form(...),
    category: str = Form(...),
    price: str = Form(...),
    description: str = Form(...),
    images: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Create a new product. Optionally upload product images."""
    os.makedirs("uploads", exist_ok=True)
    saved_paths: List[str] = []

    if images:
        for img in images:
            if not img.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="Only image files are allowed.")
            content = await img.read()
            file_id = str(uuid.uuid4())
            ext = Path(img.filename).suffix
            file_path = f"uploads/{file_id}{ext}"
            with open(file_path, "wb") as f:
                f.write(content)
            saved_paths.append(file_path)

    product = Product(
        product_name=product_name,
        brand=brand,
        category=category,
        price=price,
        description=description,
        product_images=saved_paths,
        user_id=current_user,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    product_name: str = Form(...),
    brand: str = Form(...),
    category: str = Form(...),
    price: str = Form(...),
    description: str = Form(...),
    images: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Update an existing product. Newly uploaded images are appended to existing ones."""
    product = db.query(Product).filter(Product.id == product_id, Product.user_id == current_user).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    os.makedirs("uploads", exist_ok=True)
    new_paths: List[str] = []

    if images:
        for img in images:
            if not img.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="Only image files are allowed.")
            content = await img.read()
            file_id = str(uuid.uuid4())
            ext = Path(img.filename).suffix
            file_path = f"uploads/{file_id}{ext}"
            with open(file_path, "wb") as f:
                f.write(content)
            new_paths.append(file_path)

    product.product_name = product_name
    product.brand = brand
    product.category = category
    product.price = price
    product.description = description
    # Append any new images to existing list
    product.product_images = (product.product_images or []) + new_paths

    db.commit()
    db.refresh(product)
    return product



@router.post("/upload-product-images")
async def upload_image(files: List[UploadFile] = File(...)):
    os.makedirs("uploads", exist_ok=True)
    saved_files = []

    for file in files:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only images allowed")
        content = await file.read()
        file_id = str(uuid.uuid4())
        extension = Path(file.filename).suffix
        file_path = f"uploads/{file_id}{extension}"
        with open(file_path, "wb") as f:
            f.write(content)
        saved_files.append(file_path)

    return {
        "status": "done",
        "message": "file uploaded successfully",
        "data": saved_files,
    }