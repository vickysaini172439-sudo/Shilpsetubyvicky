from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String, nullable=False)
    craft_category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    state = Column(String, nullable=True)
    slug = Column(String, unique=True, index=True, nullable=False)

    # Digital storefront settings (Phase 10)
    # The logo bytes live here for the same reason product photos do -
    # anything written to disk is destroyed on the next deploy. See
    # services/stored_image.py.
    logo_data = Column(LargeBinary, nullable=True)
    logo_mime = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    whatsapp_number = Column(String, nullable=True)
    instagram_url = Column(String, nullable=True)
    facebook_url = Column(String, nullable=True)
    is_published = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="business")
    products = relationship("Product", back_populates="business", cascade="all, delete-orphan")
