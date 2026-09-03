from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from datetime import datetime
from app.database.db import Base


class PricingRecord(Base):
    __tablename__ = "pricing_records"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    material_cost = Column(Float, nullable=False)
    labour_cost = Column(Float, nullable=False)
    packaging_cost = Column(Float, nullable=False)
    other_cost = Column(Float, nullable=False)
    suggested_min = Column(Float, nullable=False)
    suggested_max = Column(Float, nullable=False)
    recommended_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
