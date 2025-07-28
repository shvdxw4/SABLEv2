import os
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Path, Body
from fastapi.responses import FileResponse, StreamingResponse
from pydub import AudioSegment
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime 
from typing import List, Optional

router = APIRouter()

AUDIO_DIR = "audio"
WAVEFORM_DIR = "waveforms"
ALLOWED_EXTS = {"mp3", "wav"}
audio_tags = {}

os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(WAVEFORM_DIR, exist_ok=True)

@router.post("/audio/upload")
async def upload_audio(file: UploadFile = File(...)):
    try:
        #Check extension
        ext = file.filename.split('.')[-1].lower()
        if ext not in ALLOWED_EXTS:
            raise HTTPException(status_code=400, detail="Invalid audio format (mp3/wav only)")
    
        #Save audio file
        ts = datetime.now().strftime("%Y%m%d%H%M%S")
        save_name = f"{ts}_file{file.filename}"
        audio_path = os.path.join(AUDIO_DIR, save_name)
        with open(audio_path, "wb") as f:
            f.write(await file.read())

        #Load with pydub and get waveform data
        audio = AudioSegment.from_file(audio_path)
        samples = audio.get_array_of_samples()
        arr = np.array(samples)
        duration = round(audio.duration_seconds, 2)

        #Generate and save waveforms image
        plt.figure(figsize=(8,2))
        plt.plot(arr, color='purple')
        plt.axis('off')
        waveform_name = save_name.replace(f".{ext}", ".png")
        waveform_path = os.path.join(WAVEFORM_DIR, waveform_name)
        plt.savefig(waveform_path, bbox_inches='tight', pad_inches=0)
        plt.close()

        return {
            "filename": save_name,
            "duration_sec": duration,
            "uploaded_at": ts,
            "audio_path": audio_path,
            "waveform_image": waveform_path,
        }
    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/audio/{filename}/download")
def download_audio_fie(filename: str):
    audio_path = os.path.join(AUDIO_DIR, filename)
    if os.path.exists(audio_path):
        return FileResponse(audio_path, media_type="application/octet-stream", filename=filename, headers={"Content-Disposition": f'attachment; filename="{filename}"'})
    else:
        raise HTTPException(status_code=404, detail="Audio file not found")

@router.get("/audio/")
def list_audio_files():
    files = []
    for fname in os.listdir(AUDIO_DIR):
        if fname.endswith((".mp3", ".wav")):
            path = os.path.join(AUDIO_DIR, fname)
            stat = os.stat(path)
            try:
                audio = AudioSegment.from_file(path)
                duration = round(audio.duration_seconds, 2)
            except Exception:
                duration = None
            waveform_img = os.path.join(WAVEFORM_DIR, fname.rsplit(".", 1)[0] + ".png")
            files.append({
                "filename": fname,
                "size_bytes": stat.st_size,
                "last_modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "duration_sec": duration,
                "waveform_image": waveform_img,
            })
    return {"audio_files": files}

@router.delete("/audio/{filename}")
def delete_audio_file(filename: str = Path(..., description="Name of the audio file to delete")):
    audio_path = os.path.join(AUDIO_DIR, filename)
    waveform_path = os.path.join(WAVEFORM_DIR, filename.rsplit('.', 1)[0] + ".png")
    if os.path.exists(audio_path):
        os.remove(audio_path)
        if os.path.exists(waveform_path):
            os.remove(waveform_path)
        return {"message": f"{filename} deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="File not found")
    
@router.get("/audio/{filename}/waveform")
def get_waveform_image(filename: str):
    name_no_ext = filename.rsplit('.', 1)[0]
    path = os.path.join(WAVEFORM_DIR, f"{name_no_ext}.png")
    if os.path.exists(path):
        return FileResponse(path, media_type="image/png")
    else:
        raise HTTPException(status=404, detail="Waveform image not found")
    
@router.get("/audio/{filename}/stream")
def stream_audio_file(filename: str):
    path = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    ext = filename.rsplit('.', 1)[-1].lower()
    media_type = f"audio/{ext}" if ext in ("mp3", "wav") else "application/octet-stream"
    file = open(path, "rb")
    headers = {"Content-Disposition": f'inline; filename="{filename}"'}
    return FileResponse(path, media_type=media_type, filename=filename, headers=headers)

@router.patch("/audio/{filename}/edit")
def edit_auto_metadata(
    filename: str,
    new_filename: Optional[str] = Body(None),
    tags: Optional[List[str]] = Body(None)
):
    audio_path = os.path.join(AUDIO_DIR, filename)
    waveform_path = os.path.join(WAVEFORM_DIR, filename.rsplit('.', 1)[0] + ".png")

    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    updated_filename = filename
    updated_waveform = waveform_path

    #RENAME audio file and waveform image if needed
    if new_filename:
        new_audio_path = os.path.join(AUDIO_DIR, new_filename)
        new_waveform_path = os.path.joing(WAVEFORM_DIR, new_filename.rsplit('.', 1)[0] + ".png")
        os.renamea(audio_path, new_audio_path)
        if os.path.exists(waveform_path):
            os.rename(waveform_path, new_waveform_path)
        updated_filename = new_filename
        updated_waveform = new_waveform_path
        #If tags existed for old name, transfer them
        if filename in audio_tags:
            audio_tags[new_filename] = audio_tags.pop(filename)

    #UPDATE tags (in-memory for now)
    if tags is not None:
        audio_tags[updated_filename] = tags

    return {
        "message": "Audio metadata updated",
        "filename": "updated_filename",
        "tags": audio_tags.get(updated_filename, []),
        "waveform_image": updated_waveform
    }

@router.get("/audio/search")
def search_audio_files(q: str = Query(..., description="Search by filename or tag")):
    results = []
    for fname in os.listdir(AUDIO_DIR):
        #Skip non-audio files just in case
        if not fname.endswith((".mp3", ".wav")):
            continue
        tags = audio_tags.get(fname, [])
        if q.lower() in fname.lower() or any(q.lower() in tag.lower() for tag in tags):
            results.append({
                "filename": fname,
                "tags": tags,
            })
    if not results:
        raise HTTPException(status_code=404, detail="No matching audio files found")
    return {"results": results}