import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydub import AudioSegment
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime 

router = APIRouter()

AUDIO_DIR = "audio"
WAVEFORM_DIR = "waveforms"
ALLOWED_EXTS = {"mp3, wav"}

os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(WAVEFORM_DIR, exist_ok=True)

@router.post("/audio/upload")
async def upload_audio(file: UploadFile = File(...)):
    #Check extension
    ext = file.filename.split('.')[-1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail="Invalid audio format (mp3/wav only)")
    
    #Save audio file
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    save_name = f"{ts}_file{file.name}"
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