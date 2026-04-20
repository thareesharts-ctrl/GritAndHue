from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.models.mysql_models import Category, Product, Admin, Inquiry
from app.api.v1 import products

# Create all MySQL tables immediately upon deployment
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Day By Day E-Commerce API", version="1.0.0")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Routers
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
# Other routers like admins, inquiries, and categories can be added identically.

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Day By Day Backend Running!"}
