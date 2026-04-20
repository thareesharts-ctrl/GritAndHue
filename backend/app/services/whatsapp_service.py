import urllib.parse
import os
from dotenv import load_dotenv

load_dotenv()

ADMIN_WHATSAPP_NUMBER = os.getenv("ADMIN_WHATSAPP_NUMBER", "919876543210")

def generate_product_inquiry_url(product_name: str, price: float, customer_name: str = "") -> str:
    """Generates a WhatsApp URL for users to inquire about a product."""
    greeting = f"Hello, my name is {customer_name}. " if customer_name else "Hello! "
    text = f"{greeting}I'm interested in the product: *{product_name}* (Rs.{price}). Could you provide more details?"
    encoded_text = urllib.parse.quote(text)
    return f"https://wa.me/{ADMIN_WHATSAPP_NUMBER}?text={encoded_text}"
