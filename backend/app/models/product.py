from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)

    name = Column(String, nullable=False)
    name_hindi = Column(String, nullable=True)
    description_english = Column(Text, nullable=True)
    description_hindi = Column(Text, nullable=True)
    material = Column(String, nullable=True)
    category = Column(String, nullable=True)
    craft_type = Column(String, nullable=True)
    price = Column(Float, nullable=True)

    # --- Catalogue richness (added so the public store actually looks
    # --- like a shop rather than a grid of thumbnails) ----------------
    # The AI Catalogue was already generating features and a marketing
    # caption on every run, and we were throwing both away. Storing them
    # is what lets a visitor see WHY a piece is worth buying instead of
    # just its name and price.
    #
    # features: one feature per line. Deliberately plain text rather than
    # JSON - it survives a hand edit by a non-technical user, and a
    # malformed line degrades to a harmless extra bullet instead of
    # throwing a parse error on the public page.
    features = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    # How many the artisan currently has to sell. Null means "not tracked",
    # which is different from 0 ("sold out") - so the storefront can stay
    # quiet about stock for artisans who do not count it.
    stock_quantity = Column(Integer, nullable=True)

    status = Column(String, default="draft")  # "draft" or "published"
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="products")
