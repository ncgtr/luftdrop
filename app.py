import os
from pathlib import Path
import shutil
from fastapi import FastAPI, UploadFile, File, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn
import socket
import webbrowser
from pydantic import BaseModel

class DeleteFileRequest(BaseModel):
    filename: str

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
templates.env.cache = None

UPLOAD_DIR = BASE_DIR / "archive"
UPLOAD_DIR.mkdir(exist_ok=True)


@app.on_event("startup")
def launch_browser():
    webbrowser.open("http://127.0.0.1:8000") # Launch page immediately for easier access

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Check network routing path
        s.connect(('8.8.8.8', 1))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()
    return local_ip

@app.get("/", response_class=HTMLResponse)
async def serve_frontend(request: Request):
    server_ip = f"Running on {get_local_ip()}:8000"
    return templates.TemplateResponse(request, "index.html", {"server_ip": server_ip})


@app.get("/files")
async def list_archive_files():
    try:
        file_paths = sorted(
            [f for f in UPLOAD_DIR.iterdir() if f.is_file()],
            key=os.path.getmtime,
            reverse=True
        )
        return {"files": [f.name for f in file_paths]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read archive index: {str(e)}")


@app.get("/download/{filename}")
async def download_file(filename: str):
    target_path = UPLOAD_DIR / filename
    
    # Block directory traversal hacking attempts
    if not target_path.resolve().parent == UPLOAD_DIR.resolve():
        raise HTTPException(status_code=403, detail="Access denied.")
    
    # Make sure file exists
    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(status_code=404, detail="Requested file does not exist in archive.")

    return FileResponse(
        path=target_path, 
        filename=filename, 
        media_type="application/octet-stream"
    )


@app.post("/upload")
async def receive_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing valid filename header descriptor.")

    safe_filename = Path(file.filename).name
    target_path = UPLOAD_DIR / safe_filename

    try:
        with target_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Local storage write failure: {str(e)}")
    finally:
        file.file.close()

    return {"status": "success", "saved_as": safe_filename}

@app.post("/delete")
async def delete_file(payload: DeleteFileRequest):
    filename = payload.filename
    if not filename:
        raise HTTPException(status_code=400, detail="Missing valid filename.")

    # Prevent directory traversal vulnerability
    safe_filename = Path(filename).name
    target_path = UPLOAD_DIR / safe_filename

    if not target_path.resolve().parent == UPLOAD_DIR.resolve():
        raise HTTPException(status_code=403, detail="Access denied.")

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(status_code=404, detail="File not found.")

    try:
        # Delete the file safely
        target_path.unlink()
        return {"status": "success", "deleted": safe_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File deletion failure: {str(e)}")

@app.delete("/purge")
async def purge_server():
    try:
        for file_path in UPLOAD_DIR.iterdir():
            if file_path.is_file():
                file_path.unlink() # Delete file
        return {"status": "success", "message": "Archive purged."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to purge archive: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)