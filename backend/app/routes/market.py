from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.product import Product
from app.routes.deps import get_current_user

router = APIRouter(prefix="/market", tags=["Market Linkage"])

# Static reference guidance - which buyer types typically suit which
# craft categories. This is NOT a live integration with any marketplace -
# it's a readiness/guidance tool, and is labeled as such in the response.
CATEGORY_CHANNELS = {
    "Textiles & Weaving": ["Home Decor Retailers", "Fashion Boutiques", "Export Houses"],
    "Pottery & Ceramics": ["Home Decor Retailers", "Gift Shops", "Hospitality (Hotels/Cafes)"],
    "Wood Carving": ["Home Decor Retailers", "Interior Designers", "Export Houses"],
    "Metal Craft": ["Home Decor Retailers", "Gift Shops", "Wholesale Buyers"],
    "Jewelry & Ornaments": ["Fashion Boutiques", "Online Marketplaces", "Exhibitions/Fairs"],
    "Paintings & Art": ["Art Galleries", "Interior Designers", "Corporate Gifting"],
    "Bamboo & Cane Craft": ["Home Decor Retailers", "Eco-friendly Product Retailers"],
    "Leather Craft": ["Fashion Boutiques", "Wholesale Buyers", "Export Houses"],
    "Embroidery & Needlework": ["Fashion Boutiques", "Home Decor Retailers", "Export Houses"],
    "Other": ["Local Businesses", "Exhibitions/Fairs"],
}

GENERAL_OPPORTUNITIES = [
    {
        "title": "Government Procurement",
        "description": "Sell to government departments and PSUs through GeM (Government e-Marketplace) once registered as a seller.",
        "requires": ["GST/Udyam registration (if applicable)", "Product images", "Pricing"],
    },
    {
        "title": "Online Marketplaces",
        "description": "List your products on platforms built for artisans, like Amazon Karigar or Flipkart Samarth.",
        "requires": ["Published product with photo", "Description", "Price", "Stock availability"],
    },
    {
        "title": "Exhibitions & Fairs",
        "description": "Local and state-level craft melas are a strong way to meet buyers directly and build a customer base.",
        "requires": ["Business card or QR code", "Sample products", "Price list"],
    },
    {
        "title": "Wholesale / B2B Buyers",
        "description": "Retailers and shops looking to stock handmade products in bulk.",
        "requires": ["Bulk pricing", "Consistent quality/quantity", "Delivery timeline"],
    },
]


@router.get("/opportunities")
def get_opportunities(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = current_user.business
    products = (
        db.query(Product).filter(Product.business_id == business.id, Product.status == "published").all()
        if business else []
    )

    product_suggestions = []
    seen_categories = set()
    for p in products:
        if p.category in seen_categories:
            continue
        seen_categories.add(p.category)
        product_suggestions.append({
            "category": p.category,
            "example_product": p.name,
            "suggested_channels": CATEGORY_CHANNELS.get(p.category, CATEGORY_CHANNELS["Other"]),
        })

    return {
        "product_suggestions": product_suggestions,
        "general_opportunities": GENERAL_OPPORTUNITIES,
        "note": "This is guidance based on your product categories, not a live integration with any marketplace yet.",
    }
