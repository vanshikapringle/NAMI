from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from typing import List, Optional
import piexif
from PIL import Image
import io
import urllib.request
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NAMI - Trails & Tales")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Memory(BaseModel):
    title: str
    description: str
    location: str
    date: str
    lat: Optional[float] = None
    lng: Optional[float] = None

@app.get("/")
def read_root():
    return {"message": "Welcome to NAMI API"}

def get_exif_data(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        exif_dict = piexif.load(img.info.get("exif", b""))
        return exif_dict
    except Exception as e:
        return None

def get_lat_lng_from_exif(exif_dict):
    if not exif_dict or "GPS" not in exif_dict:
        return None, None
    try:
        gps_info = exif_dict["GPS"]
        if piexif.GPSIFD.GPSLatitude in gps_info and piexif.GPSIFD.GPSLongitude in gps_info:
            lat = gps_info[piexif.GPSIFD.GPSLatitude]
            lng = gps_info[piexif.GPSIFD.GPSLongitude]
            lat_ref = gps_info.get(piexif.GPSIFD.GPSLatitudeRef, b'N').decode('utf-8')
            lng_ref = gps_info.get(piexif.GPSIFD.GPSLongitudeRef, b'E').decode('utf-8')

            def convert_to_degrees(value):
                d, m, s = value
                return d[0]/d[1] + (m[0]/m[1])/60.0 + (s[0]/s[1])/3600.0

            lat_deg = convert_to_degrees(lat)
            lng_deg = convert_to_degrees(lng)

            if lat_ref != 'N': lat_deg = -lat_deg
            if lng_ref != 'E': lng_deg = -lng_deg

            return lat_deg, lng_deg
        return None, None
    except Exception:
        return None, None


@app.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    contents = await file.read()
    exif = get_exif_data(contents)
    lat, lng = get_lat_lng_from_exif(exif)
    
    location_name = "Unknown Location"
    if lat is not None and lng is not None:
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom=10"
            req = urllib.request.Request(url, headers={'User-Agent': 'NAMI-App/1.0 (local dev)'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                addr = data.get('address', {})
                city = addr.get('city', addr.get('town', addr.get('county', '')))
                state = addr.get('state', '')
                country = addr.get('country', '')
                
                parts = [p for p in [city, state, country] if p]
                if parts:
                    location_name = ", ".join(parts[:2])
                else:
                    name_parts = data.get('display_name', 'Unknown Location').split(',')
                    location_name = name_parts[0].strip() if name_parts else "Unknown Location"
        except Exception as e:
            print("Geocoding error:", e)

    return {
        "filename": file.filename,
        "lat": lat,
        "lng": lng,
        "location_name": location_name
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
