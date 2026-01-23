import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import List

from ..config import settings

router = APIRouter(prefix="/api/icons", tags=["icons"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "icons")
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}


def get_all_icons() -> List[dict]:
    """Get all available icons from assets and uploads."""
    icons = []

    # Get icons from Assets/images
    if os.path.exists(settings.images_path):
        for filename in os.listdir(settings.images_path):
            ext = os.path.splitext(filename)[1].lower()
            if ext in ALLOWED_EXTENSIONS:
                icons.append({
                    "name": filename,
                    "path": f"/api/icons/asset/{filename}",
                    "source": "asset"
                })

    # Get uploaded icons
    if os.path.exists(UPLOAD_DIR):
        for filename in os.listdir(UPLOAD_DIR):
            ext = os.path.splitext(filename)[1].lower()
            if ext in ALLOWED_EXTENSIONS:
                icons.append({
                    "name": filename,
                    "path": f"/api/icons/upload/{filename}",
                    "source": "upload"
                })

    return sorted(icons, key=lambda x: x["name"].lower())


@router.get("")
def list_icons():
    """List all available icons."""
    return {"icons": get_all_icons()}


@router.post("/upload")
async def upload_icon(file: UploadFile = File(...)):
    """Upload a new icon."""
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Generate unique filename
    unique_name = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "name": unique_name,
        "path": f"/api/icons/upload/{unique_name}",
        "source": "upload"
    }


@router.get("/asset/{filename}")
def get_asset_icon(filename: str):
    """Serve an icon from the assets folder."""
    file_path = os.path.join(settings.images_path, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Icon not found")
    return FileResponse(file_path)


@router.get("/upload/{filename}")
def get_uploaded_icon(filename: str):
    """Serve an uploaded icon."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Icon not found")
    return FileResponse(file_path)


@router.delete("/upload/{filename}")
def delete_uploaded_icon(filename: str):
    """Delete an uploaded icon."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Icon not found")

    os.remove(file_path)
    return {"status": "deleted"}
