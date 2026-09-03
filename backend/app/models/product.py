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
    status = Column(String, default="draft")  # "draft" or "published"
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="products")
