from sqlalchemy.orm import Session
from app.models.market_data import MarketData

# Small, clearly-labeled SAMPLE/REFERENCE dataset - approximate typical
# retail prices for handmade products in each category. This is NOT live
# market data (the app never claims that) - it exists so the Smart
# Pricing tool has something realistic to compare a new artisan's costs
# against, even on day one with an empty database. Replace/expand this
# with real aggregated data later if it becomes available.
SAMPLE_MARKET_DATA = [
    ("Textiles & Weaving", "Cotton", 450), ("Textiles & Weaving", "Cotton", 650),
    ("Textiles & Weaving", "Silk", 1200), ("Textiles & Weaving", "Silk", 1800),
    ("Pottery & Ceramics", "Clay", 250), ("Pottery & Ceramics", "Clay", 450),
    ("Pottery & Ceramics", "Terracotta", 600), ("Pottery & Ceramics", "Terracotta", 850),
    ("Wood Carving", "Wood", 500), ("Wood Carving", "Wood", 900),
    ("Wood Carving", "Sheesham Wood", 1500), ("Wood Carving", "Sheesham Wood", 2200),
    ("Metal Craft", "Brass", 600), ("Metal Craft", "Brass", 1100),
    ("Metal Craft", "Copper", 900), ("Metal Craft", "Copper", 1600),
    ("Jewelry & Ornaments", "Silver", 800), ("Jewelry & Ornaments", "Silver", 1800),
    ("Jewelry & Ornaments", "Beads", 300), ("Jewelry & Ornaments", "Beads", 600),
    ("Paintings & Art", "Canvas", 800), ("Paintings & Art", "Canvas", 1500),
    ("Paintings & Art", "Paper", 400), ("Paintings & Art", "Paper", 900),
    ("Bamboo & Cane Craft", "Bamboo", 200), ("Bamboo & Cane Craft", "Bamboo", 550),
    ("Leather Craft", "Leather", 700), ("Leather Craft", "Leather", 1800),
    ("Embroidery & Needlework", "Cotton", 400), ("Embroidery & Needlework", "Cotton", 1300),
    ("Other", None, 300), ("Other", None, 1000),
]


def seed_market_data_if_empty(db: Session) -> None:
    if db.query(MarketData).first():
        return  # already seeded, don't duplicate on every restart

    for category, material, price in SAMPLE_MARKET_DATA:
        db.add(MarketData(category=category, material=material, price=price, region="India (sample)"))
    db.commit()
