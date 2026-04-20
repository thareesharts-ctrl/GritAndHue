import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", ""), 
  api_key = os.getenv("CLOUDINARY_API_KEY", ""), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET", "") 
)

def upload_image(file) -> str:
    """Uploads an image to cloudinary and returns the URL."""
    try:
        result = cloudinary.uploader.upload(file)
        return result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary Error: {e}")
        return None
