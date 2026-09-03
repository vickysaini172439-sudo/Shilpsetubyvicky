from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database.db import Base


class MarketData(Base):
    """
    Sample/reference prices used by the Smart Pricing tool to sanity-check
    cost-based suggestions against what similar handmade products tend to
    sell for. THIS IS NOT LIVE MARKET DATA - it's a small seeded reference
    table for demo purposes, clearly labeled as such wherever it's shown.
    """
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)
    material = Column(String, nullable=True)
    craft_type = Column(String, nullable=True)
    region = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
